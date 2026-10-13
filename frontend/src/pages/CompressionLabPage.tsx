import React, { useState } from 'react';
import {
  Upload,
  Download,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileDown
} from 'lucide-react';
import { AlgorithmInfo, ImageAnalysis, CompressionResult } from '../types';
import { compressImage, getArtifactDownloadUrl, getReconstructedImageUrl } from '../services/api';
import { formatBytes, formatTime } from '../utils/formatters';
import { MetricCard } from '../components/MetricCard';
import { ImageComparisonSlider } from '../components/ImageComparisonSlider';
import { generateTestImage } from '../components/SampleImageGenerator';

interface CompressionLabPageProps {
  algorithms: AlgorithmInfo[];
  selectedFile: File | null;
  imageAnalysis: ImageAnalysis | null;
  onFileSelect: (file: File) => void;
  onExperimentComplete: (result: CompressionResult) => void;
}

export const CompressionLabPage: React.FC<CompressionLabPageProps> = ({
  algorithms,
  selectedFile,
  imageAnalysis,
  onFileSelect,
  onExperimentComplete,
}) => {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('dct_custom');
  const [params, setParams] = useState<Record<string, any>>({
    quality: 75,
    subsampling: '4:4:4',
    wavelet: 'bior4.4',
    levels: 3,
    threshold: 20.0,
    compress_level: 6,
    optimize: true,
    lossless: false,
    quality_mode: 'rates',
    target_rate: 20.0,
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<CompressionResult | null>(null);

  const selectedAlgo = algorithms.find((a) => a.id === selectedAlgoId);

  const handleParamChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleRunCompression = async () => {
    if (!selectedFile) return;
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const result = await compressImage(selectedFile, selectedAlgoId, params);
      setLatestResult(result);
      onExperimentComplete(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete compression operation');
    } finally {
      setIsRunning(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
      setLatestResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
      setLatestResult(null);
    }
  };

  const handleLoadSample = async (type: 'photo' | 'gradient' | 'checkerboard' | 'noise') => {
    const file = await generateTestImage(type, 256);
    onFileSelect(file);
    setLatestResult(null);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Description */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Compression Laboratory Workspace</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Perform real-time mathematical compression, reconstruct byte streams, and inspect empirical rate-distortion metrics.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Source & Algorithm Controls */}
        <div className="lg:col-span-5 xl:col-span-4 2xl:col-span-3 space-y-6">
          {/* 1. Image Ingestion Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                1. Image Ingestion
              </span>
              {imageAnalysis && (
                <span className="text-[11px] font-mono text-yellow-300 bg-yellow-950/80 px-2 py-0.5 rounded border border-yellow-700/60">
                  {imageAnalysis.width}×{imageAnalysis.height} px
                </span>
              )}
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-800 hover:border-pink-500/60 rounded-xl p-5 text-center bg-slate-950/40 transition-colors"
            >
              {imageAnalysis ? (
                <div className="flex items-center gap-4 text-left">
                  <img
                    src={imageAnalysis.thumbnail_b64}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-pink-900/60 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{imageAnalysis.filename}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatBytes(imageAnalysis.file_size_bytes)} • {imageAnalysis.mode} ({imageAnalysis.channels} ch)
                    </p>
                    <p className="text-[11px] text-yellow-300 font-mono mt-0.5">
                      Entropy H(X): {imageAnalysis.entropy_analysis.shannon_entropy} bits/sym
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-pink-400/60" />
                  <p className="text-xs text-slate-300">Drag & drop image here, or browse</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <label className="cursor-pointer text-xs px-3 py-1.5 rounded-lg bg-pink-950/50 hover:bg-pink-900/50 text-pink-300 border border-pink-800/60 font-medium transition-colors">
                  Browse File
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/bmp"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] text-slate-400">Or test with standard sample:</span>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {[
                  { id: 'photo', label: 'Photo' },
                  { id: 'gradient', label: 'Gradient' },
                  { id: 'checkerboard', label: 'Checker' },
                  { id: 'noise', label: 'Noise' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSample(s.id as any)}
                    className="py-1 px-1.5 text-center rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-yellow-300 hover:border-yellow-500/50 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Algorithm & Parameters Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400 block">
              2. Algorithm & Parameter Selection
            </span>

            {/* Algorithm Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Algorithm</label>
              <select
                value={selectedAlgoId}
                onChange={(e) => setSelectedAlgoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
              >
                {algorithms.map((algo) => (
                  <option key={algo.id} value={algo.id} disabled={!algo.is_available}>
                    {algo.name} {!algo.is_available ? '(Unavailable)' : ''}
                  </option>
                ))}
              </select>
              {selectedAlgo && (
                <p className="text-[11px] text-slate-400 leading-normal pt-1">
                  {selectedAlgo.description}
                </p>
              )}
            </div>

            {/* Parameter Sliders / Dropdowns */}
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              {/* Quality Factor for DCT and JPEG */}
              {(selectedAlgoId === 'dct_custom' || selectedAlgoId === 'jpeg') && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Quality Factor (Q)</span>
                    <span className="font-mono text-yellow-400 font-semibold">{params.quality}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={params.quality}
                    onChange={(e) => handleParamChange('quality', parseInt(e.target.value))}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 (High Compression)</span>
                    <span>50 (Standard)</span>
                    <span>100 (Fine Quant)</span>
                  </div>
                </div>
              )}

              {/* Subsampling for DCT and JPEG */}
              {(selectedAlgoId === 'dct_custom' || selectedAlgoId === 'jpeg') && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300">Chroma Subsampling</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['4:4:4', '4:2:0'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleParamChange('subsampling', mode)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-mono border transition-colors ${
                          params.subsampling === mode
                            ? 'bg-pink-600/25 border-pink-500 text-pink-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-yellow-300'
                        }`}
                      >
                        {mode} {mode === '4:4:4' ? '(No Loss)' : '(2x2 Chroma)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wavelet Options */}
              {selectedAlgoId === 'wavelet_custom' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300">Wavelet Mother Function</label>
                    <select
                      value={params.wavelet}
                      onChange={(e) => handleParamChange('wavelet', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                    >
                      {['haar', 'db2', 'db4', 'bior4.4', 'sym4'].map((w) => (
                        <option key={w} value={w}>
                          {w.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Decomposition Levels</span>
                      <span className="font-mono text-yellow-400 font-semibold">{params.levels}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={params.levels}
                      onChange={(e) => handleParamChange('levels', parseInt(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Threshold Cutoff (λ)</span>
                      <span className="font-mono text-yellow-400 font-semibold">{params.threshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={params.threshold}
                      onChange={(e) => handleParamChange('threshold', parseFloat(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* PNG Compression Level */}
              {selectedAlgoId === 'png' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Zlib Deflate Level</span>
                    <span className="font-mono text-yellow-400 font-semibold">{params.compress_level}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={params.compress_level}
                    onChange={(e) => handleParamChange('compress_level', parseInt(e.target.value))}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 (Fast / Store)</span>
                    <span>9 (Max Compression)</span>
                  </div>
                </div>
              )}

              {/* JPEG 2000 Options */}
              {selectedAlgoId === 'jpeg2000' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={params.lossless}
                      onChange={(e) => handleParamChange('lossless', e.target.checked)}
                      className="rounded accent-pink-500"
                    />
                    <span className="text-xs text-slate-300">
                      Lossless Mode (LeGall 5/3 Reversible Wavelet)
                    </span>
                  </label>

                  {!params.lossless && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">Target Rate Factor</span>
                        <span className="font-mono text-yellow-400 font-semibold">{params.target_rate}</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="80"
                        step="2"
                        value={params.target_rate}
                        onChange={(e) => handleParamChange('target_rate', parseFloat(e.target.value))}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Execute Compression Button */}
            <button
              onClick={handleRunCompression}
              disabled={!selectedFile || isRunning}
              className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                !selectedFile || isRunning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-600/25'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin text-yellow-300" />
                  <span>Processing Real Bitstream...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current text-yellow-300" />
                  <span>Execute Compression</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Comparison & Scientific Metric Suite */}
        <div className="lg:col-span-7 xl:col-span-8 2xl:col-span-9 space-y-6">
          {latestResult ? (
            <>
              {/* Visual Comparison Area */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <ImageComparisonSlider
                  originalSrc={latestResult.original_preview_b64 || ''}
                  reconstructedSrc={latestResult.reconstructed_preview_b64 || ''}
                  originalLabel={`Original (${formatBytes(latestResult.metrics.original_size_bytes)})`}
                  reconstructedLabel={`${latestResult.algorithm_name} (${formatBytes(latestResult.metrics.compressed_size_bytes)})`}
                  isExactMatch={latestResult.metrics.is_exact_match}
                  mse={latestResult.metrics.mse}
                />
              </div>

              {/* Primary Rate & Distortion Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Compression Ratio"
                  value={latestResult.metrics.compression_ratio.toFixed(2)}
                  unit=": 1"
                  formula="CR = S_orig / S_comp"
                  highlight="pink"
                  subtext={`Saved ${latestResult.metrics.space_saved_percent}% storage`}
                />
                <MetricCard
                  label="Peak SNR (PSNR)"
                  value={latestResult.metrics.is_infinite_psnr ? '∞' : latestResult.metrics.psnr ?? 'N/A'}
                  unit={latestResult.metrics.is_infinite_psnr ? '' : 'dB'}
                  formula="10·log₁₀(255²/MSE)"
                  highlight={latestResult.metrics.is_infinite_psnr ? 'yellow' : 'yellow'}
                  subtext={latestResult.metrics.is_infinite_psnr ? 'Mathematically Lossless' : `MSE: ${latestResult.metrics.mse}`}
                />
                <MetricCard
                  label="Structural Sim. (SSIM)"
                  value={latestResult.metrics.ssim.toFixed(4)}
                  formula="SSIM ∈ [-1, 1]"
                  highlight="pink"
                  subtext={latestResult.metrics.is_exact_match ? 'Exact Pixel Identity' : 'Multi-scale luminance/contrast'}
                />
                <MetricCard
                  label="Bit Rate"
                  value={latestResult.metrics.bits_per_pixel.toFixed(3)}
                  unit="bpp"
                  formula="(S_comp × 8) / (W × H)"
                  highlight="yellow"
                  subtext="Bits per pixel sample"
                />
              </div>

              {/* Execution Latencies & Bit-Fidelity Status */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-pink-400" />
                    <span>Encode: <strong className="font-mono text-yellow-300">{formatTime(latestResult.metrics.encoding_time_ms)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span>Decode: <strong className="font-mono text-yellow-300">{formatTime(latestResult.metrics.decoding_time_ms)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {latestResult.metrics.is_exact_match ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-950/70 text-yellow-300 border border-yellow-700/60 text-[11px] font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" />
                      100% Exact Pixel Equality Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-pink-950/50 text-pink-300 border border-pink-800/60 text-[11px] font-mono">
                      Lossy Quantization (MSE: {latestResult.metrics.mse})
                    </span>
                  )}
                </div>
              </div>

              {/* Download Real Artifacts Area */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                    Serialized File Artifacts
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Download genuine binary stream container ({latestResult.artifact_info.filename}, {formatBytes(latestResult.metrics.compressed_size_bytes)}) or reconstructed bitmap.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={getArtifactDownloadUrl(latestResult.experiment_id)}
                    download={latestResult.artifact_info.filename}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-pink-600/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .{latestResult.artifact_info.extension} Artifact</span>
                  </a>
                  <a
                    href={getReconstructedImageUrl(latestResult.experiment_id)}
                    download="reconstructed_image.png"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-950/50 hover:bg-yellow-900/50 text-yellow-300 text-xs font-semibold border border-yellow-700/60 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Download Reconstructed PNG</span>
                  </a>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="min-h-[480px] h-[560px] rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center bg-slate-950/20">
              <Sliders className="h-10 w-10 text-pink-500/40 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Compression Executed Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select an image on the left, tune the compression parameters, and click &quot;Execute Compression&quot; to inspect real-time bitstreams and distortion metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
