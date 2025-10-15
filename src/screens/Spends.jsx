import { useEffect, useMemo, useState } from "react";
import { useAutosave } from "../context/AutosaveContext";
import { SPENDS_UPDATED_EVENT, loadStoredTransactions, saveStoredTransactions, getSpendsStorageKey } from "../utils/spendsStorage";

const fmtRub = (value = 0) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value || 0);

const STORAGE_KEY = "wbkids.spends.v1";

const CATEGORIES = [
  { id: "food", label: "Еда и перекусы", shortLabel: "Еда", color: "#f97316", icon: "🍎" },
  { id: "fun", label: "Развлечения", shortLabel: "Развлечения", color: "#ec4899", icon: "🎮" },
  { id: "learning", label: "Учёба и кружки", shortLabel: "Учёба", color: "#6366f1", icon: "📚" },
  { id: "transport", label: "Транспорт", shortLabel: "Транспорт", color: "#14b8a6", icon: "🚌" },
  { id: "gifts", label: "Подарки", shortLabel: "Подарки", color: "#fca5a5", icon: "🎁" },
  { id: "other", label: "Другое", shortLabel: "Другое", color: "#facc15", icon: "💡" },
];

const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

const pad2 = (value) => String(value).padStart(2, "0");
const makeMonthKey = (date) => date.getFullYear() + "-" + pad2(date.getMonth() + 1);
const makeDayKey = (date) =>
  date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
const getDayKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : makeDayKey(date);
};
const makeId = () => "tx_" + Math.random().toString(36).slice(2, 10);
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
const normalizeTransaction = (raw) => {
  const isoDate = toISO(raw?.date || raw?.createdAt);
  const date = new Date(isoDate);
  const createdAtISO = raw?.createdAt ? toISO(raw.createdAt) : isoDate;
  const categoryId = CATEGORY_MAP[raw?.category] ? raw.category : CATEGORIES[0].id;
  const amount = Math.max(0, Math.round(Number(raw?.amount) || 0));
  return {
    id: raw?.id || makeId(),
    category: categoryId,
    amount,
    note: (raw?.note || "").toString().slice(0, 120),
    date: isoDate,
    createdAt: createdAtISO,
    monthKey: raw?.monthKey || makeMonthKey(date),
  };
};

const DEMO_TRANSACTIONS = [
  { category: "food", amount: 320, note: "Школьный обед", date: "2025-10-01T09:30:00.000Z" },
  { category: "transport", amount: 180, note: "Проезд на автобусе", date: "2025-10-02T07:45:00.000Z" },
  { category: "learning", amount: 900, note: "Кружок робототехники", date: "2025-10-03T14:20:00.000Z" },
  { category: "fun", amount: 450, note: "Билет в кино", date: "2025-10-05T16:10:00.000Z" },
  { category: "food", amount: 260, note: "Перекус после школы", date: "2025-10-07T13:05:00.000Z" },
  { category: "other", amount: 150, note: "Блокнот и наклейки", date: "2025-10-09T12:00:00.000Z" },
  { category: "gifts", amount: 650, note: "Подарок другу", date: "2025-10-12T10:20:00.000Z" },
  { category: "fun", amount: 300, note: "Игровой пропуск", date: "2025-10-15T18:30:00.000Z" },
  { category: "food", amount: 410, note: "Ужин в кафе", date: "2025-10-18T17:45:00.000Z" },
].map(normalizeTransaction);

const loadTransactions = () => {
  const stored = loadStoredTransactions();
  return stored.length ? stored : DEMO_TRANSACTIONS;
};

const saveTransactions = (list) => {
  saveStoredTransactions(list);
};

const capitalize = (value = "") => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});
const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});
const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});
const dayFullFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
});

const weekdayTemplate = [
  { key: 1, label: "Пн" },
  { key: 2, label: "Вт" },
  { key: 3, label: "Ср" },
  { key: 4, label: "Чт" },
  { key: 5, label: "Пт" },
  { key: 6, label: "Сб" },
  { key: 0, label: "Вс" },
];

