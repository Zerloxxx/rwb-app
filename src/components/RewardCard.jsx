import { useCoins } from "../context/CoinsContext";
import { CARD_THEMES, getCardThemeStyle } from "../utils/cardThemes";
import defaultPenguin from "../assets/penguin.png";

const PENGUIN_PREVIEWS = {
  penguin_default: defaultPenguin,
  penguin_cosmo: "./penguin-cosmo.png",
  penguin_racer: "./penguin-racer.png",
};

export default function RewardCard({ reward, onActivate }) {
  const { balance, buyReward, isOwned, activateReward, active, canAfford } = useCoins();
  const owned = isOwned(reward.id);
  const activeId = active?.[reward.type];
  const isActive = activeId === reward.id;

  const handleBuy = () => {
    if (owned) return;
    const ok = buyReward(reward.id, reward.price);
    if (!ok) return;
    if (reward.type !== "coupon") {
      activateReward(reward);
    }
  };

  const handleActivate = () => {
    if (!owned) return;
    activateReward(reward);
    onActivate?.(reward);
  };

  return (
    <div className="flex flex-col justify-between rounded-[18px] bg-[#1a1a1f] p-4 text-white shadow-lg shadow-black/25">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-[16px] font-semibold">{reward.name}</div>
          <div className="flex items-center gap-1 text-[10px]">
            {reward.limited ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-white/80">Ограниченная серия</span>
            ) : null}
            {reward.rare ? (
              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-300">Редкость</span>
            ) : null}
          </div>
        </div>

        {reward.type === "cardTheme" && (
          <div className="mt-3 overflow-hidden rounded-[14px]" style={{ minHeight: 64 }}>
            <div className="h-16 w-full" style={{ ...(getCardThemeStyle(reward.id) || {}) }} />
            <div className="mt-1 text-[10px] text-white/70">
              Оформление: {CARD_THEMES[reward.id]?.label || reward.id}
            </div>
          </div>
        )}

        {reward.type === "penguinWear" && (
          <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-white/5 p-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#1c1a24]">
              <img
                src={PENGUIN_PREVIEWS[reward.id] || defaultPenguin}
                alt={reward.name}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="text-xs text-white/70">
              Новый образ для пингвина в копилках.
            </div>
          </div>
        )}

        {reward.meta?.code ? (
          <div className="mt-2 text-xs text-white/60">
            Код: {reward.meta.code} (действует {reward.meta.expiresInDays} дн.)
          </div>
        ) : null}

        <div className="mt-2 text-sm text-white/70">Стоимость: {reward.price} монет</div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!owned ? (
          <button
            type="button"
            disabled={!canAfford(reward.price)}
            onClick={handleBuy}
            className={`flex-1 rounded-[12px] px-3 py-2 font-semibold ${
              canAfford(reward.price) ? "bg-[#5d2efc] hover:brightness-110" : "bg-white/5 text-white/30"
            }`}
          >
            Купить
          </button>
        ) : (
          <button
            type="button"
            disabled={isActive}
            onClick={handleActivate}
            className={`flex-1 rounded-[12px] px-3 py-2 font-semibold ${
              isActive ? "bg-green-600/30 text-green-200" : "bg-white/15 hover:bg-white/25"
            }`}
          >
            {isActive ? "Активно" : "Применить"}
          </button>
        )}
      </div>

      <div className="mt-2 text-right text-xs text-white/50">Монет на счету: {balance}</div>
    </div>
  );
}
