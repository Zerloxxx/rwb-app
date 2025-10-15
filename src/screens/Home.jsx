import CTA from "../components/CTA";
import { useCoins } from "../context/CoinsContext";
import logoRWB from "../assets/rwb_clean.png";
import usePiggyOverview from "../hooks/usePiggyOverview";
import { getCardThemeStyle } from "../utils/cardThemes";

const IconQR = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
    <path d="M14 14h3m3 0v6M17 20h-3v-6h6" />
  </svg>
);

const IconTransfer = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3" />
  </svg>
);

const IconHome = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M3 12l9-8 9 8" />
    <path d="M5 12v8h14v-8" />
  </svg>
);

const IconMenu = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconBank = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M3 10l9-5 9 5" />
    <path d="M4 10h16v8H4z" />
  </svg>
);

const IconCart = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M6 6h15l-1.5 9H7.5L6 6z" />
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
  </svg>
);

const IconUser = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c2-4 14-4 16 0" />
  </svg>
);

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function Home({ goto, role = "child", onOpenRoleModal }) {
  const { childTotal = 0, cardBalance = 0 } = usePiggyOverview();
  const roleLabel = role === "parent" ? "Родитель" : "Ребёнок";
  const { balance, active } = useCoins();
  const homeCardStyle = getCardThemeStyle(active?.cardTheme) || {
    backgroundImage: "url(./penguin-bg.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-[100svh] bg-[#0b0b12] pb-28 text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header
        className="sticky-header flex flex-wrap items-center justify-between gap-3 bg-[#0b0b12] px-5 pb-3 shadow-md shadow-black/30 sm:flex-nowrap"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="rounded-full bg-white px-4 py-1 shadow-md">
            <img src={logoRWB} alt="?>???????'??? RWB" className="h-5 w-auto object-contain" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-xs text-white/60 sm:text-sm">RWB ?'??????</div>
            <div className="truncate text-sm font-semibold sm:text-base">????????: {roleLabel}</div>
          </div>
        </div>

        <div className="order-3 w-full rounded-full bg-white/10 px-3 py-1.5 text-sm text-center sm:order-none sm:w-auto">
          ??'? {balance}
        </div>

        {onOpenRoleModal && (
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="order-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 sm:order-none"
            aria-label="Open role switcher"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        )}
      </header>

      <section className="rounded-t-[28px] bg-gradient-to-b from-[#5d2efc] via-[#6a38f5] to-[#9b4dff] px-5 pb-6">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => goto("card")}
            className="relative overflow-hidden rounded-[24px] p-5 text-left text-white shadow-lg shadow-black/30"
            style={{ ...homeCardStyle, minHeight: 200 }}
            aria-label="Open card details"
          >
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative flex min-h-[200px] flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/70">Карта ребёнка</div>
                <div className="mt-3 text-[37px] font-extrabold leading-none tabular-nums">{formatCurrency(cardBalance)}</div>
                <div className="mt-4 text-sm text-white/80">Нажмите, чтобы открыть управление картой</div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/80">
                <span>**** 2486 - Последнее пополнение: сегодня</span>
                <div className="rounded-2xl bg-white/20 px-3 py-2 text-xs font-semibold text-white">Kids</div>
              </div>
            </div>
          </button>


          <button
            type="button"
            onClick={() => goto("spends")}
            className="flex flex-col items-start gap-3 rounded-[24px] bg-[#1a1a1f] p-5 text-left text-white shadow-lg shadow-black/25 transition hover:ring-2 hover:ring-white/20"
            aria-label="Open spends analytics"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-white/65">Траты за месяц</div>
            <div className="flex w-full flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[28px] font-extrabold tabular-nums">{formatCurrency(0)}</div>
                <div className="mt-1 text-xs text-white/60">Посмотреть отчёт и детали</div>
              </div>
              <span className="inline-flex items-center justify-center rounded-full bg-white/12 px-4 py-1.5 text-xs font-semibold text-white/85">
                Открыть
              </span>
            </div>
          </button>

          {/* Быстрые кнопки (QR/Переводы) перенесены на страницу карты */}

          <CTA className="flex h-[96px] items-center justify-center gap-3 rounded-[24px]">
            <span className="text-[26px]">+</span>
            <span className="text-[15px] font-semibold">Пополнить кошелёк</span>
          </CTA>

          <div className="rounded-[24px] bg-[#1a1a1f] px-6 py-5 text-white shadow-lg shadow-black/25">
            <div className="text-xs uppercase tracking-wide text-white/65">Копилка</div>
            <div className="mt-2 text-[30px] font-extrabold leading-none tabular-nums">{formatCurrency(childTotal)}</div>
            <div className="mt-1 text-xs text-white/60">Личные цели ребёнка</div>
            <button
              type="button"
              onClick={() => goto("piggy")}
              className="mt-4 w-full rounded-[14px] bg-white/12 px-4 py-2 text-[12px] font-semibold transition hover:bg-white/18"
            >
              Перейти в копилки
            </button>
          </div>

          {/* Карточка «Обучение» убрана по требованию */}

        </div>
      </section>

      <section className="space-y-4 px-5 pt-5 text-white">
        <div className="rounded-[24px] bg-[#1a1a1f] p-5 shadow-lg shadow-black/20">
          <div className="text-[18px] font-semibold">Полезные советы</div>
          <div className="mt-2 text-sm text-white/70">
            Придумывайте цели вместе с родителями, чтобы накопить быстрее.
          </div>
        </div>

        <div className="rounded-[24px] bg-[#1a1a1f] p-5 shadow-lg shadow-black/20">
          <div className="text-[18px] font-semibold">Акции и бонусы</div>
          <div className="mt-2 text-sm text-white/70">
            Следите за новыми предложениями Wildberries — мы подскажем, куда выгодно потратить.
          </div>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50">
        <div
          className="mx-auto w-full max-w-[430px] px-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 16px)" }}
        >
          <div className="grid grid-cols-4 gap-2 rounded-[24px] bg-white p-3 text-black shadow-xl shadow-black/20">
            <div className="flex flex-col items-center text-[11px] text-black">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><IconHome className="h-5 w-5" /></div>
              <span>Главная</span>
            </div>
            <button
              type="button"
              onClick={() => goto("piggy")}
              className="flex flex-col items-center text-[11px] text-black/70"
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><IconBank className="h-5 w-5" /></div>
              <span>Копилка</span>
            </button>
            <button
              type="button"
              onClick={() => (window.location.hash = "#/learn")}
              className="flex flex-col items-center text-[11px] text-black/70"
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5">
                {/* Иконка «Обучение» */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M3 9l9-5 9 5-9 5-9-5z" />
                  <path d="M21 14v4" />
                  <path d="M12 14l-7-3.9V14a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3.9L12 14z" />
                </svg>
              </div>
              <span>Обучение</span>
            </button>
            <button
              type="button"
              onClick={() => (window.location.hash = "#/profile")}
              className="flex flex-col items-center text-[11px] text-black/70"
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><IconUser className="h-5 w-5" /></div>
              <span>Профиль</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}





