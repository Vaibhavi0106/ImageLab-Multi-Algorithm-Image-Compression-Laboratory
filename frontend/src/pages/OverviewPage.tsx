import React from 'react';
import {
  Upload,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Workflow
} from 'lucide-react';
import { AlgorithmInfo, HealthInfo } from '../types';
import { generateTestImage } from '../components/SampleImageGenerator';

interface OverviewPageProps {
  algorithms: AlgorithmInfo[];
  health: HealthInfo | null;
  onSelectImageAndNavigate: (file: File) => void;
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  algorithms,
  health,
  onSelectImageAndNavigate,
  onNavigate,
}) => {
  const handleSampleClick = async (type: 'photo' | 'gradient' | 'checkerboard' | 'noise') => {
    const file = await generateTestImage(type, 256);
    onSelectImageAndNavigate(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectImageAndNavigate(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-pink-950/40 via-slate-900 to-slate-900 border border-pink-950/60 p-8 md:p-12 shadow-[0_0_25px_rgba(236,72,153,0.08)]">
        <div className="max-w-5xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-mono">
            <span>Advanced Compression Techniques (ACT) Laboratory</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Multi-Algorithm <span className="text-pink-500">Image Compression</span> <span className="text-yellow-400">Laboratory</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            ImageLab is an academically rigorous computational workbench designed for empirical evaluation of image transform coding, multiresolution wavelet analysis, scalar quantization, and entropy coding.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-sm transition-all shadow-lg shadow-pink-600/30">
              <Upload className="h-4 w-4" />
              <span>Upload Image to Lab</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/bmp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => onNavigate('lab')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 font-semibold text-sm border border-yellow-500/40 transition-all shadow-[0_0_12px_rgba(234,179,8,0.15)]"
            >
              <span>Launch Lab Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Academic Test Presets */}
        <div className="mt-8 pt-8 border-t border-slate-800/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-400 mb-3">
            Load Known Academic Test Presets:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'photo', label: 'Photographic Scenery', desc: 'Smooth tonality with localized foliage' },
              { id: 'gradient', label: 'Smooth Gradient', desc: 'Test false contouring & quantization banding' },
              { id: 'checkerboard', label: 'Checkerboard Pattern', desc: 'High frequency step edges & Gibbs ringing' },
              { id: 'noise', label: 'White Noise', desc: 'Zero redundancy benchmark' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSampleClick(preset.id as any)}
                className="text-left p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-yellow-500/60 hover:bg-yellow-950/20 transition-all group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-yellow-300">
                  {preset.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Real Scientific Pipeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Workflow className="h-5 w-5 text-pink-400" />
            <span>End-to-End Computational Pipeline</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Ingestion & Shannon Analysis',
              desc: 'Extracts exact image bytes, dimensions, and calculates zero-order Shannon entropy H(X) across raw pixel distributions.',
            },
            {
              step: '02',
              title: 'Transform & Quantization',
              desc: 'Applies 2D Discrete Cosine Transform (DCT) or Dyadic Wavelet Transform (DWT), followed by scalar psychovisual quantization.',
            },
            {
              step: '03',
              title: 'Entropy Serialization',
              desc: 'Packages quantized coefficients with headers into standalone binary artifacts (.dctz, .wavz, .huf, .jpg, .jp2).',
            },
            {
              step: '04',
              title: 'Decoded Reconstruction & Metrics',
              desc: 'Decodes serialized artifact back into 8-bit RGB and calculates MSE, PSNR, SSIM, bpp, CR, and execution latencies.',
            },
          ].map((card) => (
            <div key={card.step} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-pink-900/60 transition-colors">
              <span className="text-pink-300 font-mono text-xs font-bold bg-pink-950 px-2 py-0.5 rounded border border-pink-800">
                STAGE {card.step}
              </span>
              <h3 className="font-semibold text-sm text-white pt-1">{card.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Codec Implementations Status */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-yellow-400" />
            <span>Supported Compression Codecs & Standards</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {algorithms.length} Algorithms Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {algorithms.map((algo) => (
            <div
              key={algo.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-800/60">
                    {algo.category}
                  </span>
                  {algo.is_available ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-yellow-400">
                      <CheckCircle className="h-3 w-3 text-yellow-400" /> Ready
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-rose-400">Unavailable</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-white">{algo.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{algo.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  {Object.keys(algo.parameters).length} parameter(s)
                </span>
                <button
                  onClick={() => onNavigate('lab')}
                  className="text-yellow-400 hover:text-pink-400 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Test in Lab</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System Integrity & Academic Standards */}
      <section className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-yellow-950/40 border border-yellow-700/50 flex items-center justify-center text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.2)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white">Empirical Mathematical Rigor</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero simulated metrics. All compression ratios, MSE, PSNR, SSIM, and timings are calculated in real time from reconstructed bitstreams and actual pixel arrays.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('theory')}
            className="px-4 py-2 rounded-lg bg-pink-950/60 hover:bg-pink-900/60 text-xs font-semibold text-pink-300 border border-pink-800/60 transition-colors"
          >
            Review Syllabus Documentation
          </button>
        </div>
      </section>
    </div>
  );
};
