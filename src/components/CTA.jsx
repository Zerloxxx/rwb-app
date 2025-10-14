export default function CTA({ className = "", children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full rounded-[22px] bg-white text-black font-semibold px-6 py-4",
        "shadow-[0_10px_30px_rgba(0,0,0,0.35)] active:scale-[0.98] transition",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
