import io
from typing import Tuple, Dict, Any
from PIL import Image
from app.algorithms.base import BaseCodec

class PNGCodec(BaseCodec):
    algorithm_id = "png"
    display_name = "PNG Lossless Compression"
    category = "lossless"
    description = (
        "Standard lossless bitmap format utilizing 2D spatial filtering (None, Sub, Up, Average, Paeth) "
        "followed by Deflate (LZ77 sliding-window dictionary and Huffman entropy coding)."
    )

    def compress(self, image: Image.Image, compress_level: int = 6, optimize: bool = True, **kwargs) -> Tuple[bytes, Dict[str, Any]]:
        compress_level = max(0, min(9, int(compress_level)))
        buf = io.BytesIO()
        # Save as genuine PNG
        img_to_save = image.convert("RGB") if image.mode not in ("RGB", "L", "RGBA") else image
        img_to_save.save(buf, format="PNG", compress_level=compress_level, optimize=optimize)
        artifact_bytes = buf.getvalue()
        
        metadata = {
            "format": "PNG",
            "compress_level": compress_level,
            "optimize": optimize,
            "color_mode": img_to_save.mode,
            "file_extension": "png",
            "mime_type": "image/png"
        }
        return artifact_bytes, metadata

    def decompress(self, artifact_bytes: bytes, **kwargs) -> Tuple[Image.Image, Dict[str, Any]]:
        buf = io.BytesIO(artifact_bytes)
        img = Image.open(buf)
        img.load()  # Read full buffer into memory
        metadata = {
            "format": img.format,
            "size": img.size,
            "mode": img.mode
        }
        return img, metadata

    def get_supported_params(self) -> Dict[str, Any]:
        return {
            "compress_level": {
                "type": "integer",
                "default": 6,
                "min": 0,
                "max": 9,
                "description": "Zlib compression level (0 = uncompressed, 9 = maximum compression)."
            },
            "optimize": {
                "type": "boolean",
                "default": True,
                "description": "Instructs the PNG encoder to find optimal filtering per scanline."
            }
        }
