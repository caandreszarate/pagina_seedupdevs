interface ProgressBarProps {
  actual: number;
  total: number;
  progreso: number;
}

export default function ProgressBar({ actual, total, progreso }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Pregunta {actual} de {total}
        </span>
        <span className="text-xs font-mono text-[#00E0FF]">{Math.round(progreso)}%</span>
      </div>
      <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progreso}%`,
            background: 'linear-gradient(90deg, #1E90FF, #00E0FF)',
            boxShadow: '0 0 8px #00E0FF88',
          }}
        />
      </div>
    </div>
  );
}
