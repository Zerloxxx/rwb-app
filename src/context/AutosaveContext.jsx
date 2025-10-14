import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadPiggyState, savePiggyState, PIGGY_UPDATED_EVENT } from "../utils/piggyStorage";
import { appendStoredTransaction } from "../utils/spendsStorage";

const STORAGE_KEY = "wbkids.autosave.v1";

const DEFAULT_STATE = {
  roundup: {
    enabled: false,
    step: 0,
    goalId: null,
    goalName: "",
  },
  autoPercent: {
    enabled: false,
    pct: 0,
    goalId: null,
    goalName: "",
  },
  autodebit: {
    enabled: false,
    amount: 0,
    schedule: null,
  },
};

const readState = () => {
  if (typeof window === "undefined") {
    return { ...DEFAULT_STATE };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      roundup: { ...DEFAULT_STATE.roundup, ...(parsed?.roundup || {}) },
      autoPercent: { ...DEFAULT_STATE.autoPercent, ...(parsed?.autoPercent || {}) },
      autodebit: { ...DEFAULT_STATE.autodebit, ...(parsed?.autodebit || {}) },
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
};

const writeState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
};

const clampStep = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return 0;
  }
  const rounded = Math.max(0, Math.round(num));
  if (rounded === 0) return 0;
  if (rounded <= 10) return 10;
  if (rounded <= 20) return 20;
  if (rounded <= 50) return 50;
  if (rounded <= 100) return 100;
  return rounded;
};

const clampPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(num)));
};

const AutosaveContext = createContext(null);

