import io
import struct
import zlib
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any, List
from app.algorithms.base import BaseCodec

# Standard JPEG Luminance Quantization Table (50% quality baseline)
Q_LUMINANCE = np.array([
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
], dtype=np.float32)

# Standard JPEG Chrominance Quantization Table
Q_CHROMINANCE = np.array([
    [17, 18, 24, 47, 99, 99, 99, 99],
    [18, 21, 26, 66, 99, 99, 99, 99],
    [24, 26, 56, 99, 99, 99, 99, 99],
    [47, 66, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99]
], dtype=np.float32)

# Standard Zigzag scan indices for 8x8 block
ZIGZAG_INDICES = [
    (0,0), (0,1), (1,0), (2,0), (1,1), (0,2), (0,3), (1,2),
    (2,1), (3,0), (4,0), (3,1), (2,2), (1,3), (0,4), (0,5),
    (1,4), (2,3), (3,2), (4,1), (5,0), (6,0), (5,1), (4,2),
    (3,3), (2,4), (1,5), (0,6), (0,7), (1,6), (2,5), (3,4),
    (4,3), (5,2), (6,1), (7,0), (7,1), (6,2), (5,3), (4,4),
    (3,5), (2,6), (1,7), (2,7), (3,6), (4,5), (5,4), (6,3),
    (7,2), (7,3), (6,4), (5,5), (4,6), (3,7), (4,7), (5,6),
    (6,5), (7,4), (7,5), (6,6), (5,7), (6,7), (7,6), (7,7)
]


def create_dct_matrix(n: int = 8) -> np.ndarray:
    """Computes orthonormal DCT-II transformation matrix of size n x n."""
    T = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        for j in range(n):
            if i == 0:
                T[i, j] = 1.0 / np.sqrt(n)
            else:
                T[i, j] = np.sqrt(2.0 / n) * np.cos((2 * j + 1) * i * np.pi / (2.0 * n))
    return T

DCT_MATRIX_8X8 = create_dct_matrix(8)
IDCT_MATRIX_8X8 = DCT_MATRIX_8X8.T


def get_scaled_quant_table(base_table: np.ndarray, quality: int) -> np.ndarray:
    """Scales standard JPEG quantization table by quality factor [1..100]."""
    q = max(1, min(100, quality))
    if q < 50:
        scale = 5000.0 / q
    else:
        scale = 200.0 - 2.0 * q
    scaled = np.floor((base_table * scale + 50.0) / 100.0)
    return np.clip(scaled, 1.0, 255.0).astype(np.float32)


def rgb_to_ycbcr(rgb: np.ndarray) -> np.ndarray:
    """Converts uint8 RGB array to float32 YCbCr array (BT.601)."""
    R = rgb[:, :, 0].astype(np.float32)
    G = rgb[:, :, 1].astype(np.float32)
    B = rgb[:, :, 2].astype(np.float32)
    
    Y  =  0.299000 * R + 0.587000 * G + 0.114000 * B
    Cb = -0.168736 * R - 0.331264 * G + 0.500000 * B + 128.0
    Cr =  0.500000 * R - 0.418688 * G - 0.081312 * B + 128.0
    
    return np.stack([Y, Cb, Cr], axis=-1)


def ycbcr_to_rgb(ycbcr: np.ndarray) -> np.ndarray:
    """Converts float32 YCbCr array back to uint8 RGB array."""
    Y  = ycbcr[:, :, 0]
    Cb = ycbcr[:, :, 1] - 128.0
    Cr = ycbcr[:, :, 2] - 128.0
    
    R = Y + 1.402000 * Cr
    G = Y - 0.344136 * Cb - 0.714136 * Cr
    B = Y + 1.772000 * Cb
    
    rgb = np.stack([R, G, B], axis=-1)
    return np.clip(np.round(rgb), 0, 255).astype(np.uint8)


