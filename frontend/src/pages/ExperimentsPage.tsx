import React, { useState } from 'react';
import {
  Microscope,
  Play,
  RotateCcw,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CompressionResult, AlgorithmInfo, ImageAnalysis } from '../types';
import { runBatchExperiments } from '../services/api';
import { formatBytes, formatTime } from '../utils/formatters';
import { generateTestImage } from '../components/SampleImageGenerator';

interface ExperimentsPageProps {
  algorithms: AlgorithmInfo[];
  selectedFile: File | null;
  imageAnalysis: ImageAnalysis | null;
  onFileSelect: (file: File) => void;
  onBatchComplete: (results: CompressionResult[]) => void;
  onNavigate: (tab: string) => void;
}

export const ExperimentsPage: React.FC<ExperimentsPageProps> = ({
  algorithms,
  selectedFile,
  imageAnalysis,
  onFileSelect,
  onBatchComplete,
  onNavigate,
}) => {
  const [activeProtocol, setActiveProtocol] = useState<'quality_sweep' | 'cross_algo' | 'wavelet_families'>('quality_sweep');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<CompressionResult[]>([]);

  // Config options
  const [sweepAlgo, setSweepAlgo] = useState<string>('dct_custom');

  const executeProtocol = async () => {
    let fileToUse = selectedFile;
    if (!fileToUse) {
      fileToUse = await generateTestImage('photo', 256);
      onFileSelect(fileToUse);
    }

    setIsRunning(true);
    setErrorMsg(null);

    let configurations: Array<{ algorithm_id: string; parameters: Record<string, any> }> = [];

    if (activeProtocol === 'quality_sweep') {
      const qValues = [15, 30, 50, 70, 90];
      configurations = qValues.map((q) => ({
        algorithm_id: sweepAlgo,
        parameters: { quality: q, subsampling: '4:2:0' },
      }));
    } else if (activeProtocol === 'cross_algo') {
      configurations = [
        { algorithm_id: 'png', parameters: { compress_level: 6, optimize: true } },
        { algorithm_id: 'jpeg', parameters: { quality: 75, subsampling: '4:2:0' } },
        { algorithm_id: 'dct_custom', parameters: { quality: 75, subsampling: '4:4:4' } },
        { algorithm_id: 'wavelet_custom', parameters: { wavelet: 'bior4.4', levels: 3, threshold: 20.0 } },
      ];
      const jp2 = algorithms.find((a) => a.id === 'jpeg2000' && a.is_available);
      if (jp2) {
        configurations.push({ algorithm_id: 'jpeg2000', parameters: { lossless: false, target_rate: 20.0 } });
      }
    } else if (activeProtocol === 'wavelet_families') {
      const families = ['haar', 'db2', 'db4', 'bior4.4'];
      configurations = families.map((fam) => ({
        algorithm_id: 'wavelet_custom',
        parameters: { wavelet: fam, levels: 3, threshold: 20.0, quant_step: 4.0 },
      }));
    }

    try {
      const results = await runBatchExperiments(fileToUse, configurations);
      setBatchResults(results);
      onBatchComplete(results);
    } catch (err: any) {
      setErrorMsg(err.message || 'Batch experiment failed');
    } finally {
      setIsRunning(false);
    }
  };

  const chartData = batchResults.map((r, i) => ({
    name: activeProtocol === 'quality_sweep' ? `Q=${r.parameters?.quality}` : r.algorithm_name.split(' ')[0],
    cr: r.metrics.compression_ratio,
    bpp: r.metrics.bits_per_pixel,
    psnr: r.metrics.is_infinite_psnr ? 55 : r.metrics.psnr ?? 0,
    ssim: r.metrics.ssim,
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Microscope className="h-6 w-6 text-yellow-400" />
          <span>Automated Experimental Protocols</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Execute repeatable scientific test matrices, sweep quantization parameters, and construct empirical rate-distortion curves.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Protocol Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'quality_sweep',
            title: 'Protocol A: Rate-Distortion Sweep',
            desc: 'Evaluates Quality Factor Q ∈ [15, 30, 50, 70, 90] across transform coding to plot empirical R-D curve.',
          },
          {
            id: 'cross_algo',
            title: 'Protocol B: Multi-Codec Cross-Benchmark',
            desc: 'Executes PNG, JPEG, Custom 8x8 DCT, PyWavelets, and JPEG 2000 on the identical image payload.',
          },
          {
            id: 'wavelet_families',
            title: 'Protocol C: Wavelet Family Comparison',
            desc: 'Compares Haar, Daubechies (db2, db4), and Biorthogonal (bior4.4) filters under uniform subband thresholding.',
          },
        ].map((proto) => (
          <div
            key={proto.id}
            onClick={() => setActiveProtocol(proto.id as any)}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              activeProtocol === proto.id
                ? 'bg-pink-950/30 border-pink-500/70 shadow-lg shadow-pink-950/40 text-white'
                : 'bg-slate-900 border-slate-800 hover:border-yellow-500/40'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                activeProtocol === proto.id
                  ? 'bg-yellow-950 text-yellow-300 border border-yellow-700/60 font-semibold'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                Matrix Protocol
              </span>
              {activeProtocol === proto.id && <CheckCircle className="h-4 w-4 text-yellow-400" />}
            </div>
            <h3 className="font-semibold text-sm text-white">{proto.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{proto.desc}</p>
          </div>
        ))}
      </div>

      {/* Protocol Configuration & Run Action */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-yellow-300">Target Image Payload</div>
          <p className="text-xs text-slate-400">
            {imageAnalysis
              ? `Using uploaded "${imageAnalysis.filename}" (${imageAnalysis.width}×${imageAnalysis.height} px, ${formatBytes(imageAnalysis.file_size_bytes)})`
              : 'No image uploaded yet. Executing will automatically synthesize a photographic scenery benchmark.'}
          </p>

          {activeProtocol === 'quality_sweep' && (
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-slate-300">Sweep Target:</span>
              <select
                value={sweepAlgo}
                onChange={(e) => setSweepAlgo(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-pink-500"
              >
                <option value="dct_custom">Custom 8x8 DCT Coder</option>
                <option value="jpeg">Standard JPEG (ISO 10918-1)</option>
              </select>
            </div>
          )}
        </div>

        <button
          onClick={executeProtocol}
          disabled={isRunning}
          className={`px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all shrink-0 ${
            isRunning
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-600/30'
          }`}
        >
          {isRunning ? (
            <>
              <RotateCcw className="h-4 w-4 animate-spin text-yellow-300" />
              <span>Running Experimental Matrix...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current text-yellow-300" />
              <span>Launch Matrix Execution</span>
            </>
          )}
        </button>
      </div>

      {/* Protocol Results Section */}
      {batchResults.length > 0 && (
        <div className="space-y-6">
          {/* Rate-Distortion Curve Chart */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-pink-400" />
                <span>Empirical Rate-Distortion Curve: PSNR (dB) vs Bit Rate (bpp)</span>
              </h3>
              <span className="text-xs font-mono text-pink-300">Higher curve = Superior Rate-Distortion Trade-off</span>
            </div>

            <div className="h-80 lg:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f182c" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c0816', borderColor: '#4a154b', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="psnr" stroke="#eab308" strokeWidth={2} name="PSNR (dB)" dot={{ r: 4, fill: '#eab308' }} />
                  <Line type="monotone" dataKey="bpp" stroke="#ec4899" strokeWidth={2} name="Bit Rate (bpp)" dot={{ r: 4, fill: '#ec4899' }} />
                  <Line type="monotone" dataKey="cr" stroke="#f43f5e" strokeWidth={2} name="Compression Ratio" dot={{ r: 4, fill: '#f43f5e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Results Table */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                Recorded Matrix Data ({batchResults.length} Runs Completed)
              </h3>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs text-yellow-400 hover:text-pink-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <span>View Full Analytics Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Run</th>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Parameters</th>
                    <th className="py-2.5 px-3">Compressed Size</th>
                    <th className="py-2.5 px-3 text-pink-400">CR</th>
                    <th className="py-2.5 px-3">bpp</th>
                    <th className="py-2.5 px-3 text-yellow-400">PSNR (dB)</th>
                    <th className="py-2.5 px-3">SSIM</th>
                    <th className="py-2.5 px-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {batchResults.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-500">#{i + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{r.algorithm_name}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[140px]">
                        {JSON.stringify(r.parameters)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{formatBytes(r.metrics.compressed_size_bytes)}</td>
                      <td className="py-2.5 px-3 text-pink-400 font-bold">{r.metrics.compression_ratio.toFixed(2)}:1</td>
                      <td className="py-2.5 px-3 text-slate-300">{r.metrics.bits_per_pixel.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-yellow-300 font-semibold">{r.metrics.psnr_display}</td>
                      <td className="py-2.5 px-3 text-slate-300">{r.metrics.ssim.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{formatTime(r.metrics.total_time_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
