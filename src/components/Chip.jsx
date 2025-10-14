export default function Chip({ className = "" }) {
  return (
    <div className={["w-6 h-6 rounded-full border-2 border-[#0b0b12]", className].join(" ")} />
  );
}
