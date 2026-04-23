'use client';

interface Props {
  value: number;
  label?: string;
  color?: string;
  className?: string;
}

export default function ProgressBar({ value, label, color = '#00E0FF', className = '' }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
