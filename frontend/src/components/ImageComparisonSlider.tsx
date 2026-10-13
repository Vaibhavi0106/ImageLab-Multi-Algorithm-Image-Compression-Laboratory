import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Columns,
  SplitSquareVertical,
  Flame,
  Info,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface ImageComparisonSliderProps {
  originalSrc: string;
  reconstructedSrc: string;
  originalLabel?: string;
  reconstructedLabel?: string;
  isExactMatch?: boolean;
  mse?: number;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalSrc,
  reconstructedSrc,
  originalLabel = 'Original Image',
  reconstructedLabel = 'Reconstructed Image',
  isExactMatch = false,
  mse = 0,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'difference'>('slider');
  const [diffGain, setDiffGain] = useState<number>(10);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [diffDataUrl, setDiffDataUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Update slider position based on pointer event
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already lost
    }
  };

  // Generate amplified difference heatmap using HTML5 canvas
  useEffect(() => {
    if (viewMode !== 'difference') return;

    let isMounted = true;
    const img1 = new Image();
    const img2 = new Image();
    let loadedCount = 0;

    const onBothLoaded = () => {
      if (!isMounted) return;
      const width = img1.naturalWidth || img1.width;
      const height = img1.naturalHeight || img1.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw original and extract pixels
      ctx.drawImage(img1, 0, 0);
      const data1 = ctx.getImageData(0, 0, width, height);

      // Draw reconstructed and extract pixels
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img2, 0, 0);
      const data2 = ctx.getImageData(0, 0, width, height);

      // Compute amplified residual differences
      const diffData = ctx.createImageData(width, height);
      const p1 = data1.data;
      const p2 = data2.data;
      const pd = diffData.data;

      for (let i = 0; i < p1.length; i += 4) {
        const dr = Math.abs(p1[i] - p2[i]);
        const dg = Math.abs(p1[i + 1] - p2[i + 1]);
        const db = Math.abs(p1[i + 2] - p2[i + 2]);
        const maxDiff = Math.max(dr, dg, db);

        if (maxDiff === 0) {
          // Zero difference: dark purple/black
          pd[i] = 10;
          pd[i + 1] = 8;
          pd[i + 2] = 20;
          pd[i + 3] = 255;
        } else {
          // Amplified residual error heatmap: yellow to hot pink
          const amplified = Math.min(255, maxDiff * diffGain);
          pd[i] = Math.min(255, amplified * 1.2);      // Red / Pink
          pd[i + 1] = Math.min(255, amplified * 0.85); // Green / Yellow
          pd[i + 2] = Math.min(255, amplified * 0.2);  // Blue
          pd[i + 3] = 255;
        }
      }

      ctx.putImageData(diffData, 0, 0);
      setDiffDataUrl(canvas.toDataURL('image/png'));
    };

    img1.onload = () => {
      loadedCount++;
      if (loadedCount === 2) onBothLoaded();
    };
    img2.onload = () => {
      loadedCount++;
      if (loadedCount === 2) onBothLoaded();
    };

    img1.src = originalSrc;
    img2.src = reconstructedSrc;

    return () => {
      isMounted = false;
    };
  }, [originalSrc, reconstructedSrc, viewMode, diffGain]);

  return (
    <div className="flex flex-col gap-3">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 flex items-center gap-2">
          <span>Visual Distortion Inspection</span>
          {isExactMatch && (
            <span className="text-[10px] bg-yellow-950/80 text-yellow-300 border border-yellow-700/60 px-2 py-0.5 rounded font-mono normal-case">
              Mathematically 100% Lossless (0 Error)
            </span>
          )}
        </span>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs mr-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              disabled={zoomLevel <= 1}
              title="Zoom Out"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-yellow-400">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
              disabled={zoomLevel >= 3}
              title="Zoom In"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'slider'
                  ? 'bg-pink-600/30 text-pink-300 font-medium border border-pink-500/40'
                  : 'text-slate-400 hover:text-yellow-300'
              }`}
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              <span>Split Slider</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-pink-600/30 text-pink-300 font-medium border border-pink-500/40'
                  : 'text-slate-400 hover:text-yellow-300'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('difference')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'difference'
                  ? 'bg-yellow-500/20 text-yellow-300 font-medium border border-yellow-500/40'
                  : 'text-slate-400 hover:text-yellow-300'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-yellow-400" />
              <span>Difference Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Difference Mode Gain Bar */}
      {viewMode === 'difference' && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-yellow-900/40 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Flame className="h-4 w-4 text-yellow-400" />
            <span>Residual Error Heatmap: Shows exact pixel changes ($|Original - Reconstructed| \times {diffGain}$)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Amplification:</span>
            {[5, 10, 20, 50].map((g) => (
              <button
                key={g}
                onClick={() => setDiffGain(g)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                  diffGain === g
                    ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {g}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scientific Explanation Note if differences are subtle or exact */}
      {isExactMatch ? (
        <div className="p-3 bg-yellow-950/30 border border-yellow-700/50 rounded-xl text-xs text-yellow-300/90 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <strong>Why both sides look identical:</strong> This compression is <strong>100% mathematically lossless</strong> (<code className="font-mono text-yellow-300">MSE = 0.0</code>). Every single decoded pixel matches the original byte-for-byte.
            <div className="text-slate-400 text-[11px] mt-0.5">
              To observe strong visible differences and compression artifacts (like 8x8 block grid lines or Gibbs ringing), select <strong>Custom 8x8 DCT</strong> or <strong>JPEG</strong> and lower the <strong>Quality Factor to 10 or 15</strong>.
            </div>
          </div>
        </div>
      ) : mse < 5 && (
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-pink-400 shrink-0" />
            <span>
              High fidelity run (<span className="text-yellow-400 font-mono">MSE: {mse.toFixed(2)}</span>). Differences are subtle to the human eye.
            </span>
          </div>
          <span className="text-pink-300 font-medium">
            💡 Switch to &quot;Difference Map&quot; above to see amplified pixel changes!
          </span>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full aspect-video min-h-[420px] lg:min-h-[480px] xl:min-h-[540px] max-h-[660px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none cursor-ew-resize touch-none"
        >
          {/* Zoom Wrapper */}
          <div
            className="absolute inset-0 w-full h-full transition-transform duration-100 origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* 1. Reconstructed Image (Background: Full Area) */}
            <img
              src={reconstructedSrc}
              alt="Reconstructed"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />

            {/* 2. Original Image (Foreground: Clipped via CSS clip-path to exact pixel match) */}
            <img
              src={originalSrc}
              alt="Original"
              draggable={false}
              style={{
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
              }}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
          </div>

          {/* Labels */}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-sm border border-pink-500/50 text-pink-300 text-[11px] font-mono px-2 py-0.5 rounded shadow pointer-events-none z-10">
            {originalLabel} (Left)
          </div>
          <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-sm border border-yellow-500/50 text-yellow-300 text-[11px] font-mono px-2 py-0.5 rounded shadow pointer-events-none z-10">
            {reconstructedLabel} (Right)
          </div>

          {/* Vertical Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.9)] cursor-ew-resize z-20 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-pink-600 to-rose-600 rounded-full border-2 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.7)] flex items-center justify-center text-yellow-300 text-xs font-bold">
              ⇄
            </div>
          </div>
        </div>
      ) : viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-pink-400">{originalLabel}</span>
            <div className="relative aspect-video min-h-[380px] lg:min-h-[440px] xl:min-h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <div
                className="w-full h-full flex items-center justify-center transition-transform origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img src={originalSrc} alt="Original" className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-yellow-400">{reconstructedLabel}</span>
            <div className="relative aspect-video min-h-[380px] lg:min-h-[440px] xl:min-h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <div
                className="w-full h-full flex items-center justify-center transition-transform origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img src={reconstructedSrc} alt="Reconstructed" className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Difference Heatmap Mode */
        <div className="relative aspect-video min-h-[420px] lg:min-h-[480px] xl:min-h-[540px] bg-slate-950 rounded-xl overflow-hidden border border-yellow-900/40 flex items-center justify-center">
          {diffDataUrl ? (
            <div
              className="w-full h-full flex items-center justify-center transition-transform origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img src={diffDataUrl} alt="Difference Heatmap" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono">Computing residual difference map...</div>
          )}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-sm border border-yellow-500/50 text-yellow-300 text-[11px] font-mono px-2.5 py-1 rounded shadow">
            Heatmap: Dark = Zero Error | Bright Gold/Pink = Quantization Loss
          </div>
        </div>
      )}
    </div>
  );
};
