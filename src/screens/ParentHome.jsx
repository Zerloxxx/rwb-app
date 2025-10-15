import logoRWB from "../assets/rwb_clean.png";
import usePiggyOverview from "../hooks/usePiggyOverview";

const IconMenu = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconArrowRight = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const IconCard = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const IconPiggy = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M5 11a7 7 0 0 1 13.3-2.9L21 9l-1 3v3a2 2 0 0 1-2 2h-1" />
    <path d="M5 11v2a4 4 0 0 0 4 4h5" />
    <path d="M8 11h2" />
  </svg>
);

const IconTransfer = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M7 7h10l-3-3m3 3-3 3" />
    <path d="M17 17H7l3 3m-3-3 3-3" />
  </svg>
);

const IconQR = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
    <path d="M14 14h3m3 0v6M17 20h-3v-6h6" />
  </svg>
);

const IconSpends = ({ className = "w-6 h-6" }) => (
  // Иконка купюры/пачки денег
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 8h0M18 16h0" />
  </svg>
);

const IconSparkle = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M5 19l1 .5.5 1L7 19.5 8 19l-1-.5-.5-1-.5 1zM17 19l1 .5.5 1 .5-1 1-.5-1-.5-.5-1-.5 1z" />
  </svg>
);

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString("ru-RU")} руб.`;

export default function ParentHome({ goto, onOpenRoleModal }) {
  const { childTotal, familyTotal, total, childCount, familyCount, cardBalance = 0, parentCardBalance = 0 } = usePiggyOverview();

  return (
    <div className="mx-auto w-[430px] min-h-[100svh] bg-[#0b0b12] pb-28 text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header
        className="relative z-40 flex items-center justify-between bg-[#0b0b12] px-5 pt-4 pb-3 shadow-md shadow-black/30"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0) + 16px)" }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white px-4 py-1 shadow-md">
            <img src={logoRWB} alt="Логотип RWB" className="h-5 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-sm text-white/60">RWB Банк</div>
            <div className="text-base font-semibold">Режим: Родитель</div>
          </div>
        </div>
        {onOpenRoleModal && (
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            aria-label="Сменить профиль"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        )}
      </header>

      <section className="rounded-t-[28px] bg-gradient-to-b from-[#4338ca] via-[#6d28d9] to-[#a855f7] px-5 pb-6 pt-5">
        {/* Карточка баланса родителя с фоном */}
        <div
          className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-lg shadow-black/30"
          style={{ backgroundImage: "url(./penguin-bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", minHeight: 200 }}
        >
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative flex min-h-[200px] flex-col justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/70">Карта родителя</div>
              <div className="mt-3 text-[37px] font-extrabold leading-none tabular-nums">{formatCurrency(parentCardBalance)}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/85">Управляйте лимитами и пополняйте цели</span>
              <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-1.5 font-semibold">Подробнее</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] bg-[#1a1a1f] p-5 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-white/70">Семейные накопления</div>
              <div className="mt-2 text-[30px] font-extrabold leading-none tabular-nums">{formatCurrency(total)}</div>
              <div className="mt-3 text-xs text-white/60">
                Личные цели: {formatCurrency(childTotal)} · Общие цели: {formatCurrency(familyTotal)}
              </div>
              <div className="mt-1 text-xs text-white/60">Баланс карты: {formatCurrency(cardBalance)}</div>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
              Контроль
            </div>
          </div>
          <button
            type="button"
            onClick={() => goto("spends")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15"
          >
            История операций
            <IconArrowRight />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-white">
          <div className="rounded-[22px] bg-white/10 p-4">
            <div className="flex items-center gap-2 text-white/70">
              <IconPiggy className="h-5 w-5" />
              Общие цели
            </div>
            <div className="mt-2 text-[22px] font-bold tabular-nums">{formatCurrency(familyTotal)}</div>
            <div className="mt-1 text-xs text-white/60">Активных: {familyCount}</div>
          </div>
          <div className="rounded-[22px] bg-white/10 p-4">
            <div className="flex items-center gap-2 text-white/70">
              <IconSparkle className="h-5 w-5" />
              Цели ребёнка
            </div>
            <div className="mt-2 text-[22px] font-bold tabular-nums">{formatCurrency(childTotal)}</div>
            <div className="mt-1 text-xs text-white/60">Активных: {childCount}</div>
          </div>
        </div>
      </section>

      <section className="space-y-4 px-5 pt-5">
        <div className="rounded-[22px] bg-[#1a1a1f] p-5">
          <div className="text-[17px] font-semibold">Быстрые действия</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <button
              type="button"
              onClick={() => goto("piggy")}
              className="flex flex-col items-start gap-2 rounded-[18px] bg-white/10 p-4 text-left transition hover:bg-white/15"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <IconPiggy className="h-4 w-4" />
                Копилки
              </div>
              <div className="text-white/90">Посмотреть общие и личные цели</div>
            </button>
            <button
              type="button"
              onClick={() => goto("spends")}
              className="flex flex-col items-start gap-2 rounded-[18px] bg-white/10 p-4 text-left transition hover:bg-white/15"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <IconTransfer className="h-4 w-4" />
                Переводы
              </div>
              <div className="text-white/90">Пополнить карту ребёнка или оплатить покупки</div>
            </button>
            <button
              type="button"
              onClick={() => (window.location.hash = "#/parent/limits")}
              className="flex flex-col items-start gap-2 rounded-[18px] bg-white/10 p-4 text-left transition hover:bg-white/15"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <IconCard className="h-4 w-4" />
                Лимиты
              </div>
              <div className="text-white/90">Управление лимитами и разрешениями</div>
            </button>
            <button
              type="button"
              onClick={() => goto("spends")}
              className="flex flex-col items-start gap-2 rounded-[18px] bg-white/10 p-4 text-left transition hover:bg-white/15"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <IconSpends className="h-4 w-4" />
                Траты ребенка
              </div>
              <div className="text-white/90">Посмотреть историю трат и расходов</div>
            </button>
            <button
              type="button"
              onClick={() => (window.location.hash = "#/parent/missions")}
              className="flex flex-col items-start gap-2 rounded-[18px] bg-white/10 p-4 text-left transition hover:bg-white/15"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <span className="text-lg">🎯</span>
                Миссии ребенка
              </div>
              <div className="text-white/90">Управление заданиями и наградами</div>
            </button>
          </div>
        </div>

        <div className="rounded-[22px] bg-[#1a1a1f] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[16px] font-semibold">Баланс родителя</div>
              <div className="mt-1 text-sm text-white/60">Доступно для пополнения копилок</div>
            </div>
            <div className="text-[22px] font-bold tabular-nums">{formatCurrency(parentCardBalance)}</div>
          </div>
        </div>

        <div className="rounded-[22px] bg-[#1a1a1f] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[16px] font-semibold">Баланс ребенка</div>
              <div className="mt-1 text-sm text-white/60">Карта ребенка</div>
            </div>
            <div className="text-[22px] font-bold tabular-nums">{formatCurrency(cardBalance)}</div>
          </div>
        </div>

        <div className="rounded-[22px] bg-[#1a1a1f] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[16px] font-semibold">Общая копилка</div>
              <div className="mt-1 text-sm text-white/60">Добавьте бонус ребёнку или настройте автопополнение</div>
            </div>
            <div className="text-[22px] font-bold tabular-nums">{formatCurrency(familyTotal)}</div>
          </div>
          <button
            type="button"
            onClick={() => goto("piggy")}
            className="mt-4 w-full rounded-xl bg-white text-black py-3 text-sm font-semibold"
          >
            Управлять копилками
          </button>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50">
        <div
          className="mx-auto w-full max-w-[430px] px-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 16px)" }}
        >
          <div className="grid grid-cols-4 gap-2 rounded-[20px] bg-white p-3 text-black">
            <div className="flex flex-col items-center text-[11px] text-black">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><IconCard className="h-5 w-5" /></div>
              <span>Карта</span>
            </div>
            <button
              type="button"
              onClick={() => goto("piggy")}
              className="flex flex-col items-center text-[11px] text-black/70"
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><IconPiggy className="h-5 w-5" /></div>
              <span>Копилка</span>
            </button>
            <div className="flex flex-col items-center text-[11px] text-black/70">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><IconTransfer className="h-5 w-5" /></div>
              <span>Переводы</span>
            </div>
            <button
              type="button"
              onClick={() => goto("spends")}
              className="flex flex-col items-center text-[11px] text-black/70"
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><IconSpends className="h-5 w-5" /></div>
              <span>Траты ребенка</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
