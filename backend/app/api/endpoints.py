import io
import csv
import json
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse, Response

from app.core.config import settings
from app.algorithms.registry import registry
from app.algorithms.huffman import HuffmanCoder
from app.services.experiment_service import experiment_service
from app.schemas.api_models import (
    HealthResponse,
    AlgorithmInfo,
    ImageAnalysisResponse,
    HuffmanAnalyzeRequest,
    CompressionResult
)

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health():
    algos = [a["id"] for a in registry.list_algorithms()]
    jp2_avail = any(a["id"] == "jpeg2000" and a["is_available"] for a in registry.list_algorithms())
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "codecs_available": algos,
        "jpeg2000_enabled": jp2_avail
    }

@router.get("/algorithms", response_model=List[AlgorithmInfo])
def get_algorithms():
    return registry.list_algorithms()

@router.post("/images/analyze", response_model=ImageAnalysisResponse)
async def analyze_image_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        return experiment_service.analyze_image(contents, file.filename or "uploaded_image")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/compress", response_model=CompressionResult)
async def compress_endpoint(
    file: UploadFile = File(...),
    algorithm_id: str = Form(...),
    params: Optional[str] = Form(None)
):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    parsed_params = {}
    if params:
        try:
            parsed_params = json.loads(params)
        except Exception:
            raise HTTPException(status_code=400, detail="Parameters must be a valid JSON string.")
            
    try:
        return experiment_service.run_compression(
            file_bytes=contents,
            filename=file.filename or "image.png",
            algorithm_id=algorithm_id,
            params=parsed_params
        )
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression pipeline failed: {str(e)}")

@router.post("/experiments")
async def batch_experiments_endpoint(
    file: UploadFile = File(...),
    configurations: str = Form(...)
):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        configs = json.loads(configurations)
    except Exception:
        raise HTTPException(status_code=400, detail="Configurations must be a valid JSON array.")

    results = experiment_service.run_batch_experiments(
        file_bytes=contents,
        filename=file.filename or "batch_image.png",
        configurations=configs
    )
    return results

@router.get("/experiments")
def list_experiments_endpoint():
    return experiment_service.list_experiments()

@router.get("/experiments/{experiment_id}")
def get_experiment_endpoint(experiment_id: str):
    exp = experiment_service.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment ID not found.")
    return exp

@router.get("/experiments/{experiment_id}/download")
def download_artifact_endpoint(experiment_id: str):
    artifact_data = experiment_service.get_artifact_file(experiment_id)
    if not artifact_data:
        raise HTTPException(status_code=404, detail="Artifact file not found for this experiment.")
    path, filename, mime = artifact_data
    return FileResponse(
        path=path,
        media_type=mime,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/experiments/{experiment_id}/reconstructed")
def get_reconstructed_endpoint(experiment_id: str):
    path = experiment_service.get_reconstructed_file(experiment_id)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Reconstructed image not found.")
    return FileResponse(
        path=path,
        media_type="image/png",
        filename="reconstructed.png"
    )

@router.get("/experiments/{experiment_id}/original")
def get_original_endpoint(experiment_id: str):
    path = experiment_service.get_original_file(experiment_id)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Original image not found.")
    return FileResponse(
        path=path,
        media_type="image/png",
        filename="original.png"
    )

@router.get("/experiments/export/csv")
def export_experiments_csv():
    """Generates an academically rigorous CSV of all experimental runs for project reporting."""
    experiments = experiment_service.list_experiments()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Experiment ID",
        "Image Name",
        "Algorithm ID",
        "Algorithm Name",
        "Category",
        "Parameters",
        "Original Size (Bytes)",
        "Compressed Size (Bytes)",
        "Compression Ratio (CR)",
        "Space Saved (%)",
        "Bits Per Pixel (bpp)",
        "MSE",
        "PSNR (dB)",
        "SSIM",
        "Exact Match (Lossless)",
        "Encoding Time (ms)",
        "Decoding Time (ms)",
        "Total Time (ms)",
        "Artifact File"
    ])
    
    for exp in experiments:
        m = exp.get("metrics", {})
        writer.writerow([
            exp.get("experiment_id", ""),
            exp.get("filename", ""),
            exp.get("algorithm_id", ""),
            exp.get("algorithm_name", ""),
            exp.get("category", ""),
            json.dumps(exp.get("parameters", {})),
            m.get("original_size_bytes", ""),
            m.get("compressed_size_bytes", ""),
            m.get("compression_ratio", ""),
            m.get("space_saved_percent", ""),
            m.get("bits_per_pixel", ""),
            m.get("mse", ""),
            m.get("psnr", "Infinity" if m.get("is_infinite_psnr") else ""),
            m.get("ssim", ""),
            m.get("is_exact_match", False),
            m.get("encoding_time_ms", ""),
            m.get("decoding_time_ms", ""),
            m.get("total_time_ms", ""),
            exp.get("artifact_info", {}).get("filename", "")
        ])
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="imagelab_experiments_report.csv"'}
    )

@router.post("/huffman/analyze")
def analyze_huffman_endpoint(req: HuffmanAnalyzeRequest):
    """Educational endpoint for testing Huffman entropy coding on text or byte sequences."""
    text = req.text_data or "ADVANCED_COMPRESSION_TECHNIQUES_HUFFMAN_CODING_LAB"
    data = text.encode("utf-8")
    return HuffmanCoder.analyze(data)
