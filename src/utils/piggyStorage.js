const STORAGE_KEYS = {
  current: "wbkids.piggies.v4",
  legacy: ["wbkids.piggies.v3", "wbkids.piggies.v2", "wbkids.piggies.v1"],
};

export const PIGGY_UPDATED_EVENT = "wbkids:piggies:updated";

const DEFAULT_STATE = {
  version: 4,
  piggies: [],
  cardBalance: 5000, // Баланс ребенка
  parentCardBalance: 100000, // Баланс родителя (как было захардкожено в UI)
};

const ensureWindow = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const makeId = () => "piggy_" + Math.random().toString(36).slice(2, 10);

const clampNumber = (value) => {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return 0;
  }
  return Math.max(0, Math.round(num));
};


const toDateKey = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const normalizeAutoTopUp = (raw = null) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const amount = clampNumber(raw.amount);
  if (amount <= 0) {
    return null;
  }
  const lastApplied = toDateKey(raw.lastApplied);
  return {
    amount,
    lastApplied,
  };
};

const normalizePiggy = (raw = {}) => {
  const owner = raw.owner === "family" ? "family" : "child";
  const name = (raw.name || "Моя цель").toString().slice(0, 60);
  const goal = clampNumber(raw.goal);
  const amount = clampNumber(raw.amount);
  const color = typeof raw.color === "string" && raw.color.trim().length > 0 ? raw.color : "#7c3aed";
  const background = typeof raw.background === "string" && raw.background.trim().length > 0 ? raw.background : "default";
  const createdAt = (() => {
    if (!raw.createdAt) return new Date().toISOString();
    const date = new Date(raw.createdAt);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  })();
  const autoTopUp = normalizeAutoTopUp(raw.autoTopUp);

  return {
    id: raw.id || makeId(),
    name,
    goal,
    amount,
    color,
    background,
    owner,
    createdAt,
    autoTopUp,
  };
};

const normalizeState = (raw) => {
  if (!raw) {
    return { ...DEFAULT_STATE };
  }
  if (Array.isArray(raw)) {
    return { 
      ...DEFAULT_STATE, 
      piggies: raw.map(normalizePiggy),
      cardBalance: clampNumber(raw.cardBalance ?? DEFAULT_STATE.cardBalance),
      parentCardBalance: clampNumber(raw.parentCardBalance ?? DEFAULT_STATE.parentCardBalance),
    };
  }
  const list = Array.isArray(raw.piggies) ? raw.piggies.map(normalizePiggy) : [];
  return {
    version: 4,
    piggies: list,
    cardBalance: clampNumber(raw.cardBalance ?? DEFAULT_STATE.cardBalance),
    parentCardBalance: clampNumber(raw.parentCardBalance ?? DEFAULT_STATE.parentCardBalance),
  };
};

export const loadPiggyState = () => {
  if (!ensureWindow()) {
    return { ...DEFAULT_STATE };
  }

  const { localStorage } = window;
  for (const key of [STORAGE_KEYS.current, ...STORAGE_KEYS.legacy]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const state = normalizeState(parsed);
        if (key !== STORAGE_KEYS.current) {
          // lazily migrate to the current key
          savePiggyState(state);
        }
        return state;
      }
    } catch {
      // ignore malformed data, continue searching
    }
  }

  return { ...DEFAULT_STATE };
};

export const savePiggyState = (state) => {
  if (!ensureWindow()) {
    console.warn('localStorage недоступен');
    return;
  }

  try {
    const normalized = normalizeState(state);
    const payload = JSON.stringify({ ...normalized, version: 4 });
    window.localStorage.setItem(STORAGE_KEYS.current, payload);
    window.dispatchEvent(new CustomEvent(PIGGY_UPDATED_EVENT, { detail: normalized }));
    console.log('Состояние сохранено успешно');
  } catch (error) {
    console.error('Ошибка сохранения состояния:', error);
    // Попробуем очистить localStorage и сохранить заново
    try {
      window.localStorage.clear();
      const normalized = normalizeState(state);
      const payload = JSON.stringify({ ...normalized, version: 4 });
      window.localStorage.setItem(STORAGE_KEYS.current, payload);
      console.log('Состояние сохранено после очистки localStorage');
    } catch (retryError) {
      console.error('Критическая ошибка localStorage:', retryError);
    }
  }
};

const sumAmount = (list = []) => list.reduce((sum, piggy) => sum + clampNumber(piggy.amount), 0);

export const getPiggyOverview = (state) => {
  const source = state || loadPiggyState();
  const piggies = Array.isArray(source?.piggies) ? source.piggies : [];
  const child = piggies.filter((piggy) => piggy.owner !== "family");
  const family = piggies.filter((piggy) => piggy.owner === "family");
  const childTotal = sumAmount(child);
  const familyTotal = sumAmount(family);

  return {
    piggies,
    childTotal,
    familyTotal,
    total: childTotal + familyTotal,
    childCount: child.length,
    familyCount: family.length,
    cardBalance: clampNumber(source.cardBalance ?? DEFAULT_STATE.cardBalance),
    parentCardBalance: clampNumber(source.parentCardBalance ?? DEFAULT_STATE.parentCardBalance),
  };
};

// Перевод денег с карты родителя на карту ребёнка (для наград миссий)
export const transferParentToChild = (amount) => {
  if (!ensureWindow()) return false;
  const safeAmount = clampNumber(amount);
  if (safeAmount <= 0) return false;
  const state = loadPiggyState();
  const parent = clampNumber(state.parentCardBalance ?? 0);
  if (parent < safeAmount) return false;
  const next = {
    ...state,
    parentCardBalance: parent - safeAmount,
    cardBalance: clampNumber((state.cardBalance ?? 0) + safeAmount),
  };
  savePiggyState(next);
  return true;
};

export const updatePiggy = (state, id, updater) => {
  const next = { ...state };
  next.piggies = state.piggies.map((piggy) => (piggy.id === id ? { ...updater(piggy) } : piggy));
  return next;
};

export const removePiggyById = (state, id) => ({
  ...state,
  piggies: state.piggies.filter((piggy) => piggy.id !== id),
});

export const appendPiggy = (state, piggy) => ({
  ...state,
  piggies: [...state.piggies, normalizePiggy(piggy)],
});

export const STORAGE_KEY_CURRENT = STORAGE_KEYS.current;
