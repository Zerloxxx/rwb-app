const STORAGE_KEY = "wbkids.spends.v1";

export const SPENDS_UPDATED_EVENT = "wbkids:spends:updated";

const ensureWindow = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const KNOWN_CATEGORIES = new Set(["food", "fun", "learning", "transport", "gifts", "other"]);
const DEFAULT_CATEGORY = "other";

const makeId = () => "tx_" + Math.random().toString(36).slice(2, 10);

const pad2 = (value) => String(value).padStart(2, "0");
const makeMonthKey = (date) => date.getFullYear() + "-" + pad2(date.getMonth() + 1);

const toISO = (value) => {
  if (!value) {
    return new Date().toISOString();
  }
  if (value instanceof Date) {
    const date = value;
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const clampAmount = (amount) => {
  const num = Math.round(Number(amount) || 0);
  return Math.max(0, num);
};

const normalizeTransaction = (raw = {}) => {
  const isoDate = toISO(raw.date || raw.createdAt);
  const date = new Date(isoDate);
  const createdAtISO = raw.createdAt ? toISO(raw.createdAt) : isoDate;
  const category = KNOWN_CATEGORIES.has(raw.category) ? raw.category : DEFAULT_CATEGORY;
  const amount = clampAmount(raw.amount);
  return {
    id: raw.id || makeId(),
    category,
    amount,
    note: (raw.note || "").toString().slice(0, 120),
    date: isoDate,
    createdAt: createdAtISO,
    monthKey: raw.monthKey || makeMonthKey(date),
  };
};

export const loadStoredTransactions = () => {
  if (!ensureWindow()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTransaction);
  } catch {
    return [];
  }
};

export const saveStoredTransactions = (list) => {
  if (!ensureWindow()) {
    return;
  }
  try {
    const normalized = Array.isArray(list) ? list.map(normalizeTransaction) : [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(SPENDS_UPDATED_EVENT, { detail: normalized }));
  } catch {
    // ignore write errors
  }
};

export const appendStoredTransaction = (transaction) => {
  const current = loadStoredTransactions();
  const normalized = normalizeTransaction(transaction);
  const next = [normalized, ...current];
  saveStoredTransactions(next);
  return normalized;
};

export const getSpendsStorageKey = () => STORAGE_KEY;
