"""
DentAI inference — loads the trained E2EFusionModel and exposes predict().
CBCT-only path: skips text when no text fields are provided.
Expects model artifacts in ./artifacts/:
  best_e2e_fold.pt, age_scaler.pkl, config.json
Downloads MambaMIM + ClinicalModernBERT from HuggingFace at first load.
"""

import os, pickle, json, re
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from scipy.ndimage import zoom
import SimpleITK as sitk
from transformers import AutoTokenizer, AutoModel
from huggingface_hub import hf_hub_download

# ──────────────────────── constants (mirrors notebook config) ────────────────────────

DISEASE_ORDER = [
    "pulpitis", "caries", "impacted_tooth", "damaged_or_missing_tooth",
]
NUM_CLASSES = len(DISEASE_ORDER)
TEXT_FIELDS = [
    "main_appeal", "subsequent", "present_medical_history", "diagnosis", "main_appeal_reason",
]
N_FIELDS = len(TEXT_FIELDS)

HIDDEN_SIZE = 768
EMBED_DIM = 256
ATTN_DIM = 64
HEAD_DIM = 64
DROPOUT = 0.5
CBCT_FEAT_DIM = 256

INPUT_SHAPE = (96, 96, 96)
HU_MIN, HU_MAX = -500.0, 2500.0

BERT_MODEL_NAME = "Simonlee711/Clinical_ModernBERT"
MAMBAMIM_REPO = "FengheTan9/MambaMIM"
MAMBAMIM_FILE = "mambamim_mask75.pth"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ──────────────────────── model classes ────────────────────────

class PurePyTorchSSM(nn.Module):
    def __init__(self, d_model, d_state=16, d_conv=4, expand=2):
        super().__init__()
        self.d_model = d_model
        self.d_state = d_state
        self.d_inner = int(expand * d_model)
        self.in_proj = nn.Linear(d_model, self.d_inner * 2, bias=False)
        self.conv1d = nn.Conv1d(
            self.d_inner, self.d_inner,
            kernel_size=d_conv, padding=d_conv - 1,
            groups=self.d_inner, bias=True,
        )
        self.x_proj = nn.Linear(self.d_inner, d_state * 2 + self.d_inner, bias=False)
        self.dt_proj = nn.Linear(self.d_inner, self.d_inner, bias=True)
        A = torch.arange(1, d_state + 1, dtype=torch.float).unsqueeze(0).repeat(self.d_inner, 1)
        self.A_log = nn.Parameter(torch.log(A))
        self.D = nn.Parameter(torch.ones(self.d_inner))
        self.out_proj = nn.Linear(self.d_inner, d_model, bias=False)

    def forward(self, x):
        B, L, D = x.shape
        xz = self.in_proj(x)
        x_, z = xz.chunk(2, dim=-1)
        x_ = x_.transpose(1, 2)
        x_ = self.conv1d(x_)[..., :L]
        x_ = x_.transpose(1, 2)
        x_ = F.silu(x_)
        xBC = self.x_proj(x_)
        dt_raw, B_mat, C_mat = xBC.split([self.d_inner, self.d_state, self.d_state], dim=-1)
        dt = F.softplus(self.dt_proj(dt_raw))
        A = -torch.exp(self.A_log)
        dA = torch.exp(dt.unsqueeze(-1) * A)
        dB = dt.unsqueeze(-1) * B_mat.unsqueeze(2)
        h = torch.zeros(B, self.d_inner, self.d_state, device=x.device, dtype=x.dtype)
        ys = []
        for i in range(L):
            h = dA[:, i] * h + dB[:, i] * x_[:, i, :].unsqueeze(-1)
            y = (h * C_mat[:, i, :].unsqueeze(1)).sum(-1)
            ys.append(y)
        y = torch.stack(ys, dim=1)
        y = y + x_ * self.D
        y = y * F.silu(z)
        return self.out_proj(y)


class MambaBlock3D(nn.Module):
    def __init__(self, dim, d_state=16, d_conv=4, expand=2, dropout=0.3):
        super().__init__()
        self.norm = nn.LayerNorm(dim)
        self.ssm = PurePyTorchSSM(dim, d_state=d_state, d_conv=d_conv, expand=expand)
        self.drop = nn.Dropout(dropout)

    def forward(self, x):
        B, C, D, H, W = x.shape
        seq = x.flatten(2).transpose(1, 2)
        seq = seq + self.drop(self.ssm(self.norm(seq)))
        return seq.transpose(1, 2).reshape(B, C, D, H, W)


