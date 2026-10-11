# ImageLab — Multi-Algorithm Image Compression Laboratory
### University Coursework: Advanced Compression Techniques (ACT)

ImageLab is a full-featured, academically rigorous web application and experimental workbench built for empirical analysis of image transform coding, multiresolution wavelet analysis, scalar quantization, and entropy coding.

Every feature, calculation, graph, parameter control, and artifact operates on **actual image data and real serialized byte streams**. No mockups, simulated performance curves, or predetermined numbers are used anywhere in the system.

---

## Key Features

1. **Modular Multi-Codec Architecture:**
   - **PNG (ISO/IEC 15948):** Lossless spatial predictive filtering + Deflate (LZ77 + Huffman) with exact bit-equality verification (`MSE = 0.0`, `PSNR = ∞`, `SSIM = 1.0`).
   - **Standard JPEG (ISO/IEC 10918-1):** YCbCr color conversion, 8×8 block DCT, psycho-visual scalar quantization, zigzag scan, and Huffman entropy coding with adjustable quality (1–100) and chroma subsampling (4:4:4 vs 4:2:0).
   - **Custom 8×8 DCT Transform Coder:** Complete educational pipeline converting RGB to YCbCr, computing 2D orthonormal DCT matrix transforms, applying scaled quantization, and packaging into a standalone `.dctz` binary container format.
   - **Custom Wavelet Transform Coder:** Multilevel 2D Discrete Wavelet Transform (PyWavelets) supporting Haar, Daubechies (db2, db4), and Biorthogonal (bior4.4) wavelets, dyadic subband decomposition (LL, LH, HL, HH), dead-zone scalar quantization/thresholding, and `.wavz` binary container serialization.
   - **JPEG 2000 (ISO/IEC 15444-1):** OpenJPEG-backed codec supporting lossy (CDF 9/7 biorthogonal filter) and lossless (LeGall 5/3 reversible integer filter) with live capability detection.
   - **Educational Huffman Coding Engine:** Real Shannon entropy $H(X)$, priority-queue tree construction, canonical prefix-free codes, bit-packing, standalone `.huf` serialization, and exact lossless round-trip restoration.

2. **Empirical Mathematical Integrity:**
   - Metrics calculated strictly between original and reconstructed bitmaps: Mean Squared Error (MSE), Peak Signal-to-Noise Ratio (PSNR), Structural Similarity Index (SSIM), Bits Per Pixel (bpp), Compression Ratio (CR), and Space Saved (%).
   - Separate, high-precision measurement of encoding latency and decoding latency using `time.perf_counter()`.
   - Lossless exact pixel identity check (`np.array_equal`).

3. **Interactive Research UI (Dark Navy / Charcoal Theme):**
   - **Compression Lab:** Drag-and-drop uploader, academic test presets, live parameter sliders, side-by-side and split-slider comparison, metrics dashboard, and real artifact downloads.
   - **Algorithm Explorer:** Live 8×8 DCT spatial-to-frequency matrix heatmaps, PyWavelets 2D subband pyramids (LL, LH, HL, HH), and interactive Huffman frequency codebook explorer.
   - **Results & Analytics:** Data-driven Recharts visualizations (Compression Ratio, Rate-Distortion curve, Storage footprint, Latency benchmarks) and one-click CSV export for university project reports and viva defense.
   - **Experiments:** Repeatable automated matrices (Rate-Distortion sweeps, cross-codec benchmarks, wavelet family comparisons).
   - **Theory & Documentation:** Full syllabus notes mapped to Modules 1–7 of Advanced Compression Techniques, plus technical project report outline.

---

## Technology Stack

- **Backend:**
  - Python 3.13
  - FastAPI 0.110+
  - NumPy, SciPy, Pillow (with OpenJPEG support enabled)
  - PyWavelets (`pywt`)
  - scikit-image (SSIM)
  - pytest
- **Frontend:**
  - React 19 + TypeScript
  - Vite 8
  - Tailwind CSS v4
  - Recharts
  - Lucide Icons

---

## Quickstart & Launch Instructions

### Prerequisites
- Python 3.10+ (Python 3.13 tested and verified)
- Node.js v18+ and npm

### 1. Start the Backend API Server

Open a terminal in `imagelab/backend`:

```powershell
# From imagelab/backend:
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be available at:
- **API URL:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/health`

### 2. Start the Frontend Development Server

Open a second terminal in `imagelab/frontend`:

```powershell
# From imagelab/frontend:
npm install
npm run dev
```

The frontend laboratory interface will be live at:
- **Web App:** `http://localhost:5173`

---

## Running Automated Tests

ImageLab includes a comprehensive test suite in `backend/tests/test_codecs_and_api.py` testing all codecs, roundtrip equality, metrics, error handling, and API endpoints against 4 standard image archetypes.

Run tests from `imagelab/backend`:

```powershell
python -m pytest tests/test_codecs_and_api.py -v
```

All 17 tests pass with 100% success rate:
- PNG exact reconstruction
- JPEG quality scaling
- Custom DCT roundtrip and `.dctz` serialization
- Custom DCT arbitrary dimensions handling
- Custom Wavelet roundtrip and `.wavz` serialization
- Wavelet family consistency (Haar, db2, db4, bior4.4)
- JPEG 2000 lossy & lossless validation
- Huffman coding Shannon entropy & lossless roundtrip
- Metrics verification (MSE, PSNR, SSIM, CR, Space Saved, bpp)
- Real download endpoints & CSV export

To verify the frontend TypeScript and production build:

```powershell
cd imagelab/frontend
npm run build
```

---

## Binary Artifact Containers

ImageLab implements genuine binary file formats for custom transform codecs:
- **`.dctz` (Custom DCT Container):** Magic `IL_DCT1` + dimensions + quality + subsampling header + zlib-compressed zigzag 16-bit quantized integer stream.
- **`.wavz` (Custom Wavelet Container):** Magic `IL_WAV1` + dimensions + levels + threshold cutoff + quantization step + wavelet metadata + zlib-compressed 32-bit quantized subband integer stream.
- **`.huf` (Custom Huffman Container):** Magic `IL_HUF1` + payload length + bit count + symbol frequency table + packed variable-length bitstream.
- **`.jpg` / `.png` / `.jp2`:** Standard ISO image container files generated via genuine encoders.

All artifacts are downloadable directly through the UI.

---

## Curriculum Syllabus Mapping

- **Module 1:** Information Theory, Self-Information, Shannon Entropy $H(X)$, Redundancy.
- **Module 2:** Probability Models and Zero-Order Source Statistics.
- **Module 3:** Optimal Prefix-Free Codes, Huffman Tree Construction, Average Code Length.
- **Module 4:** Lossless Compression, 2D Spatial Predictive Filtering (PNG), Deflate.
- **Module 5:** Lossy Coding, Scalar Quantization, Distortion Metrics (MSE, PSNR, SSIM).
- **Module 6:** Discrete Cosine Transform (DCT-II), Energy Compaction, ISO 10918-1 JPEG.
- **Module 7:** Multiresolution Wavelet Analysis, Mallat Pyramid, CDF 9/7, JPEG 2000.

Documentation and complete report outlines are available directly in the **Theory & Docs** tab of the web application.
