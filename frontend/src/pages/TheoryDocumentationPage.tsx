import React, { useState } from 'react';
import {
  GraduationCap,
  ChevronRight
} from 'lucide-react';

export const TheoryDocumentationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('mod1');

  const syllabusModules = [
    {
      id: 'mod1',
      title: 'Module 1: Information Theory, Entropy & Redundancy',
      summary: 'Mathematical foundations of self-information, Shannon entropy, and data redundancy.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">Self-Information and Shannon Entropy</h3>
          <p>
            In information theory, the self-information I(xᵢ) of an event or symbol occurring with probability pᵢ is given by:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-pink-900/40 font-mono text-center text-yellow-300">
            I(xᵢ) = -log₂(pᵢ) bits
          </div>
          <p>
            The average amount of information emitted by a discrete memoryless source X with alphabet &#123;x₁, ..., x_N&#125; is its <strong>Shannon Entropy</strong> H(X):
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-yellow-900/40 font-mono text-center text-pink-300">
            H(X) = - ∑ pᵢ · log₂(pᵢ) bits/symbol
          </div>
          <p>
            <strong>Shannon&apos;s Source Coding Theorem:</strong> No lossless compression scheme can encode source symbols into an average code length L_avg less than H(X). That is, L_avg ≥ H(X).
          </p>
          <p>
            <strong>Data Redundancy:</strong> Coding redundancy R measures the deviation of average code length from theoretical entropy: R = L_avg - H(X). In ImageLab, raw image entropy is analyzed before and after transform coding.
          </p>
        </div>
      ),
    },
    {
      id: 'mod2',
      title: 'Module 2 & 3: Huffman & Entropy Coding',
      summary: 'Prefix-free binary codes, Huffman tree generation, and optimality proofs.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">Canonical Huffman Coding</h3>
          <p>
            Developed by David A. Huffman (1952), Huffman coding creates an optimal prefix-free code for a set of known probabilities. A prefix-free code guarantees that no codeword is a prefix of any other codeword, allowing instantaneous decoding without lookahead.
          </p>
          <h4 className="text-sm font-semibold text-yellow-300">Algorithm Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Compute the frequency of all unique symbols in the dataset.</li>
            <li>Initialize a min-priority queue with a leaf node for each symbol.</li>
            <li>Repeatedly extract the two nodes with the lowest frequencies.</li>
            <li>Create an internal node with frequency equal to the sum of the children, and reinsert it.</li>
            <li>Traverse the final binary tree: assign binary &apos;0&apos; to left branches and &apos;1&apos; to right branches.</li>
          </ol>
          <p>
            In ImageLab&apos;s <em>Algorithm Explorer</em>, you can inspect the exact Huffman tree, prefix codes, and bit-level serialized representation for both text strings and image byte streams.
          </p>
        </div>
      ),
    },
    {
      id: 'mod4',
      title: 'Module 4: Lossless Image Compression & Standards',
      summary: 'Spatial prediction, filtering, and Deflate algorithm (PNG specification).',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">PNG: Portable Network Graphics (ISO/IEC 15948)</h3>
          <p>
            PNG achieves exact, mathematically lossless compression through a two-stage process:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>2D Spatial Predictive Filtering:</strong> Before compression, each scanline is passed through one of 5 filter predictors:
              <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-400">
                <li><em>None:</em> Raw byte unaltered.</li>
                <li><em>Sub:</em> Difference between current pixel and pixel to the left: x - a.</li>
                <li><em>Up:</em> Difference between current pixel and pixel above: x - b.</li>
                <li><em>Average:</em> Difference from the average of left and above: x - floor((a + b)/2).</li>
                <li><em>Paeth:</em> Linear predictor matching a + b - c to the closest existing neighbor.</li>
              </ul>
            </li>
            <li>
              <strong>Deflate Compression:</strong> Combines LZ77 sliding-window dictionary matching with Huffman entropy coding to compress the filtered residual bytes.
            </li>
          </ol>
          <p>
            In ImageLab, PNG compression validates that the reconstructed pixel array has MSE = 0.0, SSIM = 1.0, and an exact bit-by-bit match.
          </p>
        </div>
      ),
    },
    {
      id: 'mod5',
      title: 'Module 5: Lossy Coding, Quantization & Rate-Distortion',
      summary: 'Scalar quantization, dead-zone thresholds, and MSE/PSNR/SSIM metrics.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">Scalar Quantization & Distortion Metrics</h3>
          <p>
            Lossy compression deliberately discards visually imperceptible high-frequency information to achieve high compression ratios. The primary mechanism is <strong>scalar quantization</strong>:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-pink-900/40 font-mono text-center text-yellow-300">
            F̂(u, v) = round( F(u, v) / Q(u, v) )
          </div>
          <p>
            Quantization is a many-to-one mapping, making it non-invertible. Reconstruction computes:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-yellow-900/40 font-mono text-center text-pink-300">
            F̃(u, v) = F̂(u, v) × Q(u, v)
          </div>
          <h4 className="text-sm font-semibold text-yellow-300">Mathematical Fidelity Metrics in ImageLab:</h4>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Mean Squared Error (MSE):</strong>
              <span className="font-mono ml-2 text-yellow-400">MSE = (1 / WHC) ∑ (I(x,y,c) - Î(x,y,c))²</span>
            </li>
            <li>
              <strong>Peak Signal-to-Noise Ratio (PSNR):</strong>
              <span className="font-mono ml-2 text-pink-400">PSNR = 10 · log₁₀(255² / MSE) dB</span>
            </li>
            <li>
              <strong>Structural Similarity Index (SSIM):</strong> Compares local luminance μ, contrast σ, and structure across image patches.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'mod6',
      title: 'Module 6: 2D DCT, Block Coding & JPEG Standard',
      summary: 'Discrete Cosine Transform energy compaction, zigzag scan, and ISO 10918-1.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">2D Discrete Cosine Transform (DCT-II)</h3>
          <p>
            The DCT transforms an 8×8 spatial block into 64 spatial frequency coefficients. The forward orthonormal DCT is:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-pink-900/40 font-mono text-center text-yellow-300 text-xs">
            F(u, v) = ¼ C(u) C(v) ∑ ∑ f(x, y) cos[((2x+1)uπ)/16] cos[((2y+1)vπ)/16]
          </div>
          <p>
            where C(0) = 1/√2, and C(u) = 1 for u &gt; 0.
          </p>
          <h4 className="text-sm font-semibold text-yellow-300">Why DCT Works (Energy Compaction):</h4>
          <p>
            Natural images exhibit high spatial autocorrelation between adjacent pixels. The DCT closely approximates the optimal Karhunen-Loève Transform (KLT) for Markov-1 processes, packing over 90% of the block&apos;s signal energy into the top-left low-frequency coefficients.
          </p>
          <p>
            <strong>Zigzag Scan:</strong> Arranges the 64 coefficients in order of increasing frequency, concentrating trailing zeros at the end of the vector for maximum run-length entropy compression.
          </p>
        </div>
      ),
    },
    {
      id: 'mod7',
      title: 'Module 7: Wavelet Multiresolution Analysis & JPEG 2000',
      summary: 'Dyadic filter banks, Mallat algorithm, CDF 9/7 and LeGall 5/3 filters.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">Wavelets and Multiresolution Decomposition</h3>
          <p>
            Unlike the block-based DCT, the Discrete Wavelet Transform (DWT) operates globally on the entire image, eliminating blocking artifacts at low bit rates.
          </p>
          <h4 className="text-sm font-semibold text-yellow-300">Mallat Subband Pyramids:</h4>
          <p>
            At each scale, 1D low-pass L and high-pass H filters are applied along rows and columns, producing 4 subbands:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>LL:</strong> Approximation (coarse image)</li>
            <li><strong>LH:</strong> Horizontal details (sensitive to vertical edges)</li>
            <li><strong>HL:</strong> Vertical details (sensitive to horizontal edges)</li>
            <li><strong>HH:</strong> Diagonal details</li>
          </ul>
          <h4 className="text-sm font-semibold text-yellow-300">JPEG 2000 Filters:</h4>
          <p>
            <strong>CDF 9/7 Biorthogonal:</strong> Used for lossy compression; provides excellent visual quality and energy compaction without phase distortion.
            <br />
            <strong>LeGall 5/3 Reversible:</strong> Uses integer coefficients for lossless compression with exact integer arithmetic.
          </p>
        </div>
      ),
    },
    {
      id: 'report_outline',
      title: 'Project Viva & Technical Report Outline',
      summary: 'Complete academic report structure and syllabus mapping for project defense.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">University Technical Report & Viva Outline</h3>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <p className="text-pink-400 font-bold">1. TITLE: ImageLab — Multi-Algorithm Image Compression Laboratory</p>
            <p className="text-slate-400">2. ABSTRACT: Design and implementation of an empirical testbed for evaluating transform coding, multiresolution wavelet decomposition, and entropy coding.</p>
            <p className="text-slate-400">3. PROBLEM STATEMENT: Comparative evaluation of blocking artifacts, energy compaction, and rate-distortion efficiency across ISO and custom pipelines.</p>
            <p className="text-slate-400">4. MATHEMATICAL FORMULATION: Full derivation of 2D DCT-II, Mallat filter banks, Shannon entropy H(X), MSE, PSNR, and SSIM.</p>
            <p className="text-slate-400">5. SYSTEM ARCHITECTURE: Decoupled client-server architecture with Python/FastAPI scientific backend and React/TypeScript analytics frontend.</p>
            <p className="text-slate-400">6. EXPERIMENTAL METHODOLOGY: Controlled benchmarks on 4 test categories (Photographic, Smooth Gradient, Step Checkerboard, White Noise).</p>
            <p className="text-slate-400">7. RESULTS & DISCUSSION: Empirical R-D curves exported via CSV, demonstrating Gibbs ringing in DCT vs ringing in Wavelets.</p>
            <p className="text-slate-400">8. CONCLUSION & REFERENCES: ISO/IEC 10918-1, ISO/IEC 15444-1, Shannon (1948), Huffman (1952), Mallat (1989).</p>
          </div>
        </div>
      ),
    },
  ];

  const currentSection = syllabusModules.find((m) => m.id === activeSection) || syllabusModules[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-yellow-400" />
          <span>Theory, Mathematical Foundations & Syllabus Reference</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Comprehensive curriculum notes and formal mathematical formulations mapped to Advanced Compression Techniques.
        </p>
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2">
          {syllabusModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveSection(mod.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                activeSection === mod.id
                  ? 'bg-pink-950/40 border-pink-500/70 text-white shadow-md shadow-pink-950/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-yellow-300 hover:border-yellow-500/30'
              }`}
            >
              <div>
                <div className={`text-xs font-semibold ${activeSection === mod.id ? 'text-yellow-300' : ''}`}>{mod.title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{mod.summary}</div>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                activeSection === mod.id ? 'text-pink-400 translate-x-0.5' : 'text-slate-600'
              }`} />
            </button>
          ))}
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-8 xl:col-span-9 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
            <span>{currentSection.title}</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6 pb-4 border-b border-slate-800">
            {currentSection.summary}
          </p>
          {currentSection.content}
        </div>
      </div>
    </div>
  );
};
