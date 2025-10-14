export default function Card({ className = "", as = "div", onClick, children }) {
  const Comp = as;
  return (
    <Comp onClick={onClick} className={["rounded-[22px]", className].join(" ")}>
      {children}
    </Comp>
  );
}
