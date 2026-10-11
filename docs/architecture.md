# ImageLab Architecture Documentation

## 1. System Overview

ImageLab is a client-server research platform for evaluating image compression algorithms empirically. The architecture decouples the mathematical and signal processing runtime (FastAPI backend in Python) from the analytical visualization client (React 19 + TypeScript frontend).

```
                      +-----------------------------+
                      |       Client Browser        |
                      |   (React 19 + TypeScript)   |
                      |   Vite + Tailwind CSS v4    |
                      |   Recharts + Lucide Icons   |
                      +--------------+--------------+
                                     |
                                     | REST API (HTTP JSON / Multipart)
                                     v
                      +-----------------------------+
                      |       FastAPI Backend       |
                      |      Python 3.13 Runtime    |
                      +--------------+--------------+
                                     |
     +---------------+---------------+---------------+---------------+
     |               |               |               |               |
     v               v               v               v               v
+----------+   +----------+    +----------+    +----------+    +----------+
|   PNG    |   |   JPEG   |    | Custom   |    |  Custom  |    |  JPEG    |
|  Codec   |   |  Codec   |    | 8x8 DCT  |    | Wavelet  |    |  2000    |
| (Deflate)|   |(Pillow)  |    | (.dctz)  |    | (.wavz)  |    | (OpenJP2)|
+----------+   +----------+    +----------+    +----------+    +----------+
     |               |               |               |               |
     +---------------+---------------+---------------+---------------+
                                     |
                                     v
                      +-----------------------------+
                      |     Metrics & Evaluator     |
                      |  MSE, PSNR, SSIM, CR, bpp   |
                      |  Exact bit-equality checks  |
                      |  Encoding & Decoding Timing |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | Storage & Artifact Registry |
                      |   UUID Temporary Cache      |
                      |   Direct Binary Downloads   |
                      +-----------------------------+
```

## 2. Directory Structure

```
imagelab/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry & CORS middleware
│   │   ├── api/
│   │   │   └── endpoints.py     # REST endpoints for compression, analysis, CSV export
│   │   ├── core/
│   │   │   └── config.py        # Safety thresholds, max dimensions, storage config
│   │   ├── schemas/
│   │   │   └── api_models.py    # Pydantic schemas for request/response validation
│   │   ├── services/
│   │   │   └── experiment_service.py # Image validation, codec runner, artifact manager
│   │   ├── algorithms/
│   │   │   ├── base.py          # BaseCodec abstract interface
│   │   │   ├── registry.py      # CodecRegistry manager
│   │   │   ├── png_codec.py     # Lossless PNG encoder/decoder
│   │   │   ├── jpeg_codec.py    # ISO 10918-1 JPEG baseline encoder/decoder
│   │   │   ├── dct_codec.py     # Custom 8x8 2D orthonormal DCT & .dctz container
│   │   │   ├── wavelet_codec.py # Multiresolution 2D DWT (PyWavelets) & .wavz container
│   │   │   ├── jpeg2000_codec.py# ISO 15444-1 OpenJPEG codec
│   │   │   └── huffman.py       # Canonical Huffman tree builder & bitstream packer
│   │   └── metrics/
│   │       └── evaluator.py     # Mathematical metric calculations (PSNR, MSE, SSIM, bpp, CR)
│   ├── tests/
│   │   └── test_codecs_and_api.py # Automated test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Root shell with reactive navigation
│   │   ├── main.tsx             # React DOM root entry
│   │   ├── types/index.ts       # TypeScript domain models
│   │   ├── services/api.ts      # REST API client
│   │   ├── utils/formatters.ts  # Byte and latency formatting utilities
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ImageComparisonSlider.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── SampleImageGenerator.ts
│   │   └── pages/
│   │       ├── OverviewPage.tsx
│   │       ├── CompressionLabPage.tsx
│   │       ├── AlgorithmExplorerPage.tsx
│   │       ├── AnalyticsPage.tsx
│   │       ├── ExperimentsPage.tsx
│   │       └── TheoryDocumentationPage.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/
│   ├── architecture.md
│   ├── algorithms.md
│   ├── testing.md
│   └── project_report_outline.md
├── .gitignore
└── README.md
```

## 3. Data Flow & Artifact Serialization

1. **Upload & Analysis:** Uploaded files are validated in-memory against maximum pixel ceilings (16 megapixels) and decoded via Pillow.
2. **Execution Timing:** Compression and decompression latencies are clocked independently with `time.perf_counter()`.
3. **Artifact Generation:** Custom transforms serialize to genuine binary files:
   - `.dctz`: Magic `IL_DCT1`, dimensions, quality factor, subsampling mode, followed by quantized zigzag scan integers compressed via zlib level 9.
   - `.wavz`: Magic `IL_WAV1`, dimensions, wavelet name, decomposition levels, threshold cutoff, followed by quantized subbands compressed via zlib level 9.
   - `.huf`: Magic `IL_HUF1`, frequency table header, bit count, and tightly packed bitstream.
4. **Metric Integrity:** Metrics are calculated strictly between the original bitmap and the newly decompressed image. No simulated or interpolated values are permitted.
