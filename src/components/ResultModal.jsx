export default function ResultModal({ open, correct, total, coins, perfectBonus, streakBonus, onRetry, onShop, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-[#1a1a1f] p-5 text-white shadow-xl">
        <div className="text-xl font-bold">{correct === total ? "Молодец!" : "Давай ещё!"}</div>
        <div className="mt-1 text-sm text-white/80">Ты ответил правильно на {correct} из {total} вопросов.</div>
        <div className="mt-3 rounded-[12px] bg-white/10 p-3 text-sm">
          Начислено: <span className="font-bold">{coins}</span> монет
          {perfectBonus ? <div className="text-green-300">100% правильно! Бонус +20 монет</div> : null}
          {streakBonus ? <div className="text-green-300">Серия из 3 идеальных тестов! Бонус +30 монет</div> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onRetry} className="rounded-[12px] bg-white/15 px-4 py-2 font-semibold hover:bg-white/25">Повторить</button>
          <button type="button" onClick={onShop} className="rounded-[12px] bg-[#5d2efc] px-4 py-2 font-semibold hover:brightness-110">В магазин</button>
          <button type="button" onClick={onClose} className="ml-auto rounded-[12px] bg-white/10 px-3 py-2 text-xs text-white/70">Закрыть</button>
        </div>
      </div>
    </div>
  );
}





