import rewards from "../data/rewards.json";
import RewardCard from "../components/RewardCard";
import { useCoins } from "../context/CoinsContext";
import { useMemo, useState } from "react";

const TABS = [
  { key: "all", label: "Все" },
  { key: "cardTheme", label: "Карта" },
  { key: "penguinWear", label: "Пингвин" },
  { key: "coupon", label: "Купоны" },
];

export default function Shop() {
  const { balance } = useCoins();
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => (tab === "all" ? rewards : rewards.filter((r) => r.type === tab)), [tab]);

  return (
    <div className="screen-shell mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] pb-24 text-white">
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#0b0b12] px-5 pb-4 shadow-md shadow-black/30">
        <button type="button" onClick={() => (window.location.hash = "#/learn")} className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Назад</button>
        <div className="text-base font-semibold">Магазин наград</div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
          <span aria-hidden="true">💰</span>
          <span className="tabular-nums">{balance}</span>
        </div>
      </header>

      <div className="px-5 pt-32">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`whitespace-nowrap rounded-[12px] px-3 py-1.5 text-sm ${t.key === tab ? "bg-[#5d2efc]" : "bg-white/10 hover:bg-white/20"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="grid grid-cols-1 gap-4 p-5">
        {filtered.map((r) => (
          <RewardCard key={r.id} reward={r} />
        ))}
      </main>
    </div>
  );
}