class LightMamba3DEncoder(nn.Module):
    def __init__(self, in_channels=1, embed_dim=128, n_blocks=3, out_dim=256, dropout=0.3):
        super().__init__()
        self.patch_embed = nn.Sequential(
            nn.Conv3d(in_channels, embed_dim // 2, kernel_size=4, stride=4),
            nn.GELU(),
            nn.Conv3d(embed_dim // 2, embed_dim, kernel_size=2, stride=2),
            nn.GELU(),
        )
        self.blocks = nn.ModuleList([
            MambaBlock3D(embed_dim, d_state=16, d_conv=4, expand=2, dropout=dropout)
            for _ in range(n_blocks)
        ])
        self.norm = nn.LayerNorm(embed_dim)
        self.pool = nn.AdaptiveAvgPool3d(1)
        self.proj = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(embed_dim, out_dim),
        )

    def forward(self, x):
        x = self.patch_embed(x)
        for blk in self.blocks:
            x = blk(x)
        B, C, D, H, W = x.shape
        x = self.norm(x.flatten(2).transpose(1, 2)).transpose(1, 2).reshape(B, C, D, H, W)
        return self.proj(self.pool(x).flatten(1))


class StructuredEncoder(nn.Module):
    def __init__(self, in_dim=3, embed_dim=EMBED_DIM, dropout=DROPOUT):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(in_dim, 128), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(128, embed_dim), nn.ReLU(),
        )
        self.miss = nn.Embedding(1, embed_dim)

    def forward(self, feats, pres):
        out = self.mlp(feats)
        miss = self.miss(torch.zeros(feats.size(0), dtype=torch.long, device=feats.device))
        return out * pres + miss * (1 - pres)


class TextEncoder(nn.Module):
    def __init__(self, hidden=HIDDEN_SIZE, embed_dim=EMBED_DIM, attn_dim=ATTN_DIM, dropout=DROPOUT):
        super().__init__()
        self.proj = nn.Linear(hidden, embed_dim)
        self.q_lin = nn.Linear(embed_dim, attn_dim)
        self.k_lin = nn.Linear(embed_dim, attn_dim)
        self.norm = nn.LayerNorm(embed_dim)
        self.drop = nn.Dropout(0.6)
        self.miss = nn.Embedding(1, embed_dim)

    def forward(self, fields, pres):
        x = torch.relu(self.proj(fields.float()))
        q = x.mean(1, keepdim=True)
        k = self.k_lin(x)
        qp = self.q_lin(q)
        w = torch.softmax(torch.bmm(qp, k.transpose(1, 2)) / (ATTN_DIM ** 0.5), dim=-1)
        txt = self.drop(self.norm((w @ x).squeeze(1)))
        miss = self.miss(torch.zeros(fields.size(0), dtype=torch.long, device=fields.device))
        return txt * pres.float() + miss * (1 - pres.float())


class CBCTEncoder(nn.Module):
    def __init__(self, in_dim=256, embed_dim=EMBED_DIM, dropout=DROPOUT):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, 256), nn.ReLU(), nn.LayerNorm(256),
            nn.Dropout(dropout), nn.Linear(256, embed_dim), nn.LayerNorm(embed_dim),
        )

    def forward(self, feat):
        return self.net(feat)


class ClassHead(nn.Module):
    def __init__(self, in_dim=EMBED_DIM, n_classes=NUM_CLASSES, dropout=DROPOUT):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, HEAD_DIM), nn.ReLU(),
            nn.Dropout(dropout), nn.Linear(HEAD_DIM, n_classes),
        )

    def forward(self, x):
        return self.net(x)


class LateFusion(nn.Module):
    def __init__(self, n_mod=3, n_classes=NUM_CLASSES):
        super().__init__()
        self.w = nn.Parameter(torch.ones(n_mod, n_classes))

    def forward(self, st_l, tx_l, cb_l, sp, tp, cp):
        logits = torch.stack([st_l, tx_l, cb_l], dim=1)
        masks = torch.cat([sp, tp, cp], dim=1).unsqueeze(-1)
        w = torch.softmax(self.w, dim=0).unsqueeze(0)
        wm = w * masks
        wm = wm / (wm.sum(1, keepdim=True) + 1e-6)
        return (wm * logits).sum(1)


