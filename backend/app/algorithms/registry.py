from typing import Dict, List, Any
from app.algorithms.base import BaseCodec
from app.algorithms.png_codec import PNGCodec
from app.algorithms.jpeg_codec import JPEGCodec
from app.algorithms.jpeg2000_codec import JPEG2000Codec
from app.algorithms.dct_codec import DCTCodec
from app.algorithms.wavelet_codec import WaveletCodec
from app.algorithms.huffman import HuffmanCoder

class CodecRegistry:
    def __init__(self):
        self._codecs: Dict[str, BaseCodec] = {
            "png": PNGCodec(),
            "jpeg": JPEGCodec(),
            "jpeg2000": JPEG2000Codec(),
            "dct_custom": DCTCodec(),
            "wavelet_custom": WaveletCodec(),
        }

    def get_codec(self, algorithm_id: str) -> BaseCodec:
        if algorithm_id not in self._codecs:
            raise KeyError(f"Unknown algorithm: '{algorithm_id}'. Available: {list(self._codecs.keys())}")
        return self._codecs[algorithm_id]

    def list_algorithms(self) -> List[Dict[str, Any]]:
        result = []
        for key, codec in self._codecs.items():
            is_avail = True
            if hasattr(codec, "is_available"):
                is_avail = codec.is_available()
                
            result.append({
                "id": codec.algorithm_id,
                "name": codec.display_name,
                "category": codec.category,
                "description": codec.description,
                "is_available": is_avail,
                "parameters": codec.get_supported_params()
            })
        return result

registry = CodecRegistry()
