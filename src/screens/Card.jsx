import { useEffect, useMemo, useState } from "react";
import usePiggyOverview from "../hooks/usePiggyOverview";
import { useCoins } from "../context/CoinsContext";
import { useAutosave } from "../context/AutosaveContext";
import rewards from "../data/rewards.json";
import { CARD_THEMES, getCardThemeStyle } from "../utils/cardThemes";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatRubShort = (value = 0) => `${Number(value || 0).toLocaleString("ru-RU")} ₽`;

const ROUND_STEPS = [10, 20, 50, 100];
const PERCENT_OPTIONS = [5, 10, 15, 20];
const PURCHASE_PREVIEW_AMOUNT = 179;
const TOPUP_PREVIEW_AMOUNT = 1000;

const GOAL_ICON_HINTS = [
  { test: /велосип/iu, icon: "🚲" },
  { test: /подар/iu, icon: "🎁" },
  { test: /будущ/iu, icon: "🌟" },
  { test: /книг/iu, icon: "📚" },
  { test: /игр/iu, icon: "🎮" },
  { test: /путеш/iu, icon: "✈️" },
  { test: /мечт/iu, icon: "💭" },
];

const pickGoalIcon = (name = "") => {
  const trimmed = (name || "").trim();
  for (const hint of GOAL_ICON_HINTS) {
    if (hint && typeof hint.test === "function" && hint.test(trimmed)) {
      return hint.icon;
    }
  }
  if (trimmed) {
    return trimmed.charAt(0);
  }
  return "💡";
};

const BASE_THEMES = ["card_wb_purple", "card_russ_blue"];

