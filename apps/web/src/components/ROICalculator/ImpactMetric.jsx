export function ImpactMetric({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-bold text-white tracking-tight">
        {value}
      </span>
    </div>
  );
}
