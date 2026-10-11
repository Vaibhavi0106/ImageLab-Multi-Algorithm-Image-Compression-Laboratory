from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class HealthResponse(BaseModel):
    status: str
    version: str
    codecs_available: List[str]
    jpeg2000_enabled: bool

class AlgorithmInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    is_available: bool
    parameters: Dict[str, Any]

class ImageAnalysisResponse(BaseModel):
    filename: str
    file_size_bytes: int
    width: int
    height: int
    aspect_ratio: float
    mode: str
    channels: int
    thumbnail_b64: str
    entropy_analysis: Dict[str, Any]

class HuffmanAnalyzeRequest(BaseModel):
    text_data: Optional[str] = None
    sample_type: Optional[str] = "text"

class CompressionMetrics(BaseModel):
    original_size_bytes: int
    compressed_size_bytes: int
    compression_ratio: float
    space_saved_percent: float
    bits_per_pixel: float
    mse: float
    psnr: Optional[float]
    psnr_display: str
    is_infinite_psnr: bool
    ssim: float
    is_exact_match: bool
    width: int
    height: int
    channels: int
    encoding_time_ms: float
    decoding_time_ms: float
    total_time_ms: float

class CompressionResult(BaseModel):
    experiment_id: str
    filename: str
    algorithm_id: str
    algorithm_name: str
    category: str
    parameters: Dict[str, Any]
    metrics: CompressionMetrics
    artifact_info: Dict[str, Any]
    inspection: Optional[Dict[str, Any]] = None
    subbands_preview: Optional[Dict[str, Any]] = None
    original_preview_b64: Optional[str] = None
    reconstructed_preview_b64: Optional[str] = None
    created_at: float
