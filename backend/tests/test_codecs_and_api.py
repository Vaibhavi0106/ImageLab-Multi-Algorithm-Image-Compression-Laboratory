import io
import math
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.algorithms.png_codec import PNGCodec
from app.algorithms.jpeg_codec import JPEGCodec
from app.algorithms.jpeg2000_codec import JPEG2000Codec
from app.algorithms.dct_codec import DCTCodec
from app.algorithms.wavelet_codec import WaveletCodec
from app.algorithms.huffman import HuffmanCoder
from app.metrics.evaluator import calculate_metrics

client = TestClient(app)

# Helper fixture: Generate test images
@pytest.fixture
def test_images():
    # 1. Smooth gradient image (128x128)
    x = np.linspace(0, 255, 128, dtype=np.uint8)
    y = np.linspace(0, 255, 128, dtype=np.uint8)
    xx, yy = np.meshgrid(x, y)
    gradient_arr = np.stack([xx, yy, (xx // 2 + yy // 2).astype(np.uint8)], axis=-1)
    gradient_img = Image.fromarray(gradient_arr, mode="RGB")

    # 2. Synthetic repetitive image (checkerboard 128x128)
    checker_arr = np.zeros((128, 128, 3), dtype=np.uint8)
    for r in range(128):
        for c in range(128):
            if ((r // 16) + (c // 16)) % 2 == 0:
                checker_arr[r, c] = [240, 240, 240]
            else:
                checker_arr[r, c] = [20, 20, 20]
    checker_img = Image.fromarray(checker_arr, mode="RGB")

    # 3. High detail / high frequency noise image
    np.random.seed(42)
    noise_arr = np.random.randint(0, 256, (128, 128, 3), dtype=np.uint8)
    noise_img = Image.fromarray(noise_arr, mode="RGB")

    # 4. Simulated photograph (smooth scenery with texture)
    photo_arr = np.zeros((128, 128, 3), dtype=np.uint8)
    for r in range(128):
        for c in range(128):
            photo_arr[r, c] = [
                int(100 + 50 * math.sin(r / 10.0)),
                int(120 + 40 * math.cos(c / 12.0)),
                int(150 + 30 * math.sin((r + c) / 15.0))
            ]
    photo_img = Image.fromarray(photo_arr, mode="RGB")

    return {
        "gradient": gradient_img,
        "checkerboard": checker_img,
        "high_detail": noise_img,
        "photo": photo_img
    }


def img_to_bytes(img: Image.Image, format: str = "PNG") -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


# -------------------------------------------------------------
# 1. METRICS CALCULATIONS
# -------------------------------------------------------------
def test_metrics_exact_reconstruction(test_images):
    img = test_images["gradient"]
    metrics = calculate_metrics(img, img, 10000, 5000, 0.05, 0.02)
    
    assert metrics["is_exact_match"] is True
    assert metrics["mse"] == 0.0
    assert metrics["is_infinite_psnr"] is True
    assert metrics["ssim"] == 1.0
    assert metrics["compression_ratio"] == 2.0
    assert metrics["space_saved_percent"] == 50.0
    expected_bpp = round((5000 * 8.0) / (128 * 128), 4)
    assert metrics["bits_per_pixel"] == expected_bpp


def test_metrics_lossy_distortion(test_images):
    img1 = test_images["gradient"]
    # Slightly altered image
    arr = np.asarray(img1).copy()
    arr[0, 0, 0] = (int(arr[0, 0, 0]) + 10) % 256
    img2 = Image.fromarray(arr, mode="RGB")
    
    metrics = calculate_metrics(img1, img2, 10000, 5000, 0.1, 0.05)
    assert metrics["is_exact_match"] is False
    assert metrics["mse"] > 0.0
    assert metrics["is_infinite_psnr"] is False
    assert metrics["psnr"] is not None
    assert metrics["psnr"] > 30.0  # Slight 1-pixel change should yield high PSNR
    assert metrics["compression_ratio"] == 2.0


# -------------------------------------------------------------
# 2. PNG LOSSLESS CODEC
# -------------------------------------------------------------
def test_png_codec_lossless_exact_reconstruction(test_images):
    codec = PNGCodec()
    for name, img in test_images.items():
        artifact, meta = codec.compress(img, compress_level=9)
        assert len(artifact) > 0
        assert meta["format"] == "PNG"
        
        recon, rmeta = codec.decompress(artifact)
        assert recon.size == img.size
        # Exact pixel match check
        orig_arr = np.asarray(img)
        recon_arr = np.asarray(recon)
        assert np.array_equal(orig_arr, recon_arr), f"PNG was not lossless for {name}"


# -------------------------------------------------------------
# 3. JPEG CODEC
# -------------------------------------------------------------
def test_jpeg_codec_quality_scaling(test_images):
    codec = JPEGCodec()
    img = test_images["photo"]
    
    art_low, _ = codec.compress(img, quality=15)
    art_high, _ = codec.compress(img, quality=90)
    
    # Low quality must produce smaller file than high quality
    assert len(art_low) < len(art_high)
    
    recon_low, _ = codec.decompress(art_low)
    recon_high, _ = codec.decompress(art_high)
    
    m_low = calculate_metrics(img, recon_low, len(img_to_bytes(img)), len(art_low), 0.01, 0.01)
    m_high = calculate_metrics(img, recon_high, len(img_to_bytes(img)), len(art_high), 0.01, 0.01)
    
    # Higher quality must have higher PSNR
    assert m_high["psnr"] > m_low["psnr"]


# -------------------------------------------------------------
# 4. CUSTOM DCT CODEC & ARTIFACT ROUNDTRIP
# -------------------------------------------------------------
def test_dct_codec_roundtrip_and_serialization(test_images):
    codec = DCTCodec()
    for name, img in test_images.items():
        artifact, meta = codec.compress(img, quality=60, subsampling="4:2:0")
        assert len(artifact) > 0
        assert artifact.startswith(b"IL_DCT1")
        assert "inspection" in meta
        assert "spatial_values" in meta["inspection"]
        assert "dct_coefficients" in meta["inspection"]
        
        recon, rmeta = codec.decompress(artifact)
        assert recon.size == img.size
        
        metrics = calculate_metrics(img, recon, len(img_to_bytes(img)), len(artifact), 0.01, 0.01)
        assert metrics["psnr"] is not None
        if name == "high_detail":
            # Pure white noise has zero redundancy and suffers severe high-frequency cutoff
            assert metrics["psnr"] > 10.0
        else:
            assert metrics["psnr"] > 25.0  # Sensible image quality on structured images


def test_dct_arbitrary_dimensions():
    codec = DCTCodec()
    # Image with dimensions not multiple of 8 or 16
    img = Image.new("RGB", (77, 53), color=(200, 150, 80))
    artifact, meta = codec.compress(img, quality=50, subsampling="4:2:0")
    recon, _ = codec.decompress(artifact)
    assert recon.size == (77, 53)


# -------------------------------------------------------------
# 5. CUSTOM WAVELET CODEC & ARTIFACT ROUNDTRIP
# -------------------------------------------------------------
def test_wavelet_codec_roundtrip(test_images):
    codec = WaveletCodec()
    img = test_images["photo"]
    artifact, meta = codec.compress(img, wavelet="bior4.4", levels=3, threshold=15.0, quant_step=3.0)
    assert len(artifact) > 0
    assert artifact.startswith(b"IL_WAV1")
    assert "subbands_preview" in meta
    assert "LL" in meta["subbands_preview"]
    assert "HH" in meta["subbands_preview"]
    
    recon, rmeta = codec.decompress(artifact)
    assert recon.size == img.size
    
    metrics = calculate_metrics(img, recon, len(img_to_bytes(img)), len(artifact), 0.01, 0.01)
    assert metrics["psnr"] is not None
    assert metrics["ssim"] > 0.85


def test_wavelet_families():
    codec = WaveletCodec()
    img = Image.new("RGB", (64, 64), color=(100, 150, 200))
    for fam in ["haar", "db2", "db4", "bior4.4"]:
        art, _ = codec.compress(img, wavelet=fam, levels=2, threshold=10.0)
        recon, _ = codec.decompress(art)
        assert recon.size == (64, 64)


# -------------------------------------------------------------
# 6. JPEG 2000 CODEC
# -------------------------------------------------------------
def test_jpeg2000_codec_if_available(test_images):
    codec = JPEG2000Codec()
    assert codec.is_available() is True
    
    img = test_images["gradient"]
    # Lossless JP2
    art_ll, meta_ll = codec.compress(img, lossless=True)
    assert len(art_ll) > 0
    recon_ll, _ = codec.decompress(art_ll)
    assert recon_ll.size == img.size
    
    # Lossy JP2
    art_lossy, meta_lossy = codec.compress(img, lossless=False, target_rate=15.0)
    recon_lossy, _ = codec.decompress(art_lossy)
    assert recon_lossy.size == img.size


# -------------------------------------------------------------
# 7. HUFFMAN CODING DEMONSTRATION
# -------------------------------------------------------------
def test_huffman_coding_shannon_entropy():
    test_str = "ABRACADABRA_INFORMATION_THEORY_ENTROPY_AND_REDUNDANCY"
    data = test_str.encode("utf-8")
    analysis = HuffmanCoder.analyze(data)
    
    assert analysis["shannon_entropy"] > 0.0
    assert analysis["coding_efficiency"] > 90.0
    assert analysis["avg_code_length"] >= analysis["shannon_entropy"]  # Shannon's source coding theorem!
    assert analysis["redundancy"] >= 0.0
    assert len(analysis["symbol_table"]) > 0


def test_huffman_coding_lossless_roundtrip():
    # Test across random bytes, uniform bytes, and text bytes
    cases = [
        b"AAAAABBBCCDE",
        b"The quick brown fox jumps over the lazy dog." * 3,
        bytes(range(256))
    ]
    for case in cases:
        freq = HuffmanCoder.calculate_frequency_table(case)
        tree = HuffmanCoder.build_tree(freq)
        codes = HuffmanCoder.generate_codes(tree)
        packed, bits = HuffmanCoder.encode_data(case, codes)
        artifact = HuffmanCoder.serialize_artifact(case, freq, codes, packed, bits)
        decoded = HuffmanCoder.deserialize_and_decode(artifact)
        assert decoded == case, "Huffman decoded content does not match original bytes"


# -------------------------------------------------------------
# 8. API INTEGRATION TESTS
# -------------------------------------------------------------
def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "png" in data["codecs_available"]
    assert "dct_custom" in data["codecs_available"]
    assert "wavelet_custom" in data["codecs_available"]
    assert data["jpeg2000_enabled"] is True


def test_api_algorithms_list():
    res = client.get("/api/algorithms")
    assert res.status_code == 200
    algos = res.json()
    assert len(algos) >= 5
    algo_ids = [a["id"] for a in algos]
    assert "png" in algo_ids
    assert "jpeg" in algo_ids
    assert "dct_custom" in algo_ids
    assert "wavelet_custom" in algo_ids


def test_api_image_analysis(test_images):
    png_bytes = img_to_bytes(test_images["photo"])
    files = {"file": ("test.png", png_bytes, "image/png")}
    res = client.post("/api/images/analyze", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["width"] == 128
    assert data["height"] == 128
    assert data["channels"] == 3
    assert "entropy_analysis" in data
    assert data["entropy_analysis"]["shannon_entropy"] > 0


def test_api_compress_and_download(test_images):
    png_bytes = img_to_bytes(test_images["checkerboard"])
    files = {"file": ("checker.png", png_bytes, "image/png")}
    data = {
        "algorithm_id": "dct_custom",
        "params": '{"quality": 40, "subsampling": "4:2:0"}'
    }
    res = client.post("/api/compress", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    exp_id = res_data["experiment_id"]
    assert res_data["metrics"]["compression_ratio"] > 1.0
    
    # Test artifact download endpoint
    dl_res = client.get(f"/api/experiments/{exp_id}/download")
    assert dl_res.status_code == 200
    assert len(dl_res.content) == res_data["artifact_info"]["size_bytes"]
    
    # Test reconstructed image endpoint
    recon_res = client.get(f"/api/experiments/{exp_id}/reconstructed")
    assert recon_res.status_code == 200
    recon_img = Image.open(io.BytesIO(recon_res.content))
    assert recon_img.size == (128, 128)


def test_api_corrupted_upload():
    files = {"file": ("bad.png", b"NOT_A_VALID_IMAGE_HEADER_12345", "image/png")}
    res = client.post("/api/images/analyze", files=files)
    assert res.status_code == 400


def test_api_csv_export(test_images):
    # Ensure at least 1 experiment was run
    png_bytes = img_to_bytes(test_images["gradient"])
    files = {"file": ("gradient.png", png_bytes, "image/png")}
    client.post("/api/compress", files=files, data={"algorithm_id": "png", "params": '{"compress_level": 6}'})
    
    res = client.get("/api/experiments/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Compression Ratio (CR)" in res.text
    assert "Experiment ID" in res.text
