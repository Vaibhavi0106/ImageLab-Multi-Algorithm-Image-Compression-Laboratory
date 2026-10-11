from pathlib import Path
import tempfile

class Settings:
    PROJECT_NAME: str = "ImageLab — Multi-Algorithm Image Compression Laboratory"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Upload constraints
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    MAX_IMAGE_WIDTH: int = 4096
    MAX_IMAGE_HEIGHT: int = 4096
    MAX_TOTAL_PIXELS: int = 16_000_000  # 16 Megapixels protection against decompression bombs
    
    ALLOWED_EXTENSIONS: set = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".jp2"}
    ALLOWED_MIME_TYPES: set = {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/bmp",
        "image/jp2",
        "image/x-portable-pixmap"
    }
    
    # Working directory for caching experiment artifacts
    STORAGE_DIR: Path = Path(tempfile.gettempdir()) / "imagelab_storage"

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
