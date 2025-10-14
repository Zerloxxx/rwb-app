// src/components/LogoBadge.jsx
import logoRWB from "../assets/rwb_clean.png";

export default function LogoBadge({
  src = logoRWB,
  alt = "RWB",
  size = "h-9",      // чуть меньше по умолчанию
  plain = false,     // <-- новый флаг: без подложки
}) {
  if (plain) {
    return <img src={src} alt={alt} className={`${size} w-auto object-contain select-none`} />;
  }

  // старый “бейдж”, если нужен
  return (
    <div
      className={[
        "relative inline-flex items-center justify-center",
        "rounded-xl px-3 py-2",
        "bg-white/10 backdrop-blur-sm",
        "ring-1 ring-white/15",
        "shadow-[0_8px_20px_rgba(0,0,0,0.35)]",
      ].join(" ")}
      style={{ minHeight: "2.5rem" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-xl blur-xl
                      bg-gradient-to-r from-fuchsia-500/25 via-violet-500/20 to-sky-400/25" />
      <img src={src} alt={alt} className={`${size} w-auto object-contain select-none`} />
    </div>
  );
}

