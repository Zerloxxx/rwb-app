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
    <div className="mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] pb-24 text-white">
      <header className="sticky-header flex flex-wrap items-center justify-between gap-3 bg-[#0b0b12] px-5 py-4 shadow-md shadow-black/30 sm:flex-nowrap">
        <button type="button" onClick={() => (window.location.hash = "#/learn")} className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Назад</button>
        <div className="min-w-0 text-base font-semibold sm:flex-1 sm:text-center">Магазин наград</div>
        <div className="order-3 w-full rounded-full bg-white/10 px-3 py-1.5 text-sm text-center sm:order-none sm:w-auto">Баланс: {balance}</div>
      </header>

      <div className="px-5 pt-4">
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


