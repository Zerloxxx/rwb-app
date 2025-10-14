const WB_GRAD   = "linear-gradient(90deg,#ff7adf 0%, #b084ff 100%)";
const RUSS_GRAD = "linear-gradient(90deg,#92e0ff 0%, #62a1ff 100%)";
export default function Bar({ value, tone = "russ" }) {
  const v = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className="w-full h-3 rounded-full bg-[#edf2ff] overflow-hidden">
      <div className="h-3" style={{ width: `${v}%`, background: tone === "russ" ? RUSS_GRAD : WB_GRAD }} />
    </div>
  );
}
