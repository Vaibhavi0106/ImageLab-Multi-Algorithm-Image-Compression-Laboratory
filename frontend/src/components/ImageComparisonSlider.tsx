import React, { useState, useRef } from 'react';
import { Columns, SplitSquareVertical } from 'lucide-react';

interface ImageComparisonSliderProps {
  originalSrc: string;
  reconstructedSrc: string;
  originalLabel?: string;
  reconstructedLabel?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalSrc,
  reconstructedSrc,
  originalLabel = 'Original Image',
  reconstructedLabel = 'Reconstructed Image',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* View Switcher Controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">
          Visual Distortion Inspection
        </span>
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
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          onPointerLeave={() => setIsDragging(false)}
          onPointerMove={handlePointerMove}
          className="relative w-full aspect-video min-h-[420px] lg:min-h-[480px] xl:min-h-[540px] max-h-[660px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none cursor-ew-resize"
        >
          {/* Reconstructed Background Image */}
          <img
            src={reconstructedSrc}
            alt="Reconstructed"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-sm border border-yellow-500/50 text-yellow-300 text-[11px] font-mono px-2 py-0.5 rounded shadow">
            {reconstructedLabel}
          </div>

          {/* Original Clipped Foreground Image */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={originalSrc}
              alt="Original"
              style={{
                width: containerRef.current?.clientWidth || '100%',
                maxWidth: 'none',
              }}
              className="absolute inset-0 h-full object-contain pointer-events-none"
            />
            <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-sm border border-pink-500/50 text-pink-300 text-[11px] font-mono px-2 py-0.5 rounded shadow">
              {originalLabel}
            </div>
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.9)] cursor-ew-resize"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-pink-600 rounded-full border-2 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.6)] flex items-center justify-center text-yellow-300 text-[10px] font-bold">
              ⇄
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-pink-400">{originalLabel}</span>
            <div className="relative aspect-video min-h-[380px] lg:min-h-[440px] xl:min-h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img src={originalSrc} alt="Original" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-yellow-400">{reconstructedLabel}</span>
            <div className="relative aspect-video min-h-[380px] lg:min-h-[440px] xl:min-h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img src={reconstructedSrc} alt="Reconstructed" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
