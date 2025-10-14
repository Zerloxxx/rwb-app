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

// Debounce механизм для предотвращения частых сохранений
let saveTimeout = null;
let pendingState = null;

const debouncedSave = (state) => {
  pendingState = state;
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(async () => {
    if (pendingState) {
      await savePiggyStateImmediate(pendingState);
      pendingState = null;
    }
  }, 300); // 300ms задержка
};

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

// Retry механизм для localStorage операций
const retryOperation = async (operation, maxRetries = 3, delay = 50) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return operation();
    } catch (error) {
      console.warn(`⚠️ Попытка ${i + 1} не удалась:`, error.message);
      if (i === maxRetries - 1) {
        throw error;
      }
      // Экспоненциальная задержка
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Проверка доступности localStorage
const isLocalStorageHealthy = () => {
  try {
    const test = '__localStorage_health_check__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Немедленное сохранение (для критических операций)
export const savePiggyStateImmediate = async (state) => {
  if (!ensureWindow()) {
    console.warn('localStorage недоступен');
    return false;
  }

  if (!isLocalStorageHealthy()) {
    console.error('localStorage не работает корректно');
    return false;
  }

  try {
    const normalized = normalizeState(state);
    const payload = JSON.stringify({ ...normalized, version: 4 });
    
    // Попытка сохранить с retry
    await retryOperation(() => {
      window.localStorage.setItem(STORAGE_KEYS.current, payload);
    });
    
    window.dispatchEvent(new CustomEvent(PIGGY_UPDATED_EVENT, { detail: normalized }));
    console.log('✅ Состояние сохранено немедленно');
    return true;
  } catch (error) {
    console.error('❌ Ошибка немедленного сохранения:', error);
    
    // Последняя попытка - очистка localStorage
    try {
      console.log('🔄 Попытка очистки localStorage...');
      window.localStorage.clear();
      
      const normalized = normalizeState(state);
      const payload = JSON.stringify({ ...normalized, version: 4 });
      window.localStorage.setItem(STORAGE_KEYS.current, payload);
      
      window.dispatchEvent(new CustomEvent(PIGGY_UPDATED_EVENT, { detail: normalized }));
      console.log('✅ Состояние сохранено после очистки localStorage');
      return true;
    } catch (retryError) {
      console.error('❌ Критическая ошибка localStorage:', retryError);
      return false;
    }
  }
};

// Debounced сохранение (для обычных операций)
export const savePiggyState = (state) => {
  debouncedSave(state);
  return true; // Всегда возвращаем true для debounced операций
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
export const transferParentToChild = async (amount) => {
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
  const success = await savePiggyStateImmediate(next);
  return success;
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

// Fallback механизм для восстановления состояния
export const recoverPiggyState = () => {
  if (!ensureWindow()) {
    console.warn('localStorage недоступен для восстановления');
    return { ...DEFAULT_STATE };
  }

  try {
    // Пытаемся загрузить из всех возможных ключей
    const keys = [STORAGE_KEYS.current, ...STORAGE_KEYS.legacy];
    
    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const state = normalizeState(parsed);
          console.log(`✅ Восстановлено состояние из ключа: ${key}`);
          return state;
        }
      } catch (error) {
        console.warn(`⚠️ Не удалось восстановить из ключа ${key}:`, error);
        continue;
      }
    }
    
    console.log('🔄 Создано новое состояние по умолчанию');
    return { ...DEFAULT_STATE };
  } catch (error) {
    console.error('❌ Критическая ошибка восстановления:', error);
    return { ...DEFAULT_STATE };
  }
};

// Проверка целостности состояния
export const validatePiggyState = (state) => {
  if (!state || typeof state !== 'object') {
    return false;
  }
  
  if (!Array.isArray(state.piggies)) {
    return false;
  }
  
  if (typeof state.cardBalance !== 'number' || state.cardBalance < 0) {
    return false;
  }
  
  if (typeof state.parentCardBalance !== 'number' || state.parentCardBalance < 0) {
    return false;
  }
  
  return true;
};

// Безопасное сохранение с валидацией
export const safeSavePiggyState = async (state) => {
  if (!validatePiggyState(state)) {
    console.error('❌ Некорректное состояние для сохранения');
    return false;
  }
  
  return await savePiggyStateImmediate(state);
};

export const STORAGE_KEY_CURRENT = STORAGE_KEYS.current;
