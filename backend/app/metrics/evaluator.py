import math
import numpy as np
from PIL import Image
from typing import Dict, Any, Optional
from skimage.metrics import structural_similarity as ssim_fn

def calculate_metrics(
    original_img: Image.Image,
    reconstructed_img: Image.Image,
    original_size_bytes: int,
    compressed_size_bytes: int,
    encoding_time_sec: float,
    decoding_time_sec: float
) -> Dict[str, Any]:
    """
    Computes rigorous mathematical metrics comparing original and reconstructed image data.
    All calculations operate on actual image dimensions, byte sizes, and pixel values.
    """
    orig_rgb = original_img.convert("RGB")
    recon_rgb = reconstructed_img.convert("RGB")
    
    orig_arr = np.asarray(orig_rgb, dtype=np.float64)
    recon_arr = np.asarray(recon_rgb, dtype=np.float64)
    
    # Ensure dimensions match
    if orig_arr.shape != recon_arr.shape:
        raise ValueError(
            f"Dimension mismatch between original {orig_arr.shape} and reconstructed {recon_arr.shape}"
        )
    
    height, width, channels = orig_arr.shape
    total_pixels = width * height
    total_samples = total_pixels * channels
    
    # Exact pixel equality check (for lossless validation)
    exact_match = bool(np.array_equal(np.asarray(orig_rgb), np.asarray(recon_rgb)))
    
    # Mean Squared Error (MSE)
    diff = orig_arr - recon_arr
    mse = float(np.sum(diff ** 2) / total_samples)
    
    # Peak Signal-to-Noise Ratio (PSNR)
    # MAX_I = 255.0 for standard 8-bit dynamic range
    if mse == 0.0 or exact_match:
        psnr: Optional[float] = None
        psnr_display = "Infinity (Lossless)"
        is_infinite_psnr = True
    else:
        psnr_val = 10.0 * math.log10((255.0 ** 2) / mse)
        psnr = round(float(psnr_val), 4)
        psnr_display = f"{psnr:.2f} dB"
        is_infinite_psnr = False
        
    # Structural Similarity Index (SSIM)
    # Handle small images safely by setting win_size <= min(width, height)
    min_dim = min(width, height)
    if min_dim < 7:
        win_size = min_dim if min_dim % 2 == 1 else min_dim - 1
    else:
        win_size = 7
        
    if win_size < 3:
        # For tiny dimensions (<3), SSIM window cannot be formed
        ssim_val = 1.0 if exact_match else float(1.0 - (mse / (255.0 ** 2)))
    else:
        try:
            ssim_raw = ssim_fn(
                np.asarray(orig_rgb),
                np.asarray(recon_rgb),
                win_size=win_size,
                channel_axis=2,
                data_range=255
            )
            ssim_val = float(ssim_raw)
        except Exception:
            ssim_val = 1.0 if exact_match else float(max(0.0, 1.0 - (mse / (255.0 ** 2))))
            
    # Compression Ratio: CR = Original Size / Compressed Size
    if compressed_size_bytes > 0:
        cr = round(original_size_bytes / compressed_size_bytes, 4)
    else:
        cr = 0.0
        
    # Percentage of storage saved: Space Saved (%) = ((Original Size - Compressed Size) / Original Size) * 100
    if original_size_bytes > 0:
        space_saved_pct = round(((original_size_bytes - compressed_size_bytes) / original_size_bytes) * 100.0, 2)
    else:
        space_saved_pct = 0.0
        
    # Bit rate: Bits Per Pixel = (Compressed Artifact Size * 8) / (Image Width * Image Height)
    bpp = round((compressed_size_bytes * 8.0) / total_pixels, 4)
    
    return {
        "original_size_bytes": original_size_bytes,
        "compressed_size_bytes": compressed_size_bytes,
        "compression_ratio": cr,
        "space_saved_percent": space_saved_pct,
        "bits_per_pixel": bpp,
        "mse": round(mse, 6),
        "psnr": psnr,
        "psnr_display": psnr_display,
        "is_infinite_psnr": is_infinite_psnr,
        "ssim": round(ssim_val, 4),
        "is_exact_match": exact_match,
        "width": width,
        "height": height,
        "channels": channels,
        "encoding_time_ms": round(encoding_time_sec * 1000.0, 3),
        "decoding_time_ms": round(decoding_time_sec * 1000.0, 3),
        "total_time_ms": round((encoding_time_sec + decoding_time_sec) * 1000.0, 3)
    }