class E2EFusionModel(nn.Module):
    def __init__(self, mamba_enc):
        super().__init__()
        self.cnn = mamba_enc
        self.struct_enc = StructuredEncoder()
        self.text_enc = TextEncoder()
        self.cbct_enc = CBCTEncoder()
        self.struct_head = ClassHead()
        self.text_head = ClassHead()
        self.cbct_head = ClassHead()
        self.fusion = LateFusion()

    def forward(self, vol, cbct_pres, fields, text_pres, struct, struct_pres):
        B = vol.size(0)
        cnn_out = torch.zeros(B, 256, dtype=torch.float32, device=vol.device)
        has_cbct = (cbct_pres.squeeze(1) > 0.5)
        if has_cbct.any():
            cnn_out[has_cbct] = self.cnn(vol[has_cbct]).float()
        cb_emb = self.cbct_enc(cnn_out)
        cb_l = self.cbct_head(cb_emb)
        tx_emb = self.text_enc(fields, text_pres)
        tx_l = self.text_head(tx_emb)
        st_emb = self.struct_enc(struct.float(), struct_pres.float())
        st_l = self.struct_head(st_emb)
        fused = self.fusion(
            st_l, tx_l, cb_l,
            struct_pres.float(), text_pres.float(), cbct_pres.float(),
        )
        return {"logits": fused, "cbct_aux_logits": cb_l, "text_logits": tx_l, "struct_logits": st_l}


# ──────────────────────── CBCT preprocessing ────────────────────────

def preprocess_cbct(path_or_array):
    """NIfTI path or raw numpy → (1, 96, 96, 96) float32 in [0, 1]."""
    if isinstance(path_or_array, (str, Path)):
        vol = sitk.GetArrayFromImage(sitk.ReadImage(str(path_or_array))).astype(np.float32)
    else:
        vol = path_or_array.astype(np.float32)

    vol = np.nan_to_num(vol, nan=HU_MIN, posinf=HU_MAX, neginf=HU_MIN)
    vol = np.clip(vol, HU_MIN, HU_MAX)

    c = np.argwhere(vol > -400.0)
    if c.size:
        z0, y0, x0 = c.min(0)
        z1, y1, x1 = c.max(0)
        vol = vol[z0:z1 + 1, y0:y1 + 1, x0:x1 + 1]

    vol = vol[:int(vol.shape[0] * 0.65), :, :]
    vmin, vmax = vol.min(), vol.max()
    vol = (vol - vmin) / (vmax - vmin + 1e-9)

    zf = [t / max(s, 1) for t, s in zip(INPUT_SHAPE, vol.shape)]
    vol = zoom(vol, zf, order=1)
    vol = vol[:INPUT_SHAPE[0], :INPUT_SHAPE[1], :INPUT_SHAPE[2]]
    vol = np.pad(vol, [(0, INPUT_SHAPE[k] - vol.shape[k]) for k in range(3)], mode="constant")
    return vol[np.newaxis, ...].astype(np.float32)


# ──────────────────────── text embedding ────────────────────────

_tokenizer = None
_bert_model = None

def _ensure_bert():
    global _tokenizer, _bert_model
    if _bert_model is None:
        print(f"Loading {BERT_MODEL_NAME} ...")
        _tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL_NAME)
        _bert_model = AutoModel.from_pretrained(BERT_MODEL_NAME).eval().to(DEVICE)


def embed_text_fields(texts: dict) -> tuple:
    """dict of field→value → (N_FIELDS, HIDDEN_SIZE) array + presence flag."""
    _ensure_bert()
    emb = np.zeros((N_FIELDS, HIDDEN_SIZE), dtype=np.float32)
    present = False
    for i, field in enumerate(TEXT_FIELDS):
        text = texts.get(field, "")
        if not isinstance(text, str) or text.strip() == "":
            continue
        present = True
        enc = _tokenizer(text, truncation=True, max_length=512, return_tensors="pt")
        ids = enc["input_ids"].to(DEVICE)
        mask = enc["attention_mask"].to(DEVICE)
        with torch.no_grad():
            out = _bert_model(input_ids=ids, attention_mask=mask, output_hidden_states=True)
            last4 = torch.stack(out.hidden_states[-4:], 0).mean(0)
            m = mask.unsqueeze(-1).float()
            emb[i] = ((last4 * m).sum(1) / m.sum(1).clamp(min=1e-9)).squeeze(0).cpu().numpy()
    return emb, (1.0 if present else 0.0)


# ──────────────────────── model loading ────────────────────────

_model = None
_scaler = None
_config = None
_AGE_MEAN = None

ARTIFACT_DIR = Path(os.environ.get("ARTIFACT_DIR", "artifacts"))


