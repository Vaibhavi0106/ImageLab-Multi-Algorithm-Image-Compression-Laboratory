# ImageLab Automated Testing Strategy

## 1. Test Architecture

The ImageLab test suite is located in `backend/tests/test_codecs_and_api.py` and is executed via `pytest`.

Tests are divided into 4 rigor tiers:
1. **Mathematical Metrics:** Exact reconstruction identity, infinite PSNR detection, SSIM window boundaries, bpp, and compression ratio.
2. **Codec Roundtrip Integrity:** Verification that every algorithm (PNG, JPEG, Custom DCT, Custom Wavelets, JPEG 2000, Huffman) successfully compresses, serializes to real file artifacts, decodes, and reconstructs valid bitmaps.
3. **Information-Theoretic Correctness:** Verification of Shannon's source coding theorem ($L_{avg} \ge H(X)$) and exact byte-for-byte deserialization.
4. **API End-to-End Integration:** Testing HTTP endpoints (`/api/health`, `/api/algorithms`, `/api/images/analyze`, `/api/compress`, `/api/experiments`, `/api/experiments/{id}/download`, `/api/experiments/export/csv`).

## 2. Benchmark Test Images

The automated suite evaluates against 4 standard image archetypes:
- **Photographic Scenery (`photo`):** Natural color gradients, medium frequency structures, high spatial autocorrelation.
- **Smooth Linear Gradient (`gradient`):** Tests contouring, quantization banding, and scalar step sizes.
- **High-Contrast Checkerboard (`checkerboard`):** Step discontinuities to evaluate high-frequency transform energy and Gibbs ringing.
- **Synthetic White Noise (`high_detail`):** Zero spatial redundancy to benchmark theoretical worst-case rate-distortion bounds.

## 3. Running the Test Suite

From the `backend` directory:
```bash
python -m pytest tests/test_codecs_and_api.py -v
```

Execution output:
```
tests/test_codecs_and_api.py::test_metrics_exact_reconstruction PASSED
tests/test_codecs_and_api.py::test_metrics_lossy_distortion PASSED
tests/test_codecs_and_api.py::test_png_codec_lossless_exact_reconstruction PASSED
tests/test_codecs_and_api.py::test_jpeg_codec_quality_scaling PASSED
tests/test_codecs_and_api.py::test_dct_codec_roundtrip_and_serialization PASSED
tests/test_codecs_and_api.py::test_dct_arbitrary_dimensions PASSED
tests/test_codecs_and_api.py::test_wavelet_codec_roundtrip PASSED
tests/test_codecs_and_api.py::test_wavelet_families PASSED
tests/test_codecs_and_api.py::test_jpeg2000_codec_if_available PASSED
tests/test_codecs_and_api.py::test_huffman_coding_shannon_entropy PASSED
tests/test_codecs_and_api.py::test_huffman_coding_lossless_roundtrip PASSED
tests/test_codecs_and_api.py::test_api_health PASSED
tests/test_codecs_and_api.py::test_api_algorithms_list PASSED
tests/test_codecs_and_api.py::test_api_image_analysis PASSED
tests/test_codecs_and_api.py::test_api_compress_and_download PASSED
tests/test_codecs_and_api.py::test_api_corrupted_upload PASSED
tests/test_codecs_and_api.py::test_api_csv_export PASSED
======================== 17 passed, 1 warning in 2.19s ========================
```
