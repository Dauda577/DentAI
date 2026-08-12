"""Modal deployment for the DentAI CBCT + clinical-text inference service.

Serves the same FastAPI app as dentai_deployment/main.py (single source of
truth): the deployment directory, including model weights, is baked straight
into the image, and the Clinical_ModernBERT text encoder is pre-downloaded at
build time so there is no HuggingFace lookup at runtime.

Deploy (requires the Modal CLI + `modal token new` first):

    cd inference/modal && modal deploy modal_app.py
"""

from pathlib import Path

import modal

DEPLOY_DIR = Path.home() / "Downloads" / "dentai_deployment"
BERT_MODEL = "Simonlee711/Clinical_ModernBERT"
REMOTE_ROOT = "/root/deploy"
CACHE_DIR = "/model"  # baked into the image at build time

app = modal.App("dentai-inference")


def _download_bert():
    # Pre-downloads the Clinical_ModernBERT tokenizer + weights so the lazy
    # load in inference.py hits the local image cache, never the network.
    from transformers import AutoModel, AutoTokenizer

    AutoTokenizer.from_pretrained(BERT_MODEL, cache_dir=CACHE_DIR)
    AutoModel.from_pretrained(BERT_MODEL, cache_dir=CACHE_DIR)

image = (
    modal.Image.debian_slim(python_version="3.11")
    # CUDA torch first (the service runs on a T4), then pinned deps.
    .pip_install("torch==2.5.1", index_url="https://download.pytorch.org/whl/cu121")
    .pip_install(
        "fastapi==0.110.0",
        "python-multipart==0.0.9",
        "monai>=1.3.0",
        "transformers>=4.38.0",
        "SimpleITK>=2.3.1",
        "scipy>=1.12.0",
        "numpy>=1.26.0",
        "scikit-learn>=1.4.0",
        "pandas>=2.2.0",
        "pydicom>=2.4.0",
    )
    # Bake the whole deployment (main.py, model.py, inference.py, artifacts/)
    # into the image. Artifacts are gitignored, so this is deploy-only.
    .add_local_dir(str(DEPLOY_DIR), remote_path=REMOTE_ROOT, copy=True)
    .env({"TRANSFORMERS_CACHE": CACHE_DIR, "HF_HUB_CACHE": CACHE_DIR})
    .run_function(
        _download_bert,
        env={"TRANSFORMERS_CACHE": CACHE_DIR, "HF_HUB_CACHE": CACHE_DIR},
        timeout=1200,
    )
)


# Keep a single warm container so the first request after inactivity starts
# fast, and inference has predictable costs.
@app.function(
    image=image,
    gpu="T4",
    max_containers=1,
    scaledown_window=300,
)
@modal.concurrent(max_inputs=2)
@modal.asgi_app()
def web():
    # Service modules live at REMOTE_ROOT (baked image layer), so relative
    # imports and artifact discovery behave exactly like local runs.
    import sys

    sys.path.insert(0, REMOTE_ROOT)

    from main import app as fastapi_app

    return fastapi_app