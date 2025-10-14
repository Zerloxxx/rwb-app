export default function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="w-full rounded-full bg-white/10" style={{ height: 10 }}>
      <div
        className="h-full rounded-full bg-[#5d2efc] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}




