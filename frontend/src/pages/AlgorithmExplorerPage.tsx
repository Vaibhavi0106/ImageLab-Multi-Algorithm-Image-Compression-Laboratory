import React, { useState, useEffect } from 'react';
import {
  Binary,
  Layers,
  Cpu,
  Calculator,
  RefreshCw,
  FileCode
} from 'lucide-react';
import { CompressionResult, HuffmanAnalysisResult } from '../types';
import { analyzeHuffmanText } from '../services/api';

interface AlgorithmExplorerPageProps {
  latestResult: CompressionResult | null;
}

export const AlgorithmExplorerPage: React.FC<AlgorithmExplorerPageProps> = ({ latestResult }) => {
  const [activeTab, setActiveTab] = useState<'dct' | 'wavelet' | 'huffman' | 'jpeg_vs_dct'>('dct');

  // Huffman demonstration state
  const [huffmanInput, setHuffmanInput] = useState<string>(
    'DISCRETE_COSINE_TRANSFORM_AND_WAVELET_MULTIRESLUTION_ANALYSIS'
  );
  const [huffmanResult, setHuffmanResult] = useState<HuffmanAnalysisResult | null>(null);
  const [huffmanLoading, setHuffmanLoading] = useState<boolean>(false);

  const runHuffmanAnalysis = async (text: string) => {
    setHuffmanLoading(true);
    try {
      const res = await analyzeHuffmanText(text);
      setHuffmanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setHuffmanLoading(false);
    }
  };

  useEffect(() => {
    runHuffmanAnalysis(huffmanInput);
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Binary className="h-6 w-6 text-pink-400" />
          <span>Algorithm Explorer & Mathematical Inspector</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Direct computational visualizations of internal coefficients, multiresolution subbands, quantization matrices, and entropy codebooks.
        </p>
      </div>

      {/* Explorer Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'dct', label: '8x8 DCT Block Matrix Inspector' },
          { id: 'wavelet', label: 'Wavelet Subband Decomposition' },
          { id: 'huffman', label: 'Huffman Entropy Engine' },
          { id: 'jpeg_vs_dct', label: 'Standard JPEG vs Custom DCT' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-pink-600/20 text-pink-300 border border-pink-500/50 shadow-[0_0_12px_rgba(236,72,153,0.15)]'
                : 'text-slate-400 hover:text-yellow-300 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: 8x8 DCT COEFFICIENT MATRIX INSPECTOR */}
      {activeTab === 'dct' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-yellow-400" />
              <span>Orthonormal 2D DCT Block Transformation Pipeline</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every 8×8 block undergoes level-shifting by -128, orthonormal forward 2D DCT transformation, element-wise scalar division by the scaled quantization matrix, and rounding to nearest integers.
            </p>
          </div>

          {latestResult?.inspection ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Matrix 1: Spatial Pixels */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">1. Spatial Block f(x, y)</span>
                  <span className="text-[10px] font-mono text-pink-400">[0, 255]</span>
                </div>
                <div className="grid grid-cols-8 gap-1 bg-slate-950 p-2 rounded-lg font-mono text-[9px] text-center border border-slate-800">
                  {latestResult.inspection.spatial_values.flat().map((v, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: `rgba(236, 72, 153, ${Math.max(0.15, Math.min(1, v / 255))})` }}
                      className="py-1 rounded text-white font-medium shadow-sm"
                    >
                      {Math.round(v)}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 block">Center block coordinates: ({latestResult.inspection.sample_block_x}, {latestResult.inspection.sample_block_y})</span>
              </div>

              {/* Matrix 2: DCT Coefficients */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">2. Forward 2D DCT F(u, v)</span>
                  <span className="text-[10px] font-mono text-yellow-400">Continuous Spectrum</span>
                </div>
                <div className="grid grid-cols-8 gap-1 bg-slate-950 p-2 rounded-lg font-mono text-[8px] text-center border border-slate-800">
                  {latestResult.inspection.dct_coefficients.flat().map((v, i) => (
                    <div
                      key={i}
                      className={`py-1 rounded font-medium ${
                        i === 0
                          ? 'bg-yellow-500/30 text-yellow-300 font-bold border border-yellow-500/60 shadow-[0_0_8px_rgba(234,179,8,0.3)]'
                          : Math.abs(v) > 10
                          ? 'bg-pink-900/60 text-pink-200'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {Math.round(v)}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 block">Top-left (0,0) is DC coefficient; others are AC frequencies</span>
              </div>

              {/* Matrix 3: Quantization Table */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">3. Quant Table Q(u, v)</span>
                  <span className="text-[10px] font-mono text-slate-400">Scaled (Q={latestResult.parameters?.quality ?? 75})</span>
                </div>
                <div className="grid grid-cols-8 gap-1 bg-slate-950 p-2 rounded-lg font-mono text-[9px] text-center border border-slate-800">
                  {latestResult.inspection.quantization_table.flat().map((v, i) => (
                    <div key={i} className="py-1 rounded bg-slate-900 text-slate-300">
                      {Math.round(v)}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 block">Values increase towards bottom-right (high spatial frequency attenuation)</span>
              </div>

              {/* Matrix 4: Quantized Coefficients */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">4. Quantized Integers F̂</span>
                  <span className="text-[10px] font-mono text-yellow-400">Zigzag Serialized</span>
                </div>
                <div className="grid grid-cols-8 gap-1 bg-slate-950 p-2 rounded-lg font-mono text-[9px] text-center border border-slate-800">
                  {latestResult.inspection.quantized_coefficients.flat().map((v, i) => (
                    <div
                      key={i}
                      className={`py-1 rounded font-medium ${
                        v === 0
                          ? 'bg-slate-900/50 text-slate-600'
                          : 'bg-yellow-950 text-yellow-300 border border-yellow-700/60'
                      }`}
                    >
                      {v}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 block">Notice the heavy clustering of zeros in high frequencies</span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
              <Calculator className="h-8 w-8 text-pink-400/50 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Run a compression in the Compression Lab using &quot;Custom 8x8 DCT Transform Coder&quot; to inspect real live block coefficients here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WAVELET MULTIRESOLUTION SUBBANDS */}
      {activeTab === 'wavelet' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Layers className="h-4 w-4 text-pink-400" />
              <span>Multiresolution 2D Discrete Wavelet Transform (Mallat Decomposition)</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Splits signals across orthogonal horizontal and vertical filter banks:
              LL (low-low approximation), LH (horizontal details / vertical edges), HL (vertical details / horizontal edges), and HH (diagonal details).
            </p>
          </div>

          {latestResult?.subbands_preview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[
                { name: 'LL (Approximation)', desc: 'Low-pass filtered coarse representation', data: latestResult.subbands_preview.LL },
                { name: 'HL (Vertical Details)', desc: 'Horizontal high-pass, vertical low-pass', data: latestResult.subbands_preview.HL },
                { name: 'LH (Horizontal Details)', desc: 'Horizontal low-pass, vertical high-pass', data: latestResult.subbands_preview.LH },
                { name: 'HH (Diagonal Details)', desc: 'High-pass in both spatial axes', data: latestResult.subbands_preview.HH },
              ].map((subband) => (
                <div key={subband.name} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-pink-900/60 transition-colors">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-yellow-300">{subband.name}</span>
                    <span className="text-[11px] text-pink-400 font-mono">{subband.data.length}×{subband.data[0]?.length}</span>
                  </div>
                  <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-1">
                    <canvas
                      ref={(canvas) => {
                        if (canvas && subband.data && subband.data.length > 0) {
                          const h = subband.data.length;
                          const w = subband.data[0].length;
                          canvas.width = w;
                          canvas.height = h;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            const imgData = ctx.createImageData(w, h);
                            let idx = 0;
                            for (let r = 0; r < h; r++) {
                              for (let c = 0; c < w; c++) {
                                const val = subband.data[r][c];
                                imgData.data[idx] = val;
                                imgData.data[idx + 1] = Math.round(val * 0.8);
                                imgData.data[idx + 2] = val;
                                imgData.data[idx + 3] = 255;
                                idx += 4;
                              }
                            }
                            ctx.putImageData(imgData, 0, 0);
                          }
                        }
                      }}
                      className="w-full h-full object-contain image-rendering-pixelated"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{subband.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
              <Layers className="h-8 w-8 text-pink-500/40 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Run a compression in the Compression Lab using &quot;Custom Multilevel Wavelet Transform Coder&quot; to inspect real subbands here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HUFFMAN CODING DEMONSTRATOR */}
      {activeTab === 'huffman' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-yellow-400" />
                <span>Information Theory & Canonical Huffman Entropy Coding Engine</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes zero-order Shannon entropy H(X), builds the prefix-free Huffman tree, and assigns variable-length binary codewords with minimum average code length.
              </p>
            </div>

            {/* Interactive Input Form */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Test Input Sequence</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={huffmanInput}
                  onChange={(e) => setHuffmanInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                  placeholder="Enter text or string to calculate entropy and codes..."
                />
                <button
                  onClick={() => runHuffmanAnalysis(huffmanInput)}
                  disabled={huffmanLoading || !huffmanInput}
                  className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-pink-600/20"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${huffmanLoading ? 'animate-spin' : ''}`} />
                  <span>Analyze</span>
                </button>
              </div>
            </div>
          </div>

          {huffmanResult && (
            <div className="space-y-6">
              {/* Information-Theoretic Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-pink-900/40">
                  <span className="text-[11px] uppercase tracking-wider text-pink-400 font-medium">Shannon Entropy H(X)</span>
                  <div className="text-2xl font-bold font-mono text-yellow-400 mt-1">
                    {huffmanResult.shannon_entropy} <span className="text-xs text-slate-400">bits/sym</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Theoretical lower bound</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-yellow-900/40">
                  <span className="text-[11px] uppercase tracking-wider text-yellow-400 font-medium">Avg Code Length L_avg</span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {huffmanResult.avg_code_length} <span className="text-xs text-slate-400">bits/sym</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">L_avg = ∑ pᵢ · len(cᵢ)</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-pink-900/40">
                  <span className="text-[11px] uppercase tracking-wider text-pink-400 font-medium">Coding Efficiency η</span>
                  <div className="text-2xl font-bold font-mono text-pink-300 mt-1">
                    {huffmanResult.coding_efficiency}%
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">H(X) / L_avg</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-yellow-900/40">
                  <span className="text-[11px] uppercase tracking-wider text-yellow-400 font-medium">Code Redundancy</span>
                  <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
                    {huffmanResult.redundancy} <span className="text-xs text-slate-400">bits</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">L_avg - H(X) ≥ 0</span>
                </div>
              </div>

              {/* Generated Codebook Table */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                    Generated Prefix Codebook ({huffmanResult.unique_symbols} Unique Symbols)
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Raw: {huffmanResult.total_symbols * 8} bits ➔ Packed: {huffmanResult.actual_encoded_bits} bits
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">Char</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Probability pᵢ</th>
                        <th className="py-2.5 px-3 text-yellow-400">Prefix Code</th>
                        <th className="py-2.5 px-3">Length (Bits)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {huffmanResult.symbol_table.map((row) => (
                        <tr key={row.symbol} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-slate-400">0x{row.symbol.toString(16).toUpperCase().padStart(2, '0')}</td>
                          <td className="py-2 px-3 font-semibold text-white">{row.char}</td>
                          <td className="py-2 px-3 text-slate-300">{row.frequency}</td>
                          <td className="py-2 px-3 text-slate-400">{row.probability.toFixed(4)}</td>
                          <td className="py-2 px-3 text-yellow-300 font-bold">{row.code}</td>
                          <td className="py-2 px-3 text-slate-300">{row.code_length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: JPEG vs CUSTOM DCT ARCHITECTURAL COMPARISON */}
      {activeTab === 'jpeg_vs_dct' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-pink-400" />
              <span>Architectural Comparison: ISO JPEG vs Custom Educational DCT</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent distinction between the full commercial ISO/IEC 10918-1 JPEG baseline specification and our educational custom 8×8 DCT transform codec.
            </p>
          </div>

          <div className="overflow-x-auto p-5 rounded-xl bg-slate-900 border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Feature / Stage</th>
                  <th className="py-3 px-4 text-pink-400 font-semibold">Custom Educational DCT (DCTZ)</th>
                  <th className="py-3 px-4 text-yellow-400 font-semibold">ISO JPEG Standard (JFIF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Color Space</td>
                  <td className="py-3 px-4 font-mono">ITU-R BT.601 YCbCr (Floating-point)</td>
                  <td className="py-3 px-4 font-mono">YCbCr with JFIF / Adobe color markers</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Block Partitioning</td>
                  <td className="py-3 px-4 font-mono">8 × 8 Blocks with edge replication padding</td>
                  <td className="py-3 px-4 font-mono">8 × 8 Blocks grouped into MCUs (Macroblocks)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Transform Basis</td>
                  <td className="py-3 px-4 font-mono">2D Orthonormal DCT-II matrix multiplication</td>
                  <td className="py-3 px-4 font-mono">Fast Arai, Agui, and Nakajima (AAN) or Chen DCT</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Quantization Tables</td>
                  <td className="py-3 px-4 font-mono">ISO Standard Luminance/Chrominance scaled by Q</td>
                  <td className="py-3 px-4 font-mono">Standard or custom DQT header tables</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">DC Coefficient Coding</td>
                  <td className="py-3 px-4 font-mono">Stored directly & entropy-deflated</td>
                  <td className="py-3 px-4 font-mono">Differential Pulse Code Modulation (DPCM)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Entropy Stage</td>
                  <td className="py-3 px-4 font-mono">Zigzag scan + Zlib Deflate container (LZ77+Huffman)</td>
                  <td className="py-3 px-4 font-mono">Zero-run RLE + Canonical JPEG Huffman bitstream</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Output Artifact</td>
                  <td className="py-3 px-4 font-mono">Self-describing .dctz binary container</td>
                  <td className="py-3 px-4 font-mono">Standard .jpg / .jpeg binary file</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
