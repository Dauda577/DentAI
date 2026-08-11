"""FastAPI inference endpoint for DentAI diagnosis."""

import os, tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from predict import predict, load_model, TEXT_FIELDS, DISEASE_ORDER

app = FastAPI(title="DentAI Diagnosis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    load_model()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/diagnose")
async def diagnose(
    cbct: UploadFile = File(...),
    main_appeal: str = Form(""),
    subsequent: str = Form(""),
    present_medical_history: str = Form(""),
    diagnosis: str = Form(""),
    main_appeal_reason: str = Form(""),
    age: float = Form(None),
    sex: str = Form(""),
):
    if not cbct.filename:
        raise HTTPException(400, "CBCT file is required.")

    suffix = Path(cbct.filename).suffix or ".nii"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await cbct.read())
        cbct_path = tmp.name

    try:
        text_fields = {
            "main_appeal": main_appeal,
            "subsequent": subsequent,
            "present_medical_history": present_medical_history,
            "diagnosis": diagnosis,
            "main_appeal_reason": main_appeal_reason,
        }
        result = predict(
            cbct_file=cbct_path,
            text_fields=text_fields,
            age=age if age != -1 else None,
            sex=sex if sex else None,
        )
        return result
    finally:
        os.unlink(cbct_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