class DCTCodec(BaseCodec):
    algorithm_id = "dct_custom"
    display_name = "Custom 8x8 DCT Transform Coder"
    category = "transform"
    description = (
        "Academically rigorous 8x8 block Discrete Cosine Transform pipeline. "
        "Transforms spatial luminance and chrominance signals into frequency spectra, "
        "applies scaled psycho-visual quantization, and encodes coefficients into a standalone .dctz artifact."
    )
    MAGIC = b"IL_DCT1"

    def compress(
        self,
        image: Image.Image,
        quality: int = 75,
        subsampling: str = "4:4:4",
        **kwargs
    ) -> Tuple[bytes, Dict[str, Any]]:
        quality = max(1, min(100, int(quality)))
        rgb_img = image.convert("RGB")
        orig_w, orig_h = rgb_img.size
        
        # Block padding: images must be multiples of 8 (or 16 if 4:2:0)
        pad_unit = 16 if subsampling == "4:2:0" else 8
        pad_w = ((orig_w + pad_unit - 1) // pad_unit) * pad_unit
        pad_h = ((orig_h + pad_unit - 1) // pad_unit) * pad_unit
        
        # Padded array with edge replication
        img_arr = np.asarray(rgb_img, dtype=np.uint8)
        if pad_w != orig_w or pad_h != orig_h:
            padded_arr = np.pad(
                img_arr,
                ((0, pad_h - orig_h), (0, pad_w - orig_w), (0, 0)),
                mode="edge"
            )
        else:
            padded_arr = img_arr
            
        ycbcr = rgb_to_ycbcr(padded_arr)
        
        q_lum = get_scaled_quant_table(Q_LUMINANCE, quality)
        q_chr = get_scaled_quant_table(Q_CHROMINANCE, quality)
        
        # Quantized coefficient buffers
        # 3 channels: Y, Cb, Cr
        quantized_channels = []
        is_subsampled = (subsampling == "4:2:0")
        
        # Channel 0: Y
        q_table = q_lum
        y_channel = ycbcr[:, :, 0] - 128.0
        quantized_y = self._transform_channel(y_channel, q_table)
        quantized_channels.append(quantized_y)
        
        # Channels 1 & 2: Cb and Cr
        for c in (1, 2):
            c_data = ycbcr[:, :, c] - 128.0
            if is_subsampled:
                # 2x2 box average downsampling
                c_data = c_data.reshape(pad_h // 2, 2, pad_w // 2, 2).mean(axis=(1, 3))
            quantized_c = self._transform_channel(c_data, q_chr)
            quantized_channels.append(quantized_c)
            
        # Serialize to binary artifact (.dctz)
        artifact_bytes = self._serialize_artifact(
            orig_w, orig_h, pad_w, pad_h, quality, is_subsampled, quantized_channels
        )
        
        # Extract inspection block for visualization (center 8x8 block of Y channel)
        cy = (pad_h // 16) * 8
        cx = (pad_w // 16) * 8
        sample_spatial = (ycbcr[cy:cy+8, cx:cx+8, 0]).round().tolist()
        sample_shifted = (y_channel[cy:cy+8, cx:cx+8]).round().tolist()
        sample_dct = np.round(
            DCT_MATRIX_8X8 @ (y_channel[cy:cy+8, cx:cx+8]) @ IDCT_MATRIX_8X8, 2
        ).tolist()
        sample_quantized = quantized_y[
            (cy // 8) * (pad_w // 8) + (cx // 8)
        ].reshape(8, 8).tolist()
        
        metadata = {
            "format": "DCTZ",
            "quality": quality,
            "subsampling": subsampling,
            "original_dimensions": [orig_w, orig_h],
            "padded_dimensions": [pad_w, pad_h],
            "num_blocks_y": len(quantized_y),
            "file_extension": "dctz",
            "mime_type": "application/x-dctz",
            "inspection": {
                "sample_block_x": cx,
                "sample_block_y": cy,
                "spatial_values": sample_spatial,
                "shifted_values": sample_shifted,
                "dct_coefficients": sample_dct,
                "quantization_table": q_lum.tolist(),
                "quantized_coefficients": sample_quantized
            }
        }
        
        return artifact_bytes, metadata

    def decompress(self, artifact_bytes: bytes, **kwargs) -> Tuple[Image.Image, Dict[str, Any]]:
        magic_len = len(self.MAGIC)
        if artifact_bytes[:magic_len] != self.MAGIC:
            raise ValueError("Invalid DCTZ artifact magic signature.")
            
        header_fmt = ">HH HHB B"
        header_size = struct.calcsize(header_fmt)
        (orig_w, orig_h, pad_w, pad_h, quality, is_subsampled) = struct.unpack_from(
            header_fmt, artifact_bytes, magic_len
        )
        
        compressed_payload = artifact_bytes[magic_len + header_size:]
        payload_data = zlib.decompress(compressed_payload)
        
        # Reconstruct quantized tables
        q_lum = get_scaled_quant_table(Q_LUMINANCE, quality)
        q_chr = get_scaled_quant_table(Q_CHROMINANCE, quality)
        
        # Parse quantized coefficient blocks
        offset = 0
        num_y_blocks = (pad_h // 8) * (pad_w // 8)
        y_bytes = num_y_blocks * 64 * 2
        quantized_y = np.frombuffer(payload_data[offset:offset+y_bytes], dtype=">i2").reshape(-1, 64)
        offset += y_bytes
        
        c_h = pad_h // 2 if is_subsampled else pad_h
        c_w = pad_w // 2 if is_subsampled else pad_w
        num_c_blocks = (c_h // 8) * (c_w // 8)
        c_bytes = num_c_blocks * 64 * 2
        
        quantized_cb = np.frombuffer(payload_data[offset:offset+c_bytes], dtype=">i2").reshape(-1, 64)
        offset += c_bytes
        quantized_cr = np.frombuffer(payload_data[offset:offset+c_bytes], dtype=">i2").reshape(-1, 64)
        
        # Inverse transform Y
        recon_y = self._inverse_transform_channel(quantized_y, pad_h, pad_w, q_lum) + 128.0
        
        # Inverse transform Cb & Cr
        recon_cb_raw = self._inverse_transform_channel(quantized_cb, c_h, c_w, q_chr) + 128.0
        recon_cr_raw = self._inverse_transform_channel(quantized_cr, c_h, c_w, q_chr) + 128.0
        
        if is_subsampled:
            # Nearest or bilinear upsample back to pad_h, pad_w
            recon_cb = np.repeat(np.repeat(recon_cb_raw, 2, axis=0), 2, axis=1)
            recon_cr = np.repeat(np.repeat(recon_cr_raw, 2, axis=0), 2, axis=1)
        else:
            recon_cb = recon_cb_raw
            recon_cr = recon_cr_raw
            
        ycbcr_recon = np.stack([recon_y, recon_cb, recon_cr], axis=-1)
        rgb_padded = ycbcr_to_rgb(ycbcr_recon)
        
        # Crop unpadded area
        rgb_orig = rgb_padded[:orig_h, :orig_w, :]
        reconstructed_img = Image.fromarray(rgb_orig, mode="RGB")
        
        metadata = {
            "format": "DCTZ",
            "quality": quality,
            "dimensions": (orig_w, orig_h),
            "subsampling": "4:2:0" if is_subsampled else "4:4:4"
        }
        return reconstructed_img, metadata

    def _transform_channel(self, channel_data: np.ndarray, q_table: np.ndarray) -> np.ndarray:
        h, w = channel_data.shape
        blocks = []
        for i in range(0, h, 8):
            for j in range(0, w, 8):
                block = channel_data[i:i+8, j:j+8]
                # 2D DCT: T @ block @ T^T
                dct_block = DCT_MATRIX_8X8 @ block @ IDCT_MATRIX_8X8
                quant_block = np.round(dct_block / q_table).astype(np.int16)
                
                # Zigzag order
                zigzag_arr = np.zeros(64, dtype=np.int16)
                for idx, (r, c) in enumerate(ZIGZAG_INDICES):
                    zigzag_arr[idx] = quant_block[r, c]
                blocks.append(zigzag_arr)
        return np.array(blocks, dtype=np.int16)

    def _inverse_transform_channel(
        self,
        quantized_blocks: np.ndarray,
        height: int,
        width: int,
        q_table: np.ndarray
    ) -> np.ndarray:
        channel = np.zeros((height, width), dtype=np.float32)
        block_idx = 0
        for i in range(0, height, 8):
            for j in range(0, width, 8):
                zigzag_arr = quantized_blocks[block_idx]
                block_idx += 1
                
                # Inverse zigzag
                quant_block = np.zeros((8, 8), dtype=np.float32)
                for idx, (r, c) in enumerate(ZIGZAG_INDICES):
                    quant_block[r, c] = float(zigzag_arr[idx])
                    
                # Dequantize
                dct_block = quant_block * q_table
                # 2D IDCT: T^T @ dct_block @ T
                spatial_block = IDCT_MATRIX_8X8 @ dct_block @ DCT_MATRIX_8X8
                channel[i:i+8, j:j+8] = spatial_block
        return channel

    def _serialize_artifact(
        self,
        orig_w: int,
        orig_h: int,
        pad_w: int,
        pad_h: int,
        quality: int,
        is_subsampled: bool,
        quantized_channels: List[np.ndarray]
    ) -> bytes:
        header = bytearray()
        header.extend(self.MAGIC)
        header_fmt = ">HH HHB B"
        header.extend(struct.pack(
            header_fmt,
            orig_w, orig_h, pad_w, pad_h, quality, int(is_subsampled)
        ))
        
        # Raw coefficient stream in big-endian int16
        raw_payload = bytearray()
        for ch in quantized_channels:
            raw_payload.extend(ch.astype(">i2").tobytes())
            
        # Zlib entropy deflate (level 9 for maximum container density)
        compressed_payload = zlib.compress(bytes(raw_payload), level=9)
        return bytes(header) + compressed_payload

    def get_supported_params(self) -> Dict[str, Any]:
        return {
            "quality": {
                "type": "integer",
                "default": 75,
                "min": 1,
                "max": 100,
                "description": "Quantization scaling parameter (1 = high compression/loss, 100 = minimal quantization)."
            },
            "subsampling": {
                "type": "select",
                "default": "4:4:4",
                "options": ["4:4:4", "4:2:0"],
                "description": "Chroma subsampling mode (4:4:4 maintains full color blocks, 4:2:0 averages 2x2 chroma)."
            }
        }