def _load_mamba_encoder():
    enc = LightMamba3DEncoder(in_channels=1, embed_dim=128, n_blocks=3, out_dim=CBCT_FEAT_DIM, dropout=0.4)
    mamba_path = ARTIFACT_DIR / "mambamim_mask75.pth"
    if not mamba_path.exists():
        src = hf_hub_download(repo_id=MAMBAMIM_REPO, filename=MAMBAMIM_FILE)
        import shutil
        shutil.copy(src, mamba_path)
    ck = torch.load(mamba_path, map_location="cpu", weights_only=False)
    enc_sd = enc.state_dict()
    loaded = 0
    for k, v in ck.items():
        k2 = k.replace("encoder.", "").replace("module.", "")
        if k2 in enc_sd and enc_sd[k2].shape == v.shape:
            enc_sd[k2] = v
            loaded += 1
    enc.load_state_dict(enc_sd, strict=False)
    enc.eval()
    return enc.to(DEVICE)


def load_model():
    global _model, _scaler, _config, _AGE_MEAN
    if _model is not None:
        return _model

    # config
    with open(ARTIFACT_DIR / "config.json") as f:
        _config = json.load(f)

    # scaler
    with open(ARTIFACT_DIR / "age_scaler.pkl", "rb") as f:
        scaler_data = pickle.load(f)
    from sklearn.preprocessing import StandardScaler
    _scaler = StandardScaler()
    # scikit-learn pickle usually restores fully, but only need mean/scale
    _scaler = scaler_data["scaler"]
    _AGE_MEAN = scaler_data["age_mean"]

    # model
    mamba_enc = _load_mamba_encoder()
    _model = E2EFusionModel(mamba_enc).to(DEVICE)
    ckpt = torch.load(ARTIFACT_DIR / "best_e2e_fold.pt", map_location=DEVICE, weights_only=True)
    _model.load_state_dict(ckpt, strict=True)
    _model.eval()
    print(f"Model loaded on {DEVICE}")
    return _model


# ──────────────────────── public API ────────────────────────

def predict(cbct_file, text_fields=None, age=None, sex=None):
    """
    Run inference on a single patient.

    Parameters
    ----------
    cbct_file : str, Path, or bytes
        Path to a NIfTI file or raw file bytes (will be written to temp).
    text_fields : dict, optional
        Dict mapping TEXT_FIELDS keys to clinical text strings.
    age : float, optional
        Patient age.
    sex : str, optional
        "male" or "female".

    Returns
    -------
    dict with keys:
        diseases : dict  {name: probability (0-1)}
        predicted : list of disease names above threshold
        thresholds : list of per-disease thresholds
    """
    model = load_model()
    model.eval()

    # --- CBCT ---
    if isinstance(cbct_file, bytes):
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".nii", delete=False) as tmp:
            tmp.write(cbct_file)
            cbct_path = tmp.name
        vol = preprocess_cbct(cbct_path)
        os.unlink(cbct_path)
    else:
        vol = preprocess_cbct(cbct_file)

    vol_t = torch.from_numpy(vol).unsqueeze(0).to(DEVICE)  # (1,1,96,96,96)
    cbct_pres = torch.tensor([[1.0]], device=DEVICE)

    # --- text ---
    text_fields = text_fields or {}
    emb, text_p = embed_text_fields(text_fields)
    field_t = torch.from_numpy(emb).unsqueeze(0).to(DEVICE)   # (1,5,768)
    text_pres_t = torch.tensor([[text_p]], device=DEVICE)

    # --- structured ---
    if age is not None and not np.isnan(age):
        age_norm = float(_scaler.transform([[float(age)]])[0, 0])
    else:
        age_norm = 0.0
    sex_male = 1.0 if sex and str(sex).strip().lower() == "male" else 0.0
    sex_female = 1.0 if sex and str(sex).strip().lower() == "female" else 0.0
    struct = torch.tensor([[[age_norm, sex_male, sex_female]]], device=DEVICE)
    struct_pres = torch.tensor([[1.0 if (age is not None or sex) else 0.0]], device=DEVICE)

    # --- inference ---
    with torch.no_grad():
        out = model(vol_t, cbct_pres, field_t, text_pres_t, struct, struct_pres)

    logits = out["logits"][0].cpu().numpy()          # (4,)
    probs = 1.0 / (1.0 + np.exp(-logits))             # sigmoid

    # per-disease thresholds from CV (fallback 0.5)
    thresholds = _config.get("thresholds", [0.5] * NUM_CLASSES)

    diseases = {DISEASE_ORDER[i]: float(probs[i]) for i in range(NUM_CLASSES)}
    predicted = [DISEASE_ORDER[i] for i in range(NUM_CLASSES) if probs[i] >= thresholds[i]]
    if not predicted:
        predicted = [DISEASE_ORDER[int(np.argmax(probs))]]

    return {
        "diseases": diseases,
        "predicted": predicted,
        "thresholds": thresholds,
    }
