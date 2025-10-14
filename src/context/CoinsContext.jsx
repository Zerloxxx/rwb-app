import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const LS_KEYS = {
  balance: "rwb_coins_balance",
  quizProgress: "rwb_quiz_progress",
  owned: "rwb_rewards_owned",
  active: "rwb_rewards_active",
};

const defaultActive = { cardTheme: "card_wb_purple", appTheme: null, penguinWear: "penguin_default" };

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

const CoinsContext = createContext(null);

export function CoinsProvider({ children }) {
  const [balance, setBalance] = useState(() => Number(readJSON(LS_KEYS.balance, 0)) || 0);
  const [quizProgress, setQuizProgress] = useState(() => readJSON(LS_KEYS.quizProgress, { streak: 0 }));
  const [ownedRewards, setOwnedRewards] = useState(() => readJSON(LS_KEYS.owned, []));
  const [active, setActive] = useState(() => ({ ...defaultActive, ...readJSON(LS_KEYS.active, {}) }));

  useEffect(() => writeJSON(LS_KEYS.balance, balance), [balance]);
  useEffect(() => writeJSON(LS_KEYS.quizProgress, quizProgress), [quizProgress]);
  useEffect(() => writeJSON(LS_KEYS.owned, ownedRewards), [ownedRewards]);
  useEffect(() => writeJSON(LS_KEYS.active, active), [active]);

  const addCoins = useCallback((amount) => setBalance((b) => Math.max(0, b + Math.max(0, Math.floor(amount || 0)))), []);
  const canAfford = useCallback((amount) => balance >= (amount || 0), [balance]);
  const spendCoins = useCallback((amount) => {
    if (amount <= 0) return true;
    if (balance < amount) return false;
    setBalance((b) => b - amount);
    return true;
  }, [balance]);

  const isOwned = useCallback((id) => {
    // базовые бесплатные
    if (id === "card_wb_purple" || id === "card_russ_blue" || id === "penguin_default") return true;
    return ownedRewards.includes(id);
  }, [ownedRewards]);
  const buyReward = useCallback((id, price) => {
    if (isOwned(id)) return true;
    if (!canAfford(price)) return false;
    const ok = spendCoins(price);
    if (!ok) return false;
    setOwnedRewards((list) => Array.from(new Set([...list, id])));
    return true;
  }, [ownedRewards, canAfford, spendCoins, isOwned]);

  const activateReward = useCallback((reward) => {
    if (!reward) return;
    const { type, id } = reward;
    // Разрешаем базовую тему без покупки
    if (type === "cardTheme" && (id === "card_wb_purple" || id === "card_russ_blue")) {
      setActive((prev) => ({ ...prev, [type]: id }));
      return true;
    }
    if (type === "penguinWear" && id === "penguin_default") {
      setActive((prev) => ({ ...prev, [type]: id }));
      return true;
    }
    if (!ownedRewards.includes(id)) return false;
    setActive((prev) => ({ ...prev, [type]: id }));
    return true;
  }, [ownedRewards]);

  const updateQuizResult = useCallback((slug, correct, total) => {
    setQuizProgress((prev) => {
      const prevBest = prev?.[slug]?.bestCorrect ?? 0;
      const prevPerfectStreak = prev?.streak ?? 0;
      const nextBest = Math.max(prevBest, correct);
      const wasPerfect = prevBest === total;
      const isPerfect = correct === total;
      const nextStreak = isPerfect ? (wasPerfect ? prevPerfectStreak + 1 : (prevPerfectStreak || 0) + 1) : 0;
      return { ...prev, [slug]: { bestCorrect: nextBest, total }, streak: nextStreak };
    });
  }, []);

  const setAppTheme = useCallback((themeId) => setActive((prev) => ({ ...prev, appTheme: themeId })), []);

  const value = useMemo(() => ({
    // coins
    balance, addCoins, spendCoins, canAfford,
    // rewards
    ownedRewards, buyReward, isOwned, activateReward, active, setAppTheme,
    // quizzes
    quizProgress, updateQuizResult,
    // keys
    LS_KEYS,
  }), [balance, addCoins, spendCoins, canAfford, ownedRewards, buyReward, isOwned, activateReward, active, setAppTheme, quizProgress, updateQuizResult]);

  return <CoinsContext.Provider value={value}>{children}</CoinsContext.Provider>;
}

export function useCoins() {
  const ctx = useContext(CoinsContext);
  if (!ctx) throw new Error("useCoins must be used within CoinsProvider");
  return ctx;
}





