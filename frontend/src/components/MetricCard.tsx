import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  formula?: string;
  highlight?: 'pink' | 'yellow' | 'emerald' | 'indigo' | 'amber' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  formula,
  highlight = 'slate',
}) => {
  const highlightStyles = {
    pink: 'border-pink-500/40 bg-pink-950/20 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]',
    yellow: 'border-yellow-500/40 bg-yellow-950/20 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.1)]',
    indigo: 'border-pink-500/40 bg-pink-950/20 text-pink-400',
    amber: 'border-yellow-500/40 bg-yellow-950/20 text-yellow-300',
    emerald: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400',
    slate: 'border-slate-800 bg-slate-900/60 text-slate-200',
  };

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all flex flex-col justify-between ${highlightStyles[highlight]}`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
          {formula && (
            <span className="text-[10px] font-mono text-yellow-400/80 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              {formula}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
          {unit && <span className="text-xs font-semibold text-yellow-400">{unit}</span>}
        </div>
      </div>
      {subtext && (
        <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2">
          {subtext}
        </div>
      )}
    </div>
  );
};