const IconBack = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const IconChevronLeft = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const IconChevronRight = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const IconPlus = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function DonutChart({ data, total }) {
  if (!total) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-white/60">
        Нет трат за выбранный период
      </div>
    );
  }

  const size = 180;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const viewBox = "0 0 " + size + " " + size;
  const transformBase = "rotate(-90 " + size / 2 + " " + size / 2 + ")";
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={viewBox} className="h-44 w-44">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        {data.map((slice) => {
          const value = (slice.total / total) * circumference;
          const dashArray = value + " " + (circumference - value);
          const circle = (
            <circle
              key={slice.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              fill="none"
              transform={transformBase}
            />
          );
          offset += value;
          return circle;
        })}
        <text x="50%" y="48%" textAnchor="middle" className="fill-white text-[18px] font-semibold">
          {fmtRub(total)}
        </text>
        <text x="50%" y="62%" textAnchor="middle" className="fill-white/60 text-[12px]">
          за период
        </text>
      </svg>
      <div className="grid w-full gap-2">
        {data.map((slice) => (
          <div key={slice.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {slice.icon}
              </span>
              <span className="text-sm font-medium">{slice.shortLabel}</span>
            </div>
            <div className="text-right text-sm font-semibold text-white/90">
              {fmtRub(slice.total)} · {slice.percent}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekdayChart({ data }) {
  const max = data.reduce((m, item) => Math.max(m, item.total), 0) || 1;
  return (
    <div className="rounded-[22px] bg-[#1a1a1f] p-5">
      <div className="mb-4 text-[17px] font-semibold">В какие дни тратишь больше</div>
      <div className="grid grid-cols-7 gap-3 text-center text-[12px] text-white/70">
        {data.map((item) => {
          const height = (item.total / max) * 100;
          return (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="relative flex h-32 w-full items-end rounded-xl bg-white/5">
                <div
                  className="w-full rounded-xl rounded-b-none bg-gradient-to-t from-fuchsia-600 to-violet-400"
                  style={{ height: height + "%", opacity: item.total ? 1 : 0.25 }}
                />
                <span className="absolute -top-6 w-full text-center text-[11px] font-semibold text-white/80">
                  {item.total ? fmtRub(item.total) : ""}
                </span>
              </div>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBreakdown({ categories, total }) {
  return (
    <div className="rounded-[22px] bg-[#1a1a1f] p-5">
      <div className="mb-4 text-[17px] font-semibold">Категории</div>
      <div className="space-y-3">
        {categories.map((cat) => {
          const share = total ? Math.round((cat.total / total) * 100) : 0;
          return (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden>
                    {cat.icon}
                  </span>
                  <span className="text-[14px] font-medium text-white/90">{cat.label}</span>
                </div>
                <div className="text-[13px] text-white/70">
                  {fmtRub(cat.total)} · {share}%
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: share + "%",
                    background: cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TransactionsList({ items, onRemoveRequest }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white/5 px-4 py-6 text-center text-white/60">
        В этом периоде ещё не было покупок. Нажми «Добавить трату», чтобы записать первую.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((tx) => {
        const category = CATEGORY_MAP[tx.category] || CATEGORIES[0];
        const date = new Date(tx.date);
        return (
          <div key={tx.id} className="flex items-center justify-between rounded-[22px] bg-[#1a1a1f] p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                style={{ background: category.color + "22", color: category.color }}
              >
                <span aria-hidden>{category.icon}</span>
              </div>
              <div>
                <div className="text-[15px] font-semibold text-white">{tx.note || category.label}</div>
                <div className="text-[12px] text-white/60">
                  {category.shortLabel} · {dayFormatter.format(date)} · {timeFormatter.format(date)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[16px] font-extrabold text-white">{fmtRub(tx.amount)}</div>
              <button
                onClick={() => onRemoveRequest(tx)}
                className="mt-1 text-[11px] font-medium text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
              >
                Удалить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-3xl bg-[#14141a] p-6 text-white shadow-xl ring-1 ring-white/10">
        {children}
      </div>
    </div>
  );
}

function AddTransactionModal({ open, onClose, onSubmit }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);

  useEffect(() => {
    if (open) {
      setAmount("");
      setCategory(CATEGORIES[0].id);
      setNote("");
      setDate(today);
    }
  }, [open, today]);

  const submit = () => {
    const numeric = Math.round(Number(amount));
    if (!numeric || numeric <= 0) {
      return;
    }
    onSubmit({
      amount: numeric,
      category,
      note: note.trim(),
      date,
    });
    onClose();
  };

  const quickAdd = (value) => {
    setAmount((prev) => {
      const numericPrev = Number(prev) || 0;
      return String(numericPrev + value);
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-lg font-semibold">Добавить трату</div>
      <label className="mt-4 block text-[12px] uppercase tracking-wide text-white/50">Сумма, ₽</label>
      <input
        className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-3 text-[16px] outline-none focus:ring-2 focus:ring-fuchsia-500/40"
        inputMode="numeric"
        placeholder="Например, 350"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[100, 250, 500, 1000].map((value) => (
          <button
            key={value}
            onClick={() => quickAdd(value)}
            className="rounded-xl bg-white/10 py-2 text-[13px] font-semibold hover:bg-white/15"
            type="button"
          >
            +{value}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-[12px] uppercase tracking-wide text-white/50">Категория</label>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={
              "flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-[14px] font-medium " +
              (category === cat.id ? "bg-white text-black" : "bg-white/8 text-white/80")
            }
            type="button"
          >
            <span aria-hidden className="text-lg">
              {cat.icon}
            </span>
            <span>{cat.shortLabel}</span>
          </button>
        ))}
      </div>

      <label className="mt-4 block text-[12px] uppercase tracking-wide text-white/50">Дата покупки</label>
      <input
        type="date"
        className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-3 text-[14px] outline-none focus:ring-2 focus:ring-fuchsia-500/40"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={today}
      />

      <label className="mt-4 block text-[12px] uppercase tracking-wide text-white/50">Комментарий (необязательно)</label>
      <input
        className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-3 text-[14px] outline-none focus:ring-2 focus:ring-fuchsia-500/40"
        placeholder="Что купили?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="mt-6 flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-white/10 py-3 text-[15px] font-semibold" type="button">
          Отмена
        </button>
        <button onClick={submit} className="flex-1 rounded-2xl bg-white py-3 text-[15px] font-semibold text-black" type="button">
          Готово
        </button>
      </div>
    </Modal>
  );
}

function ConfirmDeleteModal({ open, onClose, onConfirm, transaction }) {
  if (!transaction) return null;
  const category = CATEGORY_MAP[transaction.category] || CATEGORIES[0];
  const date = new Date(transaction.date);
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-lg font-semibold">Удалить трату?</div>
      <div className="mt-3 rounded-2xl bg-white/10 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
            style={{ background: category.color + "22", color: category.color }}
          >
            <span aria-hidden>{category.icon}</span>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-white">{transaction.note || category.label}</div>
            <div className="text-[12px] text-white/60">
              {dayFormatter.format(date)} · {timeFormatter.format(date)} · {fmtRub(transaction.amount)}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-white/10 py-3 text-[15px] font-semibold" type="button">
          Я передумал(а)
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-2xl bg-red-500 py-3 text-[15px] font-semibold text-white hover:bg-red-400"
          type="button"
        >
          Удалить
        </button>
      </div>
    </Modal>
  );
}

function inputDateToUTC(value) {
  if (!value) {
    return new Date();
  }
  const [year, month, day] = value.split("-").map((part) => Number(part) || 0);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export default function Spends({ onBack }) {
  const [transactions, setTransactions] = useState(loadTransactions);
  const { applyRoundupToTransaction } = useAutosave();
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const sync = () => setTransactions(loadTransactions());
    const handleStorage = (event) => {
      const key = event?.key;
      if (!key || key === getSpendsStorageKey()) {
        sync();
      }
    };

    window.addEventListener(SPENDS_UPDATED_EVENT, sync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SPENDS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const [viewMode, setViewMode] = useState("month");
  const [monthShift, setMonthShift] = useState(0);
  const [dayShift, setDayShift] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, tx: null });

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const today = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

  const currentMonthDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthShift, 1),
    [today, monthShift],
  );
  const currentMonthKey = makeMonthKey(currentMonthDate);

  const currentDayDate = useMemo(() => {
    const next = new Date(today);
    next.setDate(today.getDate() + dayShift);
    return next;
  }, [today, dayShift]);
  const currentDayKey = makeDayKey(currentDayDate);

  const isMonthView = viewMode === "month";

  const visibleTransactions = useMemo(() => {
    const sorted = (list) => list.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (isMonthView) {
      return sorted(
        transactions.filter((tx) => tx.monthKey === currentMonthKey),
      );
    }
    return sorted(
      transactions.filter((tx) => getDayKey(tx.date) === currentDayKey),
    );
  }, [transactions, isMonthView, currentMonthKey, currentDayKey]);

  const totalSpent = useMemo(
    () => visibleTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [visibleTransactions],
  );
  const purchaseCount = visibleTransactions.length;
  const averagePerPurchase = purchaseCount ? Math.round(totalSpent / purchaseCount) : 0;

  const uniqueDays = useMemo(() => {
    if (!isMonthView) {
      return purchaseCount ? 1 : 0;
    }
    const set = new Set();
    visibleTransactions.forEach((tx) => {
      const key = getDayKey(tx.date);
      if (key) {
        set.add(key);
      }
    });
    return set.size;
  }, [visibleTransactions, isMonthView, purchaseCount]);

  const averagePerDay = isMonthView && uniqueDays ? Math.round(totalSpent / uniqueDays) : totalSpent;

  const largestPurchase = useMemo(
    () => visibleTransactions.reduce((max, tx) => Math.max(max, tx.amount), 0),
    [visibleTransactions],
  );

  const categoriesStats = useMemo(() => {
    const base = CATEGORIES.map((cat) => ({
      ...cat,
      total: 0,
      count: 0,
    }));
    const lookup = base.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    visibleTransactions.forEach((tx) => {
      const target = lookup[tx.category] || lookup[CATEGORIES[0].id];
      target.total += tx.amount;
      target.count += 1;
    });
    return base.sort((a, b) => b.total - a.total);
  }, [visibleTransactions]);

  const donutData = useMemo(
    () =>
      categoriesStats
        .filter((cat) => cat.total > 0)
        .map((cat) => ({
          id: cat.id,
          total: cat.total,
          percent: totalSpent ? Math.round((cat.total / totalSpent) * 100) : 0,
          icon: cat.icon,
          shortLabel: cat.shortLabel,
          color: cat.color,
        })),
    [categoriesStats, totalSpent],
  );

  const weekdayStats = useMemo(() => {
    const totals = weekdayTemplate.map((tpl) => ({
      ...tpl,
      total: 0,
    }));
    if (!isMonthView) {
      return totals;
    }
    visibleTransactions.forEach((tx) => {
      const date = new Date(tx.date);
      const day = date.getDay();
      const target = totals.find((item) => item.key === day);
      if (target) {
        target.total += tx.amount;
      }
    });
    return totals;
  }, [visibleTransactions, isMonthView]);

  const topCategory = categoriesStats[0];
  const topCategoryShare = totalSpent && topCategory ? Math.round((topCategory.total / totalSpent) * 100) : 0;

  const monthLabel = capitalize(monthFormatter.format(currentMonthDate));
  const dayLabel =
    capitalize(dayFullFormatter.format(currentDayDate)) +
    " · " +
    capitalize(weekdayFormatter.format(currentDayDate));
  const periodLabel = isMonthView ? monthLabel : dayLabel;

  const handlePrev = () => {
    if (isMonthView) {
      setMonthShift((prev) => prev - 1);
    } else {
      setDayShift((prev) => prev - 1);
    }
  };
  const handleNext = () => {
    if (isMonthView) {
      setMonthShift((prev) => Math.min(prev + 1, 0));
    } else {
      setDayShift((prev) => Math.min(prev + 1, 0));
    }
  };
  const isNextDisabled = isMonthView ? monthShift === 0 : dayShift === 0;

  const handleAddTransaction = (payload) => {
    const date = inputDateToUTC(payload.date);
    const tx = normalizeTransaction({
      id: makeId(),
      amount: payload.amount,
      category: payload.category,
      note: payload.note,
      date: date.toISOString(),
      createdAt: new Date().toISOString(),
      monthKey: makeMonthKey(date),
    });
    const extras = [];
    if (typeof applyRoundupToTransaction === "function") {
      const result = applyRoundupToTransaction(tx);
      if (result?.roundupTransaction) {
        extras.push(
          normalizeTransaction({
            ...result.roundupTransaction,
            id: result.roundupTransaction.id || makeId(),
          }),
        );
      }
    }
    setTransactions((prev) => [tx, ...extras, ...prev]);
  };

  const requestRemove = (tx) => {
    setConfirmDelete({ open: true, tx });
  };

  const cancelRemove = () => setConfirmDelete({ open: false, tx: null });

  const confirmRemove = () => {
    if (!confirmDelete.tx) {
      return;
    }
    const id = confirmDelete.tx.id;
    setTransactions((prev) => prev.filter((item) => item.id !== id));
    cancelRemove();
  };

  const statsCards = useMemo(() => {
    if (isMonthView) {
      return [
        { title: "Средняя покупка", value: fmtRub(averagePerPurchase) },
        { title: "В день с покупкой", value: fmtRub(averagePerDay) },
        { title: "Покупок", value: String(purchaseCount) },
        {
          title: "Главная категория",
          value: topCategory ? topCategory.shortLabel + " · " + topCategoryShare + "%" : "Пока нет",
        },
      ];
    }
    return [
      { title: "Средняя покупка", value: fmtRub(averagePerPurchase) },
      { title: "Самая крупная покупка", value: fmtRub(largestPurchase) },
      { title: "Покупок", value: String(purchaseCount) },
      {
        title: "Категория дня",
        value: topCategory ? topCategory.shortLabel + " · " + topCategoryShare + "%" : "Пока нет",
      },
    ];
  }, [isMonthView, averagePerPurchase, averagePerDay, purchaseCount, topCategory, topCategoryShare, largestPurchase]);

  const listTitle = isMonthView ? "Последние покупки" : "Покупки за день";
  const listItems = isMonthView ? visibleTransactions.slice(0, 6) : visibleTransactions;

  const changeViewMode = (mode) => {
    setViewMode(mode);
    if (mode === "day") {
      setDayShift(0);
    }
  };

  const baseToggleClass =
    "flex-1 rounded-full px-4 py-1.5 text-sm font-semibold text-center transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60";
  const dayButtonClass =
    baseToggleClass +
    (!isMonthView ? " bg-white text-black shadow shadow-black/20" : " text-white/80 hover:text-white");
  const monthButtonClass =
    baseToggleClass +
    (isMonthView ? " bg-white text-black shadow shadow-black/20" : " text-white/80 hover:text-white");

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-[100svh] bg-[#0b0b12] pb-28 text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header
        className="relative z-40 flex items-center gap-3 bg-[#0b0b12] px-5 pb-3 shadow-md shadow-black/30"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0) + 16px)" }}
      >
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
          aria-label="Назад"
          type="button"
        >
          <IconBack className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xl font-bold">Траты</div>
          <div className="text-sm text-white/70">Управляй своими покупками</div>
        </div>
      </header>

      <div className="space-y-5 px-5">
        <div className="rounded-[22px] bg-gradient-to-r from-[#a855f7] via-[#6366f1] to-[#22d3ee] p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm uppercase tracking-wide text-white/80">Итого за {periodLabel}</div>
              <div className="mt-1 text-[32px] font-extrabold leading-none">{fmtRub(totalSpent)}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/15 p-1">
                <button
                  type="button"
                  onClick={() => changeViewMode("day")}
                  className={dayButtonClass}
                  aria-pressed={!isMonthView}
                >
                  День
                </button>
                <button
                  type="button"
                  onClick={() => changeViewMode("month")}
                  className={monthButtonClass}
                  aria-pressed={isMonthView}
                >
                  Месяц
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                  aria-label="Назад во времени"
                  type="button"
                >
                  <IconChevronLeft />
                </button>
                <button
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 disabled:cursor-not-allowed disabled:bg-white/10"
                  aria-label="Вперёд во времени"
                  type="button"
                >
                  <IconChevronRight className={isNextDisabled ? "opacity-30" : ""} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-white/80">
            {statsCards.map((card) => (
              <div key={card.title} className="rounded-2xl bg-white/10 px-3 py-2">
                <div className="text-[12px] uppercase tracking-wide text-white/60">{card.title}</div>
                <div className="mt-1 text-[18px] font-semibold text-white">{card.value}</div>
              </div>
            ))}
          </div>
        </div>

        <DonutChart data={donutData} total={totalSpent} />

        <CategoryBreakdown categories={categoriesStats} total={totalSpent} />

        {isMonthView && <WeekdayChart data={weekdayStats} />}

        <div className="rounded-[22px] bg-[#1a1a1f] p-5">
          <div className="mb-3 text-[17px] font-semibold">{listTitle}</div>
          <TransactionsList items={listItems} onRemoveRequest={requestRemove} />
        </div>
      </div>

      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-5 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-r from-[#ec4899] to-[#a855f7] shadow-lg shadow-fuchsia-500/40"
        aria-label="Добавить трату"
        type="button"
      >
        <IconPlus className="h-7 w-7" />
      </button>

      <AddTransactionModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddTransaction} />

      <ConfirmDeleteModal open={confirmDelete.open} onClose={cancelRemove} onConfirm={confirmRemove} transaction={confirmDelete.tx} />
    </div>
  );
}


