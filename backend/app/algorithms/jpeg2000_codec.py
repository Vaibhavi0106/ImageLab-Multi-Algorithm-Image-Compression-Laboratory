import io
from typing import Tuple, Dict, Any
from PIL import Image, features
from app.algorithms.base import BaseCodec

class JPEG2000Codec(BaseCodec):
    algorithm_id = "jpeg2000"
    display_name = "JPEG 2000 (ISO/IEC 15444-1)"
    category = "wavelet"
    description = (
        "Modern wavelet-based standard employing 2D Discrete Wavelet Transform (CDF 9/7 for lossy, "
        "LeGall 5/3 for lossless), EBCOT bit-plane entropy coding, and progressive quality layers."
    )

    @classmethod
    def is_available(cls) -> bool:
        return bool(features.check("jpg_2000"))

    def compress(
        self,
        image: Image.Image,
        lossless: bool = False,
        quality_mode: str = "rates",  # "rates" or "dB"
        target_rate: float = 20.0,    # compression rate ratio or dB target
        num_resolutions: int = 5,
        **kwargs
    ) -> Tuple[bytes, Dict[str, Any]]:
        if not self.is_available():
            raise RuntimeError(
                "JPEG 2000 codec (OpenJPEG) is not compiled or enabled in this Pillow installation."
            )

        rgb_img = image.convert("RGB")
        buf = io.BytesIO()

        if lossless:
            rgb_img.save(
                buf,
                format="JPEG2000",
                irreversible=False,
                num_resolutions=max(1, min(8, int(num_resolutions)))
            )
            mode_desc = "Lossless (LeGall 5/3 Integer Wavelet)"
        else:
            # For lossy mode (CDF 9/7 biorthogonal wavelet)
            rate_val = float(max(1.0, min(100.0, target_rate)))
            if quality_mode == "dB":
                # target PSNR in dB, e.g. 30 to 50 dB
                target_db = float(max(20.0, min(60.0, target_rate)))
                rgb_img.save(
                    buf,
                    format="JPEG2000",
                    irreversible=True,
                    quality_mode="dB",
                    quality_layers=[target_db],
                    num_resolutions=max(1, min(8, int(num_resolutions)))
                )
                mode_desc = f"Lossy CDF 9/7 (Target {target_db:.1f} dB PSNR)"
            else:
                # Compression rate: higher rate means more compression
                rgb_img.save(
                    buf,
                    format="JPEG2000",
                    irreversible=True,
                    quality_mode="rates",
                    quality_layers=[rate_val],
                    num_resolutions=max(1, min(8, int(num_resolutions)))
                )
                mode_desc = f"Lossy CDF 9/7 (Target Rate {rate_val:.1f})"

        artifact_bytes = buf.getvalue()
        metadata = {
            "format": "JPEG2000",
            "lossless": lossless,
            "quality_mode": quality_mode,
            "target_rate": target_rate,
            "num_resolutions": num_resolutions,
            "wavelet_transform": "LeGall 5/3" if lossless else "CDF 9/7",
            "file_extension": "jp2",
            "mime_type": "image/jp2",
            "mode_description": mode_desc
        }
        return artifact_bytes, metadata

    def decompress(self, artifact_bytes: bytes, **kwargs) -> Tuple[Image.Image, Dict[str, Any]]:
        if not self.is_available():
            raise RuntimeError("JPEG 2000 codec is not available.")
            
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
            "is_available": self.is_available(),
            "lossless": {
                "type": "boolean",
                "default": False,
                "description": "Switch between mathematically lossless (5/3 filter) and lossy (9/7 filter)."
            },
            "quality_mode": {
                "type": "select",
                "default": "rates",
                "options": ["rates", "dB"],
                "description": "Rate control mode: target compression rate factor or target PSNR in dB."
            },
            "target_rate": {
                "type": "float",
                "default": 20.0,
                "min": 1.0,
                "max": 100.0,
                "description": "Target compression factor (rates mode) or target PSNR dB (dB mode)."
            },
            "num_resolutions": {
                "type": "integer",
                "default": 5,
                "min": 1,
                "max": 7,
                "description": "Number of DWT multiresolution decomposition levels."
            }
        }
