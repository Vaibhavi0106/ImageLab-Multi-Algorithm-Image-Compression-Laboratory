from abc import ABC, abstractmethod
from typing import Tuple, Dict, Any
from PIL import Image

class BaseCodec(ABC):
    algorithm_id: str
    display_name: str
    category: str  # "lossless", "lossy", "transform", "entropy"
    description: str

    @abstractmethod
    def compress(self, image: Image.Image, **params) -> Tuple[bytes, Dict[str, Any]]:
        """
        Compresses the input PIL Image.
        Returns:
            artifact_bytes: Real binary payload of the compressed file/container.
            metadata: Dict of encoding parameters, headers, or internal representations.
        """
        pass

    @abstractmethod
    def decompress(self, artifact_bytes: bytes, **params) -> Tuple[Image.Image, Dict[str, Any]]:
        """
        Decompresses the artifact bytes into a reconstructed PIL Image.
        Returns:
            reconstructed_image: PIL Image object.
            metadata: Dict of decoding information.
        """
        pass

    @abstractmethod
    def get_supported_params(self) -> Dict[str, Any]:
        """
        Returns the parameter schema, defaults, and ranges for this codec.
        """
        pass
