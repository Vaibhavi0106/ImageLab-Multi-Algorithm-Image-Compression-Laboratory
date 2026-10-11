# ImageLab Compression Algorithms Specification

This document details the mathematical formulation, implementation, and binary container formats for all algorithms supported in ImageLab.

---

## 1. PNG Lossless Compression (ISO/IEC 15948)
- **Category:** Mathematically Lossless.
- **Workflow:**
  1. 2D spatial filtering per scanline using predictors: *None*, *Sub*, *Up*, *Average*, and *Paeth*.
  2. Deflate compression combining LZ77 sliding-window dictionary reduction with canonical Huffman entropy coding.
- **Verification:** Decoded output guarantees 100% exact bit-for-bit equality with the input RGB bitmap (`MSE = 0.0`, `PSNR = ∞`, `SSIM = 1.0`).
- **Tunable Parameters:**
  - `compress_level`: Integer from 0 (uncompressed store) to 9 (maximum Deflate effort).
  - `optimize`: Boolean controlling optimal filter selection per scanline.

---

## 2. Standard JPEG (ISO/IEC 10918-1)
- **Category:** Lossy Transform Coding.
- **Workflow:**
  1. RGB to YCbCr conversion.
  2. Chroma subsampling (4:4:4 or 4:2:0).
  3. 8×8 block partitioning and level shift by -128.
  4. 2D Discrete Cosine Transform (DCT).
  5. Scaled scalar quantization using standard psycho-visual luminance and chrominance tables.
  6. Zigzag scan, Differential Pulse Code Modulation (DPCM) for DC, and Run-Length Encoding (RLE) with Huffman coding for AC.
- **Tunable Parameters:**
  - `quality`: Integer from 1 to 100.
  - `subsampling`: `"4:4:4"`, `"4:2:2"`, or `"4:2:0"`.
  - `optimize`: Huffman table optimization pass.

---

## 3. Custom 8×8 DCT Transform Coder
- **Category:** Educational Transform Coding.
- **Workflow:**
  1. BT.601 YCbCr transformation.
  2. Edge-replication padding to block boundaries.
  3. Forward orthonormal 2D DCT using precomputed basis matrix $T$:
     $$F = T \cdot B \cdot T^T$$
  4. Psycho-visual quantization using ISO baseline tables scaled by quality factor $Q$:
     $$S = 5000 / Q \quad (Q < 50) \quad \text{else} \quad 200 - 2Q$$
     $$Q_{eff} = \text{clip}\left(\left\lfloor \frac{Q_{base} \times S + 50}{100} \right\rfloor, 1, 255\right)$$
  5. Integer coefficient quantization: $\hat{F} = \text{round}(F / Q_{eff})$.
  6. Zigzag reordering and container packaging.
- **Binary Container Format (`.dctz`):**
  - Bytes 0–6: Magic signature `b'IL_DCT1'`
  - Header: Original width (uint16), original height (uint16), padded width (uint16), padded height (uint16), quality factor (uint8), subsampling flag (uint8).
  - Payload: Quantized 16-bit signed integer streams compressed via zlib deflate (level 9).
- **Tunable Parameters:**
  - `quality`: 1 to 100.
  - `subsampling`: `"4:4:4"` or `"4:2:0"`.

---

## 4. Custom Multilevel Wavelet Transform Coder
- **Category:** Multiresolution Wavelet Coding.
- **Workflow:**
  1. Multilevel 2D Discrete Wavelet Transform via PyWavelets (`pywt.wavedec2`).
  2. Subband decomposition producing Approximation ($LL$) and detail subbands ($LH, HL, HH$) across dyadic scales.
  3. Approximation preserved with fine step size; detail subbands thresholded via hard or soft shrinkage ($\lambda$ parameter) followed by uniform scalar quantization ($\Delta$ step size).
  4. Reconstruction via inverse 2D DWT (`pywt.waverec2`).
- **Binary Container Format (`.wavz`):**
  - Bytes 0–6: Magic signature `b'IL_WAV1'`
  - Header: Dimensions, decomposition levels, threshold cutoff, quantization step, wavelet family descriptor.
  - Payload: Quantized 32-bit signed integer trees compressed via zlib deflate (level 9).
- **Tunable Parameters:**
  - `wavelet`: `"haar"`, `"db2"`, `"db4"`, `"bior4.4"`, `"sym4"`.
  - `levels`: Dyadic decomposition depth (1 to 4).
  - `threshold`: Subband detail cutoff (0.0 to 150.0).
  - `mode`: `"hard"` or `"soft"`.
  - `quant_step`: Quantization bin width (1.0 to 32.0).

---

## 5. JPEG 2000 (ISO/IEC 15444-1)
- **Category:** Wavelet Image Compression Standard.
- **Codec Engine:** OpenJPEG integrated directly into Pillow.
- **Workflow:**
  - Lossy mode: CDF 9/7 biorthogonal wavelet filter with EBCOT bit-plane entropy coding.
  - Lossless mode: LeGall 5/3 reversible integer wavelet filter with exact integer reconstruction.
- **Tunable Parameters:**
  - `lossless`: Boolean switch between 5/3 integer filter and 9/7 lossy filter.
  - `target_rate`: Target compression factor or target PSNR dB.
  - `num_resolutions`: Multiresolution hierarchy levels (1 to 7).

---

## 6. Educational Huffman Coding Demonstrator
- **Category:** Information Theory & Entropy Coding.
- **Formulation:**
  - Symbol probabilities: $p_i = \text{freq}_i / N$.
  - Shannon Entropy: $H(X) = -\sum p_i \log_2(p_i)$.
  - Average Code Length: $L_{avg} = \sum p_i \cdot \text{len}(code_i)$.
  - Redundancy: $R = L_{avg} - H(X) \ge 0$.
  - Efficiency: $\eta = (H(X) / L_{avg}) \times 100\%$.
- **Binary Container Format (`.huf`):**
  - Magic `b'IL_HUF1'`, original byte length, total valid bits, symbol frequency table, packed variable-length bitstream.
  - Standalone and verifiable: `deserialize_and_decode(artifact) == original_bytes`.