export function AutosaveProvider({ children }) {
  const [state, setState] = useState(() => readState());
  const internalUpdateRef = useRef(false);
  const lastCardBalanceRef = useRef(null);
  const percentSettings = state.autoPercent || DEFAULT_STATE.autoPercent;
  const percentEnabled = Boolean(percentSettings.enabled);
  const percentGoalId = percentSettings.goalId;
  const percentGoalName = percentSettings.goalName;
  const percentPct = clampPercent(percentSettings.pct);

  useEffect(() => {
    const snapshot = loadPiggyState();
    lastCardBalanceRef.current = Math.max(0, Number(snapshot?.cardBalance) || 0);
  }, []);

  useEffect(() => {
    writeState(state);
  }, [state]);

  const setRoundup = useCallback((next) => {
    setState((prev) => ({
      ...prev,
      roundup: {
        ...prev.roundup,
        ...next,
        step: clampStep(next?.step ?? prev.roundup.step),
      },
    }));
  }, []);

  const toggleRoundup = useCallback((enabled) => {
    setState((prev) => ({
      ...prev,
      roundup: {
        ...prev.roundup,
        enabled,
      },
    }));
  }, []);

  const setAutoPercent = useCallback((next) => {
    setState((prev) => ({
      ...prev,
      autoPercent: {
        ...prev.autoPercent,
        ...next,
        pct: clampPercent(next?.pct ?? prev.autoPercent.pct),
      },
    }));
  }, []);

  const toggleAutoPercent = useCallback((enabled) => {
    setState((prev) => ({
      ...prev,
      autoPercent: {
        ...prev.autoPercent,
        enabled,
      },
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const handlePiggyUpdate = (event) => {
      const snapshot = event?.detail || loadPiggyState();
      const nextBalance = Math.max(0, Number(snapshot?.cardBalance) || 0);
      const previousBalance = lastCardBalanceRef.current ?? nextBalance;
      lastCardBalanceRef.current = nextBalance;

      if (internalUpdateRef.current) {
        internalUpdateRef.current = false;
        return;
      }

      if (!percentEnabled || !percentGoalId || percentPct <= 0) {
        return;
      }

      const increase = nextBalance - previousBalance;
      if (!(increase > 0)) {
        return;
      }

      const transfer = Math.floor((increase * percentPct) / 100);
      if (!(transfer > 0)) {
        return;
      }

      const target = snapshot?.piggies?.find((piggy) => piggy.id === percentGoalId);
      if (!target) {
        return;
      }

      const updatedPiggies = snapshot.piggies.map((piggy) =>
        piggy.id === percentGoalId ? { ...piggy, amount: Math.max(0, Number(piggy.amount) || 0) + transfer } : piggy,
      );
      const updatedState = {
        ...snapshot,
        cardBalance: Math.max(0, nextBalance - transfer),
        piggies: updatedPiggies,
      };

      internalUpdateRef.current = true;
      lastCardBalanceRef.current = updatedState.cardBalance;
      savePiggyState(updatedState);

      appendStoredTransaction({
        amount: transfer,
        category: "other",
        note: `Процент от пополнения → ${percentGoalName || target.name || "копилка"}`,
        date: new Date().toISOString(),
      });
    };

    window.addEventListener(PIGGY_UPDATED_EVENT, handlePiggyUpdate);
    return () => window.removeEventListener(PIGGY_UPDATED_EVENT, handlePiggyUpdate);
  }, [
    percentEnabled,
    percentGoalId,
    percentGoalName,
    percentPct,
  ]);

  const applyRoundupToTransaction = useCallback(
    (transaction) => {
      const { roundup } = state;
      if (!roundup?.enabled) {
        return null;
      }
      const step = clampStep(roundup.step);
      if (!step) {
        return null;
      }
      const amount = Number(transaction?.amount) || 0;
      if (!(amount > 0)) {
        return null;
      }
      const goalId = roundup.goalId;
      if (!goalId) {
        return null;
      }

      const absolute = Math.abs(amount);
      const delta = Math.ceil(absolute / step) * step - absolute;
      if (!(delta > 0)) {
        return null;
      }

      const piggyState = loadPiggyState();
      const currentCard = Math.max(0, Number(piggyState?.cardBalance) || 0);
      const piggy = piggyState?.piggies?.find((item) => item.id === goalId);
      if (!piggy || !(currentCard > 0)) {
        return null;
      }

      const actualDelta = Math.min(delta, currentCard);
      if (!(actualDelta > 0)) {
        return null;
      }

      const nextPiggies = piggyState.piggies.map((item) =>
        item.id === piggy.id
          ? { ...item, amount: Math.max(0, Number(item.amount) || 0) + actualDelta }
          : item,
      );
      const nextCardBalance = Math.max(0, currentCard - actualDelta);
      const nextState = {
        ...piggyState,
        cardBalance: nextCardBalance,
        piggies: nextPiggies,
      };

      internalUpdateRef.current = true;
      lastCardBalanceRef.current = nextCardBalance;
      savePiggyState(nextState);

      const timestamp = new Date().toISOString();
      const goalName = roundup.goalName || piggy.name || "";

      return {
        delta: actualDelta,
        goal: { id: piggy.id, name: goalName || piggy.name || "" },
        roundupTransaction: {
          id: `tx_roundup_${transaction?.id || Math.random().toString(36).slice(2, 10)}`,
          amount: actualDelta,
          category: "other",
          note: `Округление → ${goalName || piggy.name || "копилка"}`,
          date: transaction?.date || timestamp,
          createdAt: timestamp,
        },
      };
    },
    [state, internalUpdateRef, lastCardBalanceRef],
  );

  const value = useMemo(
    () => ({
      autosave: state,
      setRoundup,
      toggleRoundup,
      setAutoPercent,
      toggleAutoPercent,
      applyRoundupToTransaction,
    }),
    [state, setRoundup, toggleRoundup, setAutoPercent, toggleAutoPercent, applyRoundupToTransaction],
  );

  return <AutosaveContext.Provider value={value}>{children}</AutosaveContext.Provider>;
}

export function useAutosave() {
  const ctx = useContext(AutosaveContext);
  if (!ctx) {
    throw new Error("useAutosave must be used within AutosaveProvider");
  }
  return ctx;
}
