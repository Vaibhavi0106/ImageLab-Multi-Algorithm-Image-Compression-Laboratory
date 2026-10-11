import io
from typing import Tuple, Dict, Any
from PIL import Image
from app.algorithms.base import BaseCodec

class JPEGCodec(BaseCodec):
    algorithm_id = "jpeg"
    display_name = "Standard JPEG (ISO/IEC 10918-1)"
    category = "lossy"
    description = (
        "Industry standard lossy transform coding utilizing YCbCr color conversion, "
        "8x8 Discrete Cosine Transform (DCT), psychoacoustic scalar quantization, "
        "zigzag scan run-length coding, and Huffman entropy coding."
    )

    def compress(
        self,
        image: Image.Image,
        quality: int = 75,
        subsampling: str = "4:2:0",
        optimize: bool = True,
        **kwargs
    ) -> Tuple[bytes, Dict[str, Any]]:
        quality = max(1, min(100, int(quality)))
        
        # Subsampling map for Pillow:
        # 0 = 4:4:4, 1 = 4:2:2, 2 = 4:2:0
        subsampling_map = {
            "4:4:4": 0,
            "4:2:2": 1,
            "4:2:0": 2
        }
        subsampling_val = subsampling_map.get(subsampling, 2)
        
        buf = io.BytesIO()
        rgb_img = image.convert("RGB")
        rgb_img.save(
            buf,
            format="JPEG",
            quality=quality,
            subsampling=subsampling_val,
            optimize=optimize
        )
        artifact_bytes = buf.getvalue()
        
        metadata = {
            "format": "JPEG",
            "quality": quality,
            "subsampling": subsampling,
            "optimize": optimize,
            "file_extension": "jpg",
            "mime_type": "image/jpeg"
        }
        return artifact_bytes, metadata

    def decompress(self, artifact_bytes: bytes, **kwargs) -> Tuple[Image.Image, Dict[str, Any]]:
        buf = io.BytesIO(artifact_bytes)
        img = Image.open(buf)
        img.load()
        metadata = {
            "format": img.format,
            "size": img.size,
            "mode": img.mode
        }
        return img, metadata

    def get_supported_params(self) -> Dict[str, Any]:
        return {
            "quality": {
                "type": "integer",
                "default": 75,
                "min": 1,
                "max": 100,
                "description": "JPEG Quality Factor controlling quantization table scaling (1 = lowest, 100 = highest)."
            },
            "subsampling": {
                "type": "select",
                "default": "4:2:0",
                "options": ["4:4:4", "4:2:2", "4:2:0"],
                "description": "Chroma subsampling ratio (4:4:4 preserves full color detail, 4:2:0 halves chroma resolution)."
            },
            "optimize": {
                "type": "boolean",
                "default": True,
                "description": "Perform an extra pass to compute optimal Huffman entropy tables."
            }
        }