export default function Card({ onBack, role = "child" }) {
  const { cardBalance = 0, parentCardBalance = 0, piggies = [] } = usePiggyOverview();
  // Показываем правильный баланс в зависимости от роли
  const currentBalance = role === "parent" ? parentCardBalance : cardBalance;
  const { active, activateReward, isOwned } = useCoins();
  const { autosave, setRoundup, setAutoPercent } = useAutosave();

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [autosaveOpen, setAutosaveOpen] = useState(false);
  const [roundupGoalMenuOpen, setRoundupGoalMenuOpen] = useState(false);
  const [percentGoalMenuOpen, setPercentGoalMenuOpen] = useState(false);

  const currentTheme = active?.cardTheme;
  const shopCardThemeIds = rewards.filter((reward) => reward.type === "cardTheme").map((reward) => reward.id);
  const allCardThemes = useMemo(
    () => Array.from(new Set([...BASE_THEMES, ...shopCardThemeIds])),
    [shopCardThemeIds],
  );
  const canCustomize = true; // Показываем кнопку дизайна для всех

  const availableGoals = useMemo(() => (Array.isArray(piggies) ? piggies : []), [piggies]);

  const autosaveRoundup = autosave?.roundup || {};
  const autosavePercent = autosave?.autoPercent || {};

  const [roundupDraft, setRoundupDraft] = useState(() => ({
    enabled: Boolean(autosaveRoundup.enabled && autosaveRoundup.goalId),
    step: autosaveRoundup.step || 50,
    goalId: autosaveRoundup.goalId || availableGoals[0]?.id || null,
  }));

  const [percentDraft, setPercentDraft] = useState(() => ({
    enabled: Boolean(autosavePercent.enabled && autosavePercent.goalId && autosavePercent.pct > 0),
    pct: autosavePercent.pct || PERCENT_OPTIONS[0],
    goalId: autosavePercent.goalId || availableGoals[0]?.id || null,
  }));

  useEffect(() => {
    if (!autosaveOpen) {
      return;
    }
    setRoundupDraft({
      enabled: Boolean(autosaveRoundup.enabled && autosaveRoundup.goalId),
      step: autosaveRoundup.step || 50,
      goalId: autosaveRoundup.goalId || availableGoals[0]?.id || null,
    });
    setPercentDraft({
      enabled: Boolean(autosavePercent.enabled && autosavePercent.goalId && autosavePercent.pct > 0),
      pct: autosavePercent.pct || PERCENT_OPTIONS[0],
      goalId: autosavePercent.goalId || availableGoals[0]?.id || null,
    });
    setRoundupGoalMenuOpen(false);
    setPercentGoalMenuOpen(false);
  }, [
    autosaveOpen,
    autosaveRoundup.enabled,
    autosaveRoundup.goalId,
    autosaveRoundup.step,
    autosavePercent.enabled,
    autosavePercent.goalId,
    autosavePercent.pct,
    availableGoals,
  ]);

  useEffect(() => {
    if (!availableGoals.length) {
      setRoundupDraft((prev) => ({ ...prev, enabled: false, goalId: null }));
      setPercentDraft((prev) => ({ ...prev, enabled: false, goalId: null }));
      setRoundupGoalMenuOpen(false);
      setPercentGoalMenuOpen(false);
    }
  }, [availableGoals.length]);

  const selectedRoundupGoal = useMemo(
    () => availableGoals.find((goal) => goal.id === roundupDraft.goalId) || null,
    [availableGoals, roundupDraft.goalId],
  );

  const selectedPercentGoal = useMemo(
    () => availableGoals.find((goal) => goal.id === percentDraft.goalId) || null,
    [availableGoals, percentDraft.goalId],
  );

  const roundupPreviewStep = roundupDraft.step || 50;
  const roundupPreviewTarget = Math.ceil(PURCHASE_PREVIEW_AMOUNT / roundupPreviewStep) * roundupPreviewStep;
  const roundupPreviewDelta = roundupPreviewTarget - PURCHASE_PREVIEW_AMOUNT;

  const percentPreviewPct = percentDraft.pct || 0;
  const percentPreviewDelta = Math.floor((TOPUP_PREVIEW_AMOUNT * percentPreviewPct) / 100);

  const activeRoundupGoal = useMemo(
    () => availableGoals.find((goal) => goal.id === autosaveRoundup.goalId) || null,
    [availableGoals, autosaveRoundup.goalId],
  );
  const roundupActive = Boolean(autosaveRoundup.enabled && autosaveRoundup.goalId && autosaveRoundup.step);
  const roundupStatus = roundupActive
    ? `Округление: ${formatRubShort(autosaveRoundup.step)} → ${
        (autosaveRoundup.goalName || activeRoundupGoal?.name) ?? "копилка"
      }`
    : "Округление: выкл";

  const autosavePillClass = roundupActive
    ? "bg-gradient-to-r from-[#6d28d9] via-[#a855f7] to-[#ec4899] shadow-[0_0_16px_rgba(168,85,247,0.35)]"
    : "bg-[#1a1526] hover:bg-[#221c33]";
  const autosaveDotClass = roundupActive ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "bg-white/40";
  const chipClass = roundupActive
    ? "bg-gradient-to-r from-[#6d28d9]/85 via-[#a855f7]/85 to-[#ec4899]/85 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]"
    : "bg-white/15 text-white/80";

  const closeAutosave = () => {
    setAutosaveOpen(false);
    setRoundupGoalMenuOpen(false);
    setPercentGoalMenuOpen(false);
  };

  const toggleRoundupDraft = () => {
    if (!availableGoals.length && !roundupDraft.enabled) {
      return;
    }
    setRoundupDraft((prev) => {
      const nextEnabled = !prev.enabled;
      const fallbackGoal = availableGoals[0]?.id || null;
      const nextGoalId =
        nextEnabled && (!prev.goalId || !availableGoals.some((goal) => goal.id === prev.goalId))
          ? fallbackGoal
          : prev.goalId;
      return { ...prev, enabled: nextEnabled, goalId: nextGoalId };
    });
  };

  const togglePercentDraft = () => {
    if (!availableGoals.length && !percentDraft.enabled) {
      return;
    }
    setPercentDraft((prev) => {
      const nextEnabled = !prev.enabled;
      const fallbackGoal = availableGoals[0]?.id || null;
      const nextGoalId =
        nextEnabled && (!prev.goalId || !availableGoals.some((goal) => goal.id === prev.goalId))
          ? fallbackGoal
          : prev.goalId;
      return { ...prev, enabled: nextEnabled, goalId: nextGoalId };
    });
  };

  const saveSettings = () => {
    const roundupGoalName = selectedRoundupGoal?.name || autosaveRoundup.goalName || "";
    const roundupEnabled = Boolean(roundupDraft.enabled && selectedRoundupGoal);
    setRoundup({
      enabled: roundupEnabled,
      step: roundupDraft.step,
      goalId: roundupEnabled ? selectedRoundupGoal.id : null,
      goalName: roundupEnabled ? roundupGoalName : "",
    });

    const percentGoalName = selectedPercentGoal?.name || autosavePercent.goalName || "";
    const percentEnabled = Boolean(
      percentDraft.enabled && selectedPercentGoal && percentDraft.pct && percentDraft.pct > 0,
    );
    setAutoPercent({
      enabled: percentEnabled,
      pct: percentDraft.pct,
      goalId: percentEnabled ? selectedPercentGoal.id : null,
      goalName: percentEnabled ? percentGoalName : "",
    });

    closeAutosave();
  };

  const canSave =
    (!roundupDraft.enabled || Boolean(selectedRoundupGoal)) &&
    (!percentDraft.enabled || (Boolean(selectedPercentGoal) && percentDraft.pct > 0));

  const themeStyle = getCardThemeStyle(currentTheme) || {};
  const hasCustomBackground = Boolean(themeStyle.backgroundImage || themeStyle.background);
  const effectiveThemeStyle = hasCustomBackground
    ? themeStyle
    : {
        backgroundImage: "url(./penguin-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };

  return (
    <div className="screen-shell mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] text-white">
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#0b0b12] px-5 pb-3 shadow-md shadow-black/30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <div className="text-xl font-bold">Карта</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutosaveOpen(true)}
            className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 ${autosavePillClass}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${autosaveDotClass}`} />
            <span>Автосбережения</span>
          </button>
          {canCustomize ? (
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="rounded-[12px] bg-white/12 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
            >
              Дизайн
            </button>
          ) : null}
        </div>
      </header>

      <section className="space-y-6 px-5 pb-20 pt-32">
        <div
          className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-lg shadow-black/30"
          style={{ ...effectiveThemeStyle, minHeight: 200 }}
        >
          <div className={`absolute inset-0 ${hasCustomBackground ? "bg-black/20" : "bg-black/35"}`} />
          <div className="relative flex min-h-[200px] flex-col justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/70">Баланс карты</div>
              <div className="mt-3 text-[37px] font-extrabold leading-none tabular-nums">
                {formatCurrency(currentBalance)}
              </div>
              <div className="mt-4 text-sm text-white/80">Пополняй карту и настраивай автосбережения</div>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 text-xs text-white/80">
              <span>**** 2486 • Последнее пополнение: сегодня</span>
              <div className="flex flex-col items-end gap-2 text-right">
                <div className={`rounded-2xl px-3 py-1.5 text-[11px] font-semibold leading-tight ${chipClass}`}>
                  {roundupStatus}
                </div>
                <div className="rounded-2xl bg-white/20 px-3 py-2 text-xs font-semibold text-white">Kids</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex h-[108px] flex-col items-center justify-center gap-2 rounded-[22px] bg-[#1a1a1f] text-center text-[15px] text-white shadow-lg shadow-black/20 transition hover:bg-[#22222c]"
          >
            <span className="text-[22px] leading-none">₽</span>
            <span className="font-semibold leading-tight">Пополнить карту</span>
          </button>
          <button
            type="button"
            className="flex h-[108px] flex-col items-center justify-center gap-2 rounded-[22px] bg-[#1a1a1f] text-center text-[15px] text-white shadow-lg shadow-black/20 transition hover:bg-[#22222c]"
          >
            <span className="text-[22px] leading-none">⇄</span>
            <span className="font-semibold leading-tight text-balance">Перевести в копилку</span>
          </button>
        </div>

        {selectorOpen && canCustomize && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#1a1a1f] p-4 text-white shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-base font-semibold">Выбери оформление карты</div>
                <button
                  type="button"
                  onClick={() => setSelectorOpen(false)}
                  className="rounded-[10px] bg-white/10 px-2 py-1 text-xs text-white/80 transition hover:bg-white/15"
                >
                  Закрыть
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {allCardThemes.map((id) => {
                  const owned = BASE_THEMES.includes(id) || isOwned(id);
                  const isActive = currentTheme === id;
                  const style = getCardThemeStyle(id) || {};
                  return (
                    <div
                      key={id}
                      className={`relative overflow-hidden rounded-[16px] p-3 text-left text-xs shadow-md transition ${
                        isActive ? "ring-2 ring-[#5d2efc]" : "ring-0"
                      }`}
                      style={{ ...style, minHeight: 90 }}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative font-semibold">{CARD_THEMES[id]?.label || id}</div>
                      {owned ? (
                        <button
                          type="button"
                          onClick={() => {
                            activateReward({ id, type: "cardTheme" });
                            setSelectorOpen(false);
                          }}
                          className="relative mt-1 rounded-[10px] bg-white/15 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-white/25"
                        >
                          {isActive ? "Активна" : "Применить"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            window.location.hash = "#/shop";
                          }}
                          className="relative mt-1 rounded-[10px] bg-[#5d2efc] px-2 py-1 text-[10px] font-semibold text-white transition hover:brightness-110"
                        >
                          В магазин
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {autosaveOpen && (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/70 backdrop-blur-sm overflow-y-auto">
          <button
            type="button"
            className="flex-1 cursor-pointer"
            aria-label="Закрыть настройки автосбережений"
            onClick={closeAutosave}
          />
          <div className="relative w-full max-h-[80vh] rounded-t-[32px] bg-[#14121d] px-5 pb-6 pt-4 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.6)] overflow-y-auto">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Автосбережения</div>
                <div className="mt-1 text-sm text-white/60">Выбирай правила, чтобы деньги копились сами.</div>
              </div>
              <button
                type="button"
                onClick={closeAutosave}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
                aria-label="Закрыть"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-[#1b1726] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[16px] font-semibold">Округление покупок</div>
                    <div className="mt-1 text-sm text-white/60">
                      Каждая покупка округляется вверх, а разница идёт в выбранную копилку.
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={roundupDraft.enabled}
                    onClick={toggleRoundupDraft}
                    className={`relative inline-flex h-7 w-12 items-center overflow-hidden rounded-full transition ${
                      roundupDraft.enabled
                        ? "bg-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.45)]"
                        : "bg-white/15 hover:bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        roundupDraft.enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">Шаг округления</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ROUND_STEPS.map((value) => {
                      const active = roundupDraft.step === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRoundupDraft((prev) => ({ ...prev, step: value }))}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-gradient-to-r from-[#6d28d9] via-[#a855f7] to-[#ec4899] text-white shadow-[0_0_16px_rgba(168,85,247,0.4)]"
                              : "bg-white/10 text-white/75 hover:bg-white/14"
                          }`}
                        >
                          {formatRubShort(value)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">Копилка</div>
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setRoundupGoalMenuOpen((prev) => !prev)}
                      disabled={availableGoals.length === 0}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                        availableGoals.length === 0
                          ? "cursor-not-allowed bg-white/5 text-white/40"
                          : "bg-white/12 text-white hover:bg-white/16"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">
                          {selectedRoundupGoal ? pickGoalIcon(selectedRoundupGoal.name) : "💡"}
                        </span>
                        <span>
                          {selectedRoundupGoal ? `Копилка: ${selectedRoundupGoal.name}` : "Выбери копилку"}
                        </span>
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`h-4 w-4 transition ${roundupGoalMenuOpen ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {roundupGoalMenuOpen && (
                      <div className="absolute left-0 right-0 top-full z-[130] mt-2 max-h-56 overflow-auto rounded-2xl bg-[#1f1a2b] p-2 shadow-xl ring-1 ring-white/10">
                        {availableGoals.length ? (
                          availableGoals.map((goal) => {
                            const isActive = goal.id === roundupDraft.goalId;
                            return (
                              <button
                                key={goal.id}
                                type="button"
                                onClick={() => {
                                  setRoundupDraft((prev) => ({ ...prev, goalId: goal.id }));
                                  setRoundupGoalMenuOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                                  isActive ? "bg-white/12 text-white" : "text-white/80 hover:bg-white/10"
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="text-lg">{pickGoalIcon(goal.name)}</span>
                                  <span>{goal.name}</span>
                                </span>
                                {isActive && <span className="text-xs text-white/60">Выбрано</span>}
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-xl bg-white/5 px-3 py-4 text-sm text-white/60">
                            Сначала создай копилку, чтобы включить округление.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/75">
                  {roundupDraft.enabled && selectedRoundupGoal
                    ? `Пример: ${formatRubShort(PURCHASE_PREVIEW_AMOUNT)} → округление до ${formatRubShort(
                        roundupPreviewStep,
                      )} = +${formatRubShort(roundupPreviewDelta)} в “${selectedRoundupGoal.name}”`
                    : "Пример: функция округления выключена"}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#1b1726] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[16px] font-semibold">Процент от пополнений</div>
                    <div className="mt-1 text-sm text-white/60">
                      Часть каждого пополнения автоматически уходит в выбранную копилку.
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={percentDraft.enabled}
                    onClick={togglePercentDraft}
                    className={`relative inline-flex h-7 w-12 items-center overflow-hidden rounded-full transition ${
                      percentDraft.enabled
                        ? "bg-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.45)]"
                        : "bg-white/15 hover:bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        percentDraft.enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">Процент перевода</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PERCENT_OPTIONS.map((value) => {
                      const active = percentDraft.pct === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPercentDraft((prev) => ({ ...prev, pct: value }))}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#6366f1] text-white shadow-[0_0_16px_rgba(236,72,153,0.4)]"
                              : "bg-white/10 text-white/75 hover:bg-white/14"
                          }`}
                        >
                          {value}%
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">Копилка</div>
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setPercentGoalMenuOpen((prev) => !prev)}
                      disabled={availableGoals.length === 0}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                        availableGoals.length === 0
                          ? "cursor-not-allowed bg-white/5 text-white/40"
                          : "bg-white/12 text-white hover:bg-white/16"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">
                          {selectedPercentGoal ? pickGoalIcon(selectedPercentGoal.name) : "💡"}
                        </span>
                        <span>
                          {selectedPercentGoal ? `Копилка: ${selectedPercentGoal.name}` : "Выбери копилку"}
                        </span>
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`h-4 w-4 transition ${percentGoalMenuOpen ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {percentGoalMenuOpen && (
                      <div className="absolute left-0 right-0 top-full z-[130] mt-2 max-h-56 overflow-auto rounded-2xl bg-[#1f1a2b] p-2 shadow-xl ring-1 ring-white/10">
                        {availableGoals.length ? (
                          availableGoals.map((goal) => {
                            const isActive = goal.id === percentDraft.goalId;
                            return (
                              <button
                                key={goal.id}
                                type="button"
                                onClick={() => {
                                  setPercentDraft((prev) => ({ ...prev, goalId: goal.id }));
                                  setPercentGoalMenuOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                                  isActive ? "bg-white/12 text-white" : "text-white/80 hover:bg-white/10"
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="text-lg">{pickGoalIcon(goal.name)}</span>
                                  <span>{goal.name}</span>
                                </span>
                                {isActive && <span className="text-xs text-white/60">Выбрано</span>}
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-xl bg-white/5 px-3 py-4 text-sm text-white/60">
                            Сначала создай копилку, чтобы распределять пополнения автоматически.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/75">
                  {percentDraft.enabled && selectedPercentGoal && percentDraft.pct > 0
                    ? `Пример: ${formatRubShort(TOPUP_PREVIEW_AMOUNT)} → ${percentDraft.pct}% = +${formatRubShort(
                        percentPreviewDelta,
                      )} в “${selectedPercentGoal.name}”`
                    : "Пример: функция процента от пополнений выключена"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeAutosave}
                className="flex-1 rounded-[18px] border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={saveSettings}
                disabled={!canSave}
                className="flex-1 rounded-[18px] bg-gradient-to-r from-[#6d28d9] via-[#a855f7] to-[#ec4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
