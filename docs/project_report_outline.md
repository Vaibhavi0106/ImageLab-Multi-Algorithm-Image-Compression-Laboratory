# Academic Project Report Outline
## Subject: Advanced Compression Techniques (ACT)
## Project: ImageLab — Multi-Algorithm Image Compression Laboratory

---

### 1. Title Page
- **Project Title:** ImageLab — Multi-Algorithm Image Compression Laboratory
- **Author / Candidate:** [Student Name / Roll Number]
- **Subject:** Advanced Compression Techniques (ACT)
- **Institution:** Department of Computer Science & Engineering
- **Date:** Academic Year 2026–2027

---

### 2. Abstract
A concise 250-word summary outlining:
- The design and implementation of an empirical software workbench for comparative image compression.
- Evaluation of lossless (PNG), transform-based (JPEG, Custom 8×8 DCT), multiresolution wavelet (Custom DWT, JPEG 2000), and entropy-based (Huffman) algorithms.
- Implementation of mathematical metrics (MSE, PSNR, SSIM, bpp, CR, latencies) computed on genuine reconstructed bitstreams.
- Practical findings: blocking artifacts in DCT vs. ringing in wavelets, and rate-distortion efficiency across benchmark images.

---

### 3. Problem Statement & Motivation
- **Problem Statement:** Existing academic demonstrations of compression techniques are often purely theoretical, UI mockups, or closed-source black-box CLI utilities that obscure internal transform coefficients.
- **Motivation:** Need for an interactive, reproducible laboratory where students and researchers can inspect spatial-to-frequency conversions, coefficient quantization, zigzag scans, and empirical rate-distortion trade-offs using real images.

---

### 4. Curriculum Alignment
- **Module 1:** Information Theory, Self-Information, Shannon Entropy $H(X)$, Redundancy.
- **Module 2:** Probability Models and Zero-Order Source Statistics.
- **Module 3:** Optimal Prefix-Free Codes, Huffman Tree Construction, Average Code Length.
- **Module 4:** Lossless Compression, 2D Spatial Predictive Filtering (PNG), Deflate.
- **Module 5:** Lossy Coding, Scalar Quantization, Distortion Metrics (MSE, PSNR, SSIM).
- **Module 6:** Discrete Cosine Transform (DCT-II), Energy Compaction, ISO 10918-1 JPEG.
- **Module 7:** Multiresolution Wavelet Analysis, Mallat Pyramid, CDF 9/7, JPEG 2000.

---

### 5. Mathematical Formulation & System Architecture
- **2D Orthonormal DCT-II:** Matrix multiplication formulation and energy compaction proofs.
- **Scalar Quantization:** Uniform and psycho-visual quantization table scaling.
- **Multilevel DWT:** Dyadic filter bank decomposition into $LL, LH, HL, HH$ subbands.
- **Information Entropy:** Shannon entropy formula and Huffman tree optimality.
- **System Architecture:** Decoupled FastAPI (Python 3.13) backend with scientific computing stack (NumPy, SciPy, Pillow, PyWavelets, OpenJPEG) and React 19 + TypeScript frontend.

---

### 6. Experimental Methodology & Benchmark Results
- **Test Archetypes:** Photographic scenery, smooth gradient, checkerboard pattern, synthetic white noise.
- **Protocols:**
  - Protocol A: Rate-Distortion sweep across Quality Factor $Q \in [15, 95]$.
  - Protocol B: Multi-codec cross-benchmark at normalized bit rates.
  - Protocol C: Wavelet family comparison (Haar vs. Daubechies vs. Biorthogonal).
- **Result Tables:** Exported directly from ImageLab's `/api/experiments/export/csv` endpoint into LaTeX/Markdown tables.

---

### 7. Discussion, Artifact Analysis & Limitations
- **Gibbs Ringing vs. Blocking Artifacts:** Visual comparison of block boundary discontinuities in 8×8 DCT versus localized wavelet ringing around sharp edges.
- **Redundancy Analysis:** Demonstration that white noise has near-zero redundancy, leading to severe high-frequency attenuation under scalar quantization.
- **Limitations:** Single-threaded Python encoding overhead compared to hardware-accelerated SIMD codecs; memory constraints on images exceeding 16 megapixels.

---

### 8. Conclusion & Viva Defense Notes
- Summary of verified mathematical principles.
- Readiness for university technical defense and project demonstration.

---

### 9. References & Standards
1. Shannon, C. E. (1948). "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 379–423.
2. Huffman, D. A. (1952). "A Method for the Construction of Minimum-Redundancy Codes." *Proceedings of the IRE*, 40(9), 1098–1101.
3. ISO/IEC 10918-1:1994. *Digital compression and coding of continuous-tone still images: Requirements and guidelines (JPEG)*.
4. ISO/IEC 15444-1:2019. *Information technology — JPEG 2000 image coding system: Core coding system*.
5. Mallat, S. G. (1989). "A theory for multiresolution signal decomposition: the wavelet representation." *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 11(7), 674–693.
6. Wang, Z., Bovik, A. C., Sheikh, H. R., & Simoncelli, E. P. (2004). "Image quality assessment: from error visibility to structural similarity." *IEEE Transactions on Image Processing*, 13(4), 600–612.
