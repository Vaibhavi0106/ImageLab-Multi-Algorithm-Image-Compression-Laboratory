import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  Download,
  ArrowRight
} from 'lucide-react';
import { CompressionResult } from '../types';
import { getExportCsvUrl, getArtifactDownloadUrl } from '../services/api';
import { formatBytes, formatTime } from '../utils/formatters';

interface AnalyticsPageProps {
  experiments: CompressionResult[];
  onNavigate: (tab: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ experiments, onNavigate }) => {
  const chartData = experiments.map((exp, idx) => ({
    name: `#${idx + 1} ${exp.algorithm_name.split(' ')[0]}`,
    algo: exp.algorithm_name,
    cr: exp.metrics.compression_ratio,
    psnr: exp.metrics.is_infinite_psnr ? 60.0 : exp.metrics.psnr ?? 0,
    ssim: exp.metrics.ssim,
    bpp: exp.metrics.bits_per_pixel,
    encTime: exp.metrics.encoding_time_ms,
    decTime: exp.metrics.decoding_time_ms,
    origSizeKB: Math.round(exp.metrics.original_size_bytes / 1024),
    compSizeKB: Math.round(exp.metrics.compressed_size_bytes / 1024),
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-pink-400" />
            <span>Results & Empirical Analytics</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real computational metrics recorded across all active image compression runs.
          </p>
        </div>

        {experiments.length > 0 && (
          <a
            href={getExportCsvUrl()}
            download="imagelab_experiments_report.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-pink-600/25 shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV for University Report</span>
          </a>
        )}
      </div>

      {experiments.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-slate-800 text-center bg-slate-900/40 space-y-4">
          <BarChart3 className="h-12 w-12 text-pink-500/40 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Experimental Runs Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run compressions in the Laboratory or execute automated parameter sweeps in the Experiments tab. Charts and analytical tables will be populated exclusively with your actual runtime results.
          </p>
          <button
            onClick={() => onNavigate('lab')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-lg shadow-pink-600/20"
          >
            <span>Go to Compression Lab</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Compression Ratio Comparison */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                  Compression Ratio (CR = S_orig / S_comp)
                </h3>
                <span className="text-[11px] font-mono text-yellow-400">Higher is more compact</span>
              </div>
              <div className="h-72 lg:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f182c" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c0816', borderColor: '#4a154b', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="cr" fill="#ec4899" radius={[4, 4, 0, 0]} name="Compression Ratio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Rate-Distortion: PSNR (dB) vs Bit Rate (bpp) */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                  Rate-Distortion: PSNR (dB) vs Bit Rate (bpp)
                </h3>
                <span className="text-[11px] font-mono text-pink-400">Rate vs Fidelity</span>
              </div>
              <div className="h-72 lg:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f182c" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c0816', borderColor: '#4a154b', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="psnr" fill="#eab308" radius={[4, 4, 0, 0]} name="PSNR (dB)" />
                    <Bar dataKey="bpp" fill="#ec4899" radius={[4, 4, 0, 0]} name="Bit Rate (bpp)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Storage Comparison (KB) */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Original vs Compressed Size (KB)
                </h3>
                <span className="text-[11px] font-mono text-yellow-400">Artifact footprint</span>
              </div>
              <div className="h-72 lg:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f182c" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c0816', borderColor: '#4a154b', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="origSizeKB" fill="#475569" radius={[4, 4, 0, 0]} name="Original (KB)" />
                    <Bar dataKey="compSizeKB" fill="#facc15" radius={[4, 4, 0, 0]} name="Compressed (KB)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Computational Execution Time (ms) */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                  Encoding vs Decoding Latency (ms)
                </h3>
                <span className="text-[11px] font-mono text-yellow-400">Hardware & Transform Cost</span>
              </div>
              <div className="h-72 lg:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f182c" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c0816', borderColor: '#4a154b', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="encTime" fill="#ec4899" radius={[4, 4, 0, 0]} name="Encode Time (ms)" />
                    <Bar dataKey="decTime" fill="#eab308" radius={[4, 4, 0, 0]} name="Decode Time (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Empirical Table */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
              Master Experimental Evaluation Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Run</th>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Parameters</th>
                    <th className="py-2.5 px-3">Orig / Comp Size</th>
                    <th className="py-2.5 px-3 text-pink-400">CR</th>
                    <th className="py-2.5 px-3">Space Saved</th>
                    <th className="py-2.5 px-3">bpp</th>
                    <th className="py-2.5 px-3 text-yellow-400">PSNR (dB)</th>
                    <th className="py-2.5 px-3">SSIM</th>
                    <th className="py-2.5 px-3">Total Time</th>
                    <th className="py-2.5 px-3">Artifact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {experiments.map((exp, idx) => (
                    <tr key={exp.experiment_id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-500">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{exp.algorithm_name}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                        {JSON.stringify(exp.parameters)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {formatBytes(exp.metrics.original_size_bytes)} ➔ {formatBytes(exp.metrics.compressed_size_bytes)}
                      </td>
                      <td className="py-2.5 px-3 text-pink-400 font-bold">{exp.metrics.compression_ratio.toFixed(2)}:1</td>
                      <td className="py-2.5 px-3 text-slate-300">{exp.metrics.space_saved_percent}%</td>
                      <td className="py-2.5 px-3 text-slate-300">{exp.metrics.bits_per_pixel.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-yellow-300 font-semibold">{exp.metrics.psnr_display}</td>
                      <td className="py-2.5 px-3 text-slate-300">{exp.metrics.ssim.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{formatTime(exp.metrics.total_time_ms)}</td>
                      <td className="py-2.5 px-3">
                        <a
                          href={getArtifactDownloadUrl(exp.experiment_id)}
                          download={exp.artifact_info.filename}
                          className="text-pink-400 hover:text-yellow-300 underline font-semibold transition-colors"
                        >
                          .{exp.artifact_info.extension}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
