import io
import json
import struct
import zlib
import numpy as np
import pywt
from PIL import Image
from typing import Tuple, Dict, Any, List
from app.algorithms.base import BaseCodec

SUPPORTED_WAVELETS = ["haar", "db2", "db4", "bior4.4", "sym4", "coif1"]

class WaveletCodec(BaseCodec):
    algorithm_id = "wavelet_custom"
    display_name = "Custom Multilevel Wavelet Transform Coder"
    category = "wavelet"
    description = (
        "Educational multiresolution discrete wavelet transform (DWT) pipeline using PyWavelets. "
        "Performs dyadic subband decomposition into approximation (LL) and detail (LH, HL, HH) bands, "
        "applies dead-zone scalar quantization/thresholding, and serializes coefficients into a .wavz container."
    )
    MAGIC = b"IL_WAV1"

    def compress(
        self,
        image: Image.Image,
        wavelet: str = "bior4.4",
        levels: int = 3,
        threshold: float = 20.0,
        mode: str = "hard",
        quant_step: float = 4.0,
        **kwargs
    ) -> Tuple[bytes, Dict[str, Any]]:
        if wavelet not in SUPPORTED_WAVELETS:
            wavelet = "haar"
            
        levels = max(1, min(4, int(levels)))
        threshold = max(0.0, min(200.0, float(threshold)))
        quant_step = max(0.5, min(64.0, float(quant_step)))
        is_soft = (mode == "soft")
        
        rgb_img = image.convert("RGB")
        orig_w, orig_h = rgb_img.size
        
        # Ensure dimensions are divisible by 2^levels
        pad_unit = 2 ** levels
        pad_w = ((orig_w + pad_unit - 1) // pad_unit) * pad_unit
        pad_h = ((orig_h + pad_unit - 1) // pad_unit) * pad_unit
        
        img_arr = np.asarray(rgb_img, dtype=np.float32)
        if pad_w != orig_w or pad_h != orig_h:
            padded_arr = np.pad(
                img_arr,
                ((0, pad_h - orig_h), (0, pad_w - orig_w), (0, 0)),
                mode="edge"
            )
        else:
            padded_arr = img_arr
            
        # Decompose each channel
        channels_quantized = []
        shapes_info = []
        subbands_preview = {}
        
        for c in range(3):
            ch_data = padded_arr[:, :, c]
            # 2D DWT Multilevel decomposition
            coeffs = pywt.wavedec2(ch_data, wavelet=wavelet, level=levels, mode="periodization")
            # coeffs structure: [cAn, (cHn, cVn, cDn), ..., (cH1, cV1, cD1)]
            
            # Record shapes from channel 0
            if c == 0:
                shapes_info = [coeffs[0].shape]
                for details in coeffs[1:]:
                    shapes_info.append([d.shape for d in details])
                    
                # Extract Level-1 subband preview for visualization (Y channel approximation)
                ll_approx = coeffs[0]
                lh_horiz, hl_vert, hh_diag = coeffs[-1]
                
                def _norm_band(band: np.ndarray) -> List[List[int]]:
                    b_abs = np.abs(band)
                    b_max = np.max(b_abs)
                    if b_max > 0:
                        normed = np.round((b_abs / b_max) * 255.0).astype(np.uint8)
                    else:
                        normed = np.zeros_like(b_abs, dtype=np.uint8)
                    # Downsample preview if large
                    if normed.shape[0] > 64:
                        step_y = normed.shape[0] // 64
                        step_x = normed.shape[1] // 64
                        normed = normed[::step_y, ::step_x]
                    return normed.tolist()
                    
                subbands_preview = {
                    "LL": _norm_band(ll_approx),
                    "LH": _norm_band(lh_horiz),
                    "HL": _norm_band(hl_vert),
                    "HH": _norm_band(hh_diag)
                }

            # Quantize approximation band (finer step, no thresholding)
            ll = coeffs[0]
            quant_ll = np.round(ll / (quant_step * 0.5)).astype(np.int32)
            
            # Quantize detail bands with thresholding
            quant_details = []
            for detail_tuple in coeffs[1:]:
                tuple_quant = []
                for band in detail_tuple:
                    # Apply thresholding
                    if is_soft:
                        thresh_band = pywt.threshold(band, threshold, mode="soft")
                    else:
                        thresh_band = pywt.threshold(band, threshold, mode="hard")
                    # Uniform scalar quantization
                    q_band = np.round(thresh_band / quant_step).astype(np.int32)
                    tuple_quant.append(q_band)
                quant_details.append(tuple_quant)
                
            channels_quantized.append((quant_ll, quant_details))
            
        # Serialize to .wavz binary container
        artifact_bytes = self._serialize_artifact(
            orig_w, orig_h, pad_w, pad_h,
            wavelet, levels, threshold, quant_step, is_soft,
            shapes_info, channels_quantized
        )
        
        metadata = {
            "format": "WAVZ",
            "wavelet": wavelet,
            "levels": levels,
            "threshold": threshold,
            "mode": mode,
            "quant_step": quant_step,
            "original_dimensions": [orig_w, orig_h],
            "padded_dimensions": [pad_w, pad_h],
            "file_extension": "wavz",
            "mime_type": "application/x-wavz",
            "subbands_preview": subbands_preview
        }
        return artifact_bytes, metadata

    def decompress(self, artifact_bytes: bytes, **kwargs) -> Tuple[Image.Image, Dict[str, Any]]:
        magic_len = len(self.MAGIC)
        if artifact_bytes[:magic_len] != self.MAGIC:
            raise ValueError("Invalid WAVZ artifact magic signature.")
            
        offset = magic_len
        # Header: orig_w(H), orig_h(H), pad_w(H), pad_h(H), levels(B), is_soft(B), quant_step(f), threshold(f), json_len(I)
        header_fmt = ">HHHH BB ff I"
        header_size = struct.calcsize(header_fmt)
        (orig_w, orig_h, pad_w, pad_h, levels, is_soft, quant_step, threshold, json_len) = struct.unpack_from(
            header_fmt, artifact_bytes, offset
        )
        offset += header_size
        
        meta_json_bytes = artifact_bytes[offset:offset+json_len]
        offset += json_len
        meta_dict = json.loads(meta_json_bytes.decode("utf-8"))
        wavelet_name = meta_dict["wavelet"]
        shapes_info = meta_dict["shapes"]
        
        compressed_payload = artifact_bytes[offset:]
        payload = zlib.decompress(compressed_payload)
        
        # Unpack quantized coefficients
        recon_channels = []
        payload_offset = 0
        
        for c in range(3):
            # Read LL
            ll_shape = tuple(shapes_info[0])
            ll_count = ll_shape[0] * ll_shape[1]
            ll_bytes = ll_count * 4
            ll_arr = np.frombuffer(payload[payload_offset:payload_offset+ll_bytes], dtype=">i4").reshape(ll_shape)
            payload_offset += ll_bytes
            
            # Dequantize LL
            dequant_ll = ll_arr.astype(np.float32) * (quant_step * 0.5)
            
            dequant_details = []
            for lvl_idx, detail_shapes in enumerate(shapes_info[1:]):
                tuple_bands = []
                for b_shape in detail_shapes:
                    b_tuple = tuple(b_shape)
                    b_count = b_tuple[0] * b_tuple[1]
                    b_bytes = b_count * 4
                    q_band = np.frombuffer(payload[payload_offset:payload_offset+b_bytes], dtype=">i4").reshape(b_tuple)
                    payload_offset += b_bytes
                    
                    # Dequantize
                    dequant_band = q_band.astype(np.float32) * quant_step
                    tuple_bands.append(dequant_band)
                dequant_details.append(tuple(tuple_bands))
                
            reconstructed_coeffs = [dequant_ll] + dequant_details
            # Inverse 2D DWT
            recon_ch = pywt.waverec2(reconstructed_coeffs, wavelet=wavelet_name, mode="periodization")
            recon_channels.append(recon_ch)
            
        recon_arr = np.stack(recon_channels, axis=-1)
        recon_arr = np.clip(np.round(recon_arr), 0, 255).astype(np.uint8)
        
        # Crop unpadded area
        recon_cropped = recon_arr[:orig_h, :orig_w, :]
        reconstructed_img = Image.fromarray(recon_cropped, mode="RGB")
        
        metadata = {
            "format": "WAVZ",
            "wavelet": wavelet_name,
            "levels": levels,
            "dimensions": (orig_w, orig_h)
        }
        return reconstructed_img, metadata

    def _serialize_artifact(
        self,
        orig_w: int,
        orig_h: int,
        pad_w: int,
        pad_h: int,
        wavelet: str,
        levels: int,
        threshold: float,
        quant_step: float,
        is_soft: bool,
        shapes_info: list,
        channels_quantized: list
    ) -> bytes:
        meta_dict = {
            "wavelet": wavelet,
            "shapes": shapes_info
        }
        meta_json_bytes = json.dumps(meta_dict).encode("utf-8")
        
        header = bytearray()
        header.extend(self.MAGIC)
        header_fmt = ">HHHH BB ff I"
        header.extend(struct.pack(
            header_fmt,
            orig_w, orig_h, pad_w, pad_h,
            levels, int(is_soft),
            float(quant_step), float(threshold),
            len(meta_json_bytes)
        ))
        header.extend(meta_json_bytes)
        
        # Flatten and pack quantized integer streams
        raw_payload = bytearray()
        for quant_ll, quant_details in channels_quantized:
            raw_payload.extend(quant_ll.astype(">i4").tobytes())
            for detail_tuple in quant_details:
                for band in detail_tuple:
                    raw_payload.extend(band.astype(">i4").tobytes())
                    
        compressed_payload = zlib.compress(bytes(raw_payload), level=9)
        return bytes(header) + compressed_payload

    def get_supported_params(self) -> Dict[str, Any]:
        return {
            "wavelet": {
                "type": "select",
                "default": "bior4.4",
                "options": SUPPORTED_WAVELETS,
                "description": "Discrete wavelet mother function family (Haar, Daubechies, Biorthogonal)."
            },
            "levels": {
                "type": "integer",
                "default": 3,
                "min": 1,
                "max": 4,
                "description": "Number of dyadic multiresolution decomposition levels."
            },
            "threshold": {
                "type": "float",
                "default": 20.0,
                "min": 0.0,
                "max": 150.0,
                "description": "Subband noise/detail threshold cutoff value."
            },
            "mode": {
                "type": "select",
                "default": "hard",
                "options": ["hard", "soft"],
                "description": "Thresholding shrinkage rule (hard = zero out small coeffs, soft = shrink towards zero)."
            },
            "quant_step": {
                "type": "float",
                "default": 4.0,
                "min": 1.0,
                "max": 32.0,
                "description": "Uniform scalar quantization step size."
            }
        }
