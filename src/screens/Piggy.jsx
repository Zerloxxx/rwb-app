import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import defaultPenguin from "../assets/penguin.png";
import { loadPiggyState, savePiggyState } from "../utils/piggyStorage";
import { useProfile } from "../context/ProfileContext";
import { appendStoredTransaction } from "../utils/spendsStorage";
import { useCoins } from "../context/CoinsContext";
import { useMissions } from "../context/MissionsContext";

const fmtRub = (value = 0) => Number(value || 0).toLocaleString("ru-RU") + " руб.";

const IconBack = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const IconPlus = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconTrash = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M3 6h18M8 6v14m8-14v14M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
  </svg>
);

const IconMinus = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M5 12h14" />
  </svg>
);

const SettingsIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const COLORS = ["#7c3aed", "#2563eb", "#16a34a", "#ea580c", "#db2777", "#0891b2"];
const PENGUIN_SKINS = [
  { id: "penguin_default", label: "Классика", image: defaultPenguin, ownedByDefault: true },
  { id: "penguin_cosmo", label: "Космонавт", image: "./penguin-cosmo.png", ownedByDefault: false },
  { id: "penguin_racer", label: "Гонщик", image: "./penguin-racer.png", ownedByDefault: false },
];

const BACKGROUNDS = [
  { id: "default", label: "По умолчанию", gradient: "from-[#7a44ff] to-[#b35cff]", ownedByDefault: true },
  { id: "blue_sky", label: "Голубое небо", gradient: "from-[#3b82f6] to-[#06b6d4]", ownedByDefault: true },
  { id: "cosmic", label: "Космос", image: "./cosmic-background.jpg", ownedByDefault: true },
  { id: "sunny_field", label: "Солнечное поле", image: "./sunny-field-background.jpg", ownedByDefault: false },
  { id: "cyberpunk", label: "Киберпанк", image: "./cyberpunk-city-background.jpg", ownedByDefault: false },
];
const PRESET_AMOUNTS = [100, 300, 500, 1000];
const EMPTY_LIST = Object.freeze([]);
const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `piggy_${Math.random().toString(36).slice(2, 10)}`;

const initialDraft = (owner) => ({
  name: "",
  goal: 5000,
  color: COLORS[0],
  owner,
});

const clampPositive = (value) => Math.max(0, Math.round(Number(value) || 0));

const toDayKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const makeDayFromKey = (key) => {
  if (!key) return null;
  const date = new Date(`${key}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const enumeratePendingAutoDays = (lastKey, todayKey) => {
  if (!todayKey) {
    return [];
  }
  const todayDate = makeDayFromKey(todayKey);
  if (!todayDate) {
    return [];
  }
  const lastDate = makeDayFromKey(lastKey);
  if (!lastDate) {
    return [todayKey];
  }
  if (lastDate >= todayDate) {
    return [];
  }
  const days = [];
  const cursor = new Date(lastDate.getTime());
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= todayDate) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const AUTO_TOP_UP_INTERVAL = 60 * 1000;

function Modal({ open, onClose, children, maxWidth = "max-w-sm" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className={`relative w-full ${maxWidth} rounded-2xl bg-[#14141a] p-5 text-white ring-1 ring-white/10`}>
        {children}
      </div>
    </div>
  );
}

function AmountModal({ open, onClose, title, onSubmit }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-lg font-semibold">{title}</div>
      <input
        autoFocus
        inputMode="numeric"
        className="mt-4 w-full rounded-xl bg-white/10 px-3 py-3 text-right text-lg outline-none focus:ring-2 focus:ring-fuchsia-500/50"
        placeholder="Сумма, руб."
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, ""))}
      />
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-white/10 py-2 font-semibold">
          Отмена
        </button>
        <button
          type="button"
          onClick={() => {
            const amount = Number(value);
            if (!Number.isNaN(amount) && amount > 0) {
              onSubmit(amount);
              onClose();
            }
          }}
          className="flex-1 rounded-xl bg-white py-2 font-semibold text-black"
        >
          Готово
        </button>
      </div>
    </Modal>
  );
}

function ConfirmModal({ open, onClose, onConfirm, refund = 0 }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-lg font-semibold">Удалить цель?</div>
      <div className="mt-2 text-sm text-white/70">Это действие нельзя будет отменить.</div>
      {refund > 0 ? (
        <div className="mt-2 rounded-xl bg-white/5 p-3 text-sm text-white/80">
          На карту вернётся <span className="font-semibold">{fmtRub(refund)}</span>
        </div>
      ) : null}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-white/10 py-2 font-semibold">
          Оставить
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="flex-1 rounded-xl bg-red-500 py-2 font-semibold"
        >
          Удалить
        </button>
      </div>
    </Modal>
  );
}

function AutoTopUpModal({ open, onClose, onSubmit, onDisable, initialAmount = 0 }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      setValue(initialAmount > 0 ? String(initialAmount) : "");
    }
  }, [open, initialAmount]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-lg font-semibold">Автопополнение</div>
      <div className="mt-2 text-sm text-white/70">Деньги будут списываться с баланса карты каждый день.</div>
      <input
        autoFocus
        inputMode="numeric"
        className="mt-4 w-full rounded-xl bg-white/10 px-3 py-3 text-right text-lg outline-none focus:ring-2 focus:ring-fuchsia-500/50"
        placeholder="Сумма, руб."
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, ""))}
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {typeof onDisable === "function" ? (
          <button
            type="button"
            onClick={onDisable}
            className="flex-1 rounded-xl bg-white/10 py-2 font-semibold text-white/80 transition hover:bg-white/15"
          >
            Отключить
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-white/10 py-2 font-semibold"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={() => {
            const amount = Number(value);
            if (!Number.isNaN(amount) && amount > 0) {
              onSubmit(amount);
            }
          }}
          className="flex-1 rounded-xl bg-white py-2 font-semibold text-black"
        >
          Сохранить
        </button>
      </div>
    </Modal>
  );
}

const Progress = ({ value = 0, max = 1 }) => {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-400" style={{ width: `${pct}%` }} />
    </div>
  );
};

const CelebrationBurst = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <div className="pointer-events-none relative h-28 w-28">
      <span className="absolute" style={{ left: "50%", top: "12%", transform: "translate(-50%, 0)" }}>
        <span className="celebration-burst__spark block h-3 w-3 rounded-full" style={{ backgroundColor: "#f472b6" }} />
      </span>
      <span className="absolute" style={{ left: "18%", top: "36%" }}>
        <span className="celebration-burst__spark block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#facc15", animationDelay: "0.12s" }} />
      </span>
      <span className="absolute" style={{ right: "16%", top: "32%" }}>
        <span className="celebration-burst__spark block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#38bdf8", animationDelay: "0.18s" }} />
      </span>
      <span className="absolute" style={{ left: "24%", top: "66%" }}>
        <span className="celebration-burst__spark block h-2 w-2 rounded-full" style={{ backgroundColor: "#a855f7", animationDelay: "0.26s" }} />
      </span>
      <span className="absolute" style={{ right: "22%", top: "68%" }}>
        <span className="celebration-burst__spark block h-2 w-2 rounded-full" style={{ backgroundColor: "#34d399", animationDelay: "0.34s" }} />
      </span>
      <span className="absolute" style={{ left: "50%", bottom: "10%", transform: "translate(-50%, 0)" }}>
        <span className="celebration-burst__trail block h-16 w-1.5 rounded-full bg-gradient-to-t from-[#f472b6] via-[#a855f7] to-transparent" />
      </span>
      <span className="absolute" style={{ left: "22%", bottom: "18%" }}>
        <span className="celebration-burst__trail block h-12 w-1 rounded-full bg-gradient-to-t from-[#facc15] via-[#38bdf8] to-transparent" style={{ animationDelay: "0.18s" }} />
      </span>
      <span className="absolute" style={{ right: "22%", bottom: "18%" }}>
        <span className="celebration-burst__trail block h-12 w-1 rounded-full bg-gradient-to-t from-[#a855f7] via-[#34d399] to-transparent" style={{ animationDelay: "0.28s" }} />
      </span>
    </div>
  </div>
);


export default function Piggy({ onBack, role = "child" }) {
  const [state, setState] = useState(loadPiggyState);
  const { unlockAchievement, gainXp, profile } = useProfile();
  const { ownedRewards, isOwned, activateReward, active } = useCoins();
  const { triggerMission } = useMissions();
  const [designTab, setDesignTab] = useState("overview");
  const [designModal, setDesignModal] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(() => active?.penguinWear || "penguin_default");
  
  // Обновляем selectedSkin при изменении active.penguinWear
  useEffect(() => {
    if (active?.penguinWear) {
      setSelectedSkin(active.penguinWear);
    }
  }, [active?.penguinWear]);
  const [selectedTopBackground, setSelectedTopBackground] = useState(() => active?.topBackground || "default");
  const [topCustomizationModal, setTopCustomizationModal] = useState(false);
  const [piggyCustomizationModal, setPiggyCustomizationModal] = useState(false);
  const [editingPiggyId, setEditingPiggyId] = useState(null);
  const piggies = Array.isArray(state?.piggies) ? state.piggies : EMPTY_LIST;
  const cardBalance = Math.max(0, Number(state?.cardBalance) || 0);
  const parentCardBalance = Math.max(0, Number(state?.parentCardBalance) || 0);

  useEffect(() => {
    savePiggyState(state);
  }, [state]);

  const totals = useMemo(() => {
    const childList = [];
    const familyList = [];
    let childSum = 0;
    let familySum = 0;

    piggies.forEach((item) => {
      const owner = item.owner === "family" ? "family" : "child";
      const amount = Math.max(0, Number(item.amount) || 0);
      const goal = Math.max(0, Number(item.goal) || 0);
      const normalized = { ...item, owner, amount, goal };

      if (owner === "family") {
        familyList.push(normalized);
        familySum += amount;
      } else {
        childList.push(normalized);
        childSum += amount;
      }
    });

    return {
      childList,
      familyList,
      childTotal: childSum,
      familyTotal: familySum,
      total: childSum + familySum,
    };
  }, [piggies]);

  const [ownerFilter, setOwnerFilter] = useState(() => (role === "parent" ? "family" : "child"));
  const [amountModal, setAmountModal] = useState({ open: false, id: null, mode: "deposit" });
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [autoModal, setAutoModal] = useState({ open: false, id: null, initial: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(() => initialDraft(role === "parent" ? "family" : ownerFilter));
  const [celebrations, setCelebrations] = useState(() => []);
  const celebrationTimersRef = useRef(new Map());
  const prevSnapshotRef = useRef(new Map());

  useEffect(() => {
    setDraft(initialDraft(role === "parent" ? "family" : ownerFilter));
  }, [role, ownerFilter]);

  useEffect(() => {
    return () => {
      celebrationTimersRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      celebrationTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const prevMap = prevSnapshotRef.current;
    const nextMap = new Map();
    const triggered = [];

    piggies.forEach((item) => {
      const goal = Math.max(0, Number(item.goal) || 0);
      const amount = Math.max(0, Number(item.amount) || 0);
      const prevEntry = prevMap.get(item.id);
      const prevAmount = prevEntry ? Math.max(0, Number(prevEntry.amount) || 0) : 0;

      if (goal > 0 && prevAmount < goal && amount >= goal) {
        triggered.push(item.id);
      }

      nextMap.set(item.id, { amount, goal });
    });

    prevSnapshotRef.current = nextMap;

    if (triggered.length) {
      triggered.forEach((id, index) => {
        const key = `${id}-${Date.now()}-${index}`;
        setCelebrations((prev) => [...prev, { id, key }]);
        const timeoutId = setTimeout(() => {
          setCelebrations((prev) => prev.filter((item) => item.key !== key));
          celebrationTimersRef.current.delete(key);
        }, 1800);
        celebrationTimersRef.current.set(key, timeoutId);
      });
    }
  }, [piggies]);


  const filteredPiggies = ownerFilter === "family" ? totals.familyList : totals.childList;

    const summaryChips = [
      { label: role === "parent" ? "Копилки ребенка" : "Мои копилки", value: fmtRub(totals.childTotal) },
      { label: "Семейные копилки", value: fmtRub(totals.familyTotal) },
      { label: "Баланс карты", value: fmtRub(role === "parent" ? parentCardBalance : cardBalance) },
    ];

  const depositLabel = (owner) => {
    if (role === "parent") {
      return owner === "child" ? "Помочь" : "Пополнить";
    }
    return "Пополнить";
  };

  const moveFunds = (id, mode, rawAmount) => {
    const amount = clampPositive(rawAmount);
    if (!id || amount <= 0) {
      return null;
    }

    let transfer = null;

    setState((prev) => {
      const target = prev.piggies.find((item) => item.id === id);
      if (!target) {
        transfer = { status: "missing" };
        return prev;
      }

      const owner = target.owner === "family" ? "family" : "child";
      if (mode === "withdraw" && role === "parent" && owner === "child") {
        transfer = { status: "forbidden", piggy: target };
        return prev;
      }

      const currentAmount = Math.max(0, Number(target.amount) || 0);
      const currentCard = Math.max(0, Number(prev.cardBalance) || 0);
      const currentParentCard = Math.max(0, Number(prev.parentCardBalance) || 0);
      const goal = Math.max(0, Number(target.goal) || 0);
      const remainingCapacity = goal > 0 ? Math.max(0, goal - currentAmount) : Number.POSITIVE_INFINITY;

      if (mode === "withdraw") {
        const actual = Math.min(amount, currentAmount);
        if (actual <= 0) {
          transfer = { status: "empty", piggy: target };
          return prev;
        }
        transfer = { status: "success", type: "withdraw", amount: actual, piggy: target };
        
        // Возвращаем деньги на правильную карту в зависимости от роли
        if (role === "parent") {
          // Родитель получает деньги на свой баланс
          return {
            ...prev,
            parentCardBalance: currentParentCard + actual,
            piggies: prev.piggies.map((item) =>
              item.id === id ? { ...item, amount: currentAmount - actual } : item
            ),
          };
        } else {
          // Ребенок получает деньги на свой баланс
          return {
            ...prev,
            cardBalance: currentCard + actual,
            piggies: prev.piggies.map((item) =>
              item.id === id ? { ...item, amount: currentAmount - actual } : item
            ),
          };
        }
      }

      if (remainingCapacity <= 0) {
        transfer = { status: "full", piggy: target };
        return prev;
      }

      // Определяем, с какой карты списывать деньги
      let sourceBalance, sourceKey;
      if (role === "parent") {
        // Родитель всегда списывает со своего баланса, независимо от типа копилки
        sourceBalance = currentParentCard;
        sourceKey = "parentCardBalance";
      } else {
        // Ребенок списывает со своего баланса
        sourceBalance = currentCard;
        sourceKey = "cardBalance";
      }

      const actual = Math.min(amount, sourceBalance, remainingCapacity);
      if (actual <= 0) {
        transfer = { status: sourceBalance <= 0 ? "insufficient" : "full", piggy: target };
        return prev;
      }

      transfer = {
        status: "success",
        type: "deposit",
        amount: actual,
        piggy: target,
        capped: actual < amount,
      };

      return {
        ...prev,
        [sourceKey]: sourceBalance - actual,
        piggies: prev.piggies.map((item) =>
          item.id === id ? { ...item, amount: currentAmount + actual } : item
        ),
      };
    });

    if (transfer?.status === "insufficient" && typeof window !== "undefined") {
      window.alert("Недостаточно средст на карте");
    }

    if (transfer?.status === "full" && typeof window !== "undefined") {
      window.alert("Цель уже достигла максимальной суммы");
    }

    if (transfer?.status === "success" && transfer.type === "deposit") {
      appendStoredTransaction({
        amount: transfer.amount,
        category: "other",
        note: `Пополнение копилки "${transfer.piggy.name || "Без названия"}"`,
      });
      
      // Триггерим миссию пополнения копилки
      if (transfer.amount >= 100) {
        triggerMission("daily_piggy_deposit", 1);
      }
    }

    return transfer;
  };

  const handleQuickAdd = (id, amount) => {
    const res = moveFunds(id, "deposit", amount);
    if (res?.status === "success" && res.type === "deposit") {
      const newly = unlockAchievement("first_piggy_deposit");
      if (newly) {
        appendStoredTransaction({ amount: 30, category: "bonus", note: "Награда: первое пополнение" });
      }
      if (res.amount >= 100) {
        gainXp(10);
        triggerMission("daily_piggy_deposit", 1);
      }
    }
  };

  const handleAmountSubmit = (value) => {
    const { id, mode } = amountModal;
    if (!id) return;

    moveFunds(id, mode, value);
  };

  const handleWithdrawAll = (id, _amount) => {
    // Перечисляем всю сумму цели на карту и сразу удаляем цель
    setState((prev) => {
      const target = prev.piggies.find((item) => item.id === id);
      if (!target) return prev;
      const currentAmount = Math.max(0, Number(target.amount) || 0);
      const owner = target.owner === "family" ? "family" : "child";
      
      if (currentAmount <= 0) {
        // Нечего выводить — просто удалим копилку
        return {
          ...prev,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      }

      // Возвращаем деньги на правильную карту в зависимости от роли
      if (role === "parent") {
        // Родитель получает деньги на свой баланс
        const nextParentCard = Math.max(0, Number(prev.parentCardBalance) || 0) + currentAmount;
        return {
          ...prev,
          parentCardBalance: nextParentCard,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      } else {
        // Ребенок получает деньги на свой баланс
        const nextCard = Math.max(0, Number(prev.cardBalance) || 0) + currentAmount;
        return {
          ...prev,
          cardBalance: nextCard,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      }
    });
  };

  const updatePiggy = (id, patch) => {
    setState((prev) => ({
      ...prev,
      piggies: prev.piggies.map((item) =>
        item.id === id ? { ...item, ...(typeof patch === "function" ? patch(item) : patch) } : item
      ),
    }));
  };

  const closeAutoModal = () => setAutoModal({ open: false, id: null, initial: 0 });

  const handleAutoTopUpSubmit = (rawValue) => {
    const { id } = autoModal;
    if (!id) {
      closeAutoModal();
      return;
    }
    const amount = clampPositive(rawValue);
    if (amount <= 0) {
      closeAutoModal();
      return;
    }

    updatePiggy(id, (prevPiggy) => {
      const todayKey = toDayKey(new Date());
      const prevAuto = prevPiggy.autoTopUp;
      const prevLast = prevAuto ? toDayKey(prevAuto.lastApplied) : null;
      const normalizedLast = prevLast && todayKey && prevLast <= todayKey ? prevLast : todayKey;
      return {
        autoTopUp: {
          amount,
          lastApplied: normalizedLast || null,
        },
      };
    });

    closeAutoModal();
    processAutoTopUps();
  };

  const handleAutoTopUpDisable = () => {
    const { id } = autoModal;
    if (!id) {
      closeAutoModal();
      return;
    }

    updatePiggy(id, { autoTopUp: null });
    closeAutoModal();
    processAutoTopUps();
  };

  const removePiggy = (id) => {
    setState((prev) => {
      const target = prev.piggies.find((p) => p.id === id);
      if (!target) return prev;
      const amount = Math.max(0, Number(target.amount) || 0);
      const owner = target.owner === "family" ? "family" : "child";
      
      // Возвращаем деньги на правильную карту в зависимости от роли
      if (role === "parent") {
        // Родитель получает деньги на свой баланс
        const nextParentCard = Math.max(0, Number(prev.parentCardBalance) || 0) + amount;
        return {
          ...prev,
          parentCardBalance: nextParentCard,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      } else {
        // Ребенок получает деньги на свой баланс
        const nextCard = Math.max(0, Number(prev.cardBalance) || 0) + amount;
        return {
          ...prev,
          cardBalance: nextCard,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      }
    });
  };

  const processAutoTopUps = useCallback(() => {
    let operations = [];
    setState((prev) => {
      const piggiesList = Array.isArray(prev.piggies) ? prev.piggies : EMPTY_LIST;
      if (piggiesList.length === 0) {
        return prev;
      }

      const todayKey = toDayKey(new Date());
      if (!todayKey) {
        return prev;
      }

      let cardBalance = Math.max(0, Number(prev.cardBalance) || 0);
      let changed = false;

      const nextPiggies = piggiesList.map((piggy) => {
        const rawAuto = piggy.autoTopUp;
        const amountPerDay = clampPositive(rawAuto?.amount);
        if (amountPerDay <= 0) {
          if (rawAuto) {
            changed = true;
            return { ...piggy, autoTopUp: null };
          }
          return piggy;
        }

        const lastApplied = toDayKey(rawAuto?.lastApplied);
        const pendingDays = enumeratePendingAutoDays(lastApplied, todayKey);
        const goal = Math.max(0, Number(piggy.goal) || 0);
        let piggyAmount = Math.max(0, Number(piggy.amount) || 0);
        let deposited = 0;
        let processedDays = 0;
        let latestApplied = lastApplied;

        for (const dayKey of pendingDays) {
          if (cardBalance <= 0) {
            break;
          }
          if (goal > 0 && piggyAmount >= goal) {
            break;
          }
          const capacity = goal > 0 ? Math.max(0, goal - piggyAmount) : Number.POSITIVE_INFINITY;
          const actual = Math.min(amountPerDay, capacity, cardBalance);
          if (actual <= 0) {
            break;
          }
          piggyAmount += actual;
          cardBalance -= actual;
          deposited += actual;
          processedDays += 1;
          latestApplied = dayKey;
          if (goal > 0 && piggyAmount >= goal) {
            break;
          }
        }

        const normalizedLast = latestApplied || lastApplied || null;
        const nextAutoTopUp = {
          amount: amountPerDay,
          lastApplied: normalizedLast,
        };

        if (deposited > 0) {
          changed = true;
          operations.push({
            id: piggy.id,
            name: piggy.name,
            amount: deposited,
            days: processedDays,
          });
          return {
            ...piggy,
            amount: piggyAmount,
            autoTopUp: nextAutoTopUp,
          };
        }

        if ((rawAuto?.amount ?? null) !== amountPerDay || (lastApplied || null) !== (normalizedLast || null)) {
          changed = true;
          return {
            ...piggy,
            autoTopUp: nextAutoTopUp,
          };
        }

        return piggy;
      });

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        cardBalance,
        piggies: nextPiggies,
      };
    });

    if (operations.length) {
      operations.forEach(({ amount, name, days }) => {
        appendStoredTransaction({
          amount,
          category: "other",
          note: `                    "${name || "            "}"${days > 1 ? ` (${days}   .)` : ""}`,
        });
      });
    }
  }, []);

  useEffect(() => {
    processAutoTopUps();
    const intervalId = setInterval(processAutoTopUps, AUTO_TOP_UP_INTERVAL);
    return () => clearInterval(intervalId);
  }, [processAutoTopUps]);

  const canEdit = (piggy) => (piggy.owner === "family" ? role === "parent" : true);

  const canManageAutoTopUp = (piggy) => {
    if (role === "parent") {
      return true;
    }
    return piggy.owner !== "family";
  };

  const canWithdraw = (piggy) => {
    if (piggy.owner === "family") {
      return role === "parent";
    }
    return role !== "parent";
  };

  const getCurrentTopBackground = () => {
    const background = BACKGROUNDS.find(bg => bg.id === selectedTopBackground) || BACKGROUNDS[0];
    if (background.image) {
      return `bg-cover bg-center`;
    }
    return `bg-gradient-to-r ${background.gradient}`;
  };

  const getCurrentTopBackgroundStyle = () => {
    const background = BACKGROUNDS.find(bg => bg.id === selectedTopBackground) || BACKGROUNDS[0];
    if (background.image) {
      return {
        backgroundImage: `url(${background.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {};
  };

  const getCurrentPenguin = () => {
    const skin = PENGUIN_SKINS.find(s => s.id === selectedSkin) || PENGUIN_SKINS[0];
    return skin.image;
  };

  const creationDisabled =
    (role !== "parent" && ownerFilter === "family") || (role === "parent" && ownerFilter === "child");

  const restrictionNote = (() => {
    if (role !== "parent" && ownerFilter === "family") {
      return "Новую общую цель может создать родитель";
    }
    if (role === "parent" && ownerFilter === "child") {
      return "Эти цели добавляются в приложении ребёнка";
    }
    return null;
  })();

  const openCreateModal = () => {
    if (creationDisabled) return;
    const owner = role === "parent" ? "family" : "child";
    setDraft(initialDraft(owner));
    setCreateOpen(true);
  };

  const handleCreate = () => {
    const owner = role === "parent" ? "family" : "child";
    const name = draft.name.trim();
    if (!name) return;

    const newPiggy = {
      id: makeId(),
      name,
      goal: Math.max(0, Number(draft.goal) || 0),
      amount: 0,
      color: draft.color,
      owner,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      piggies: [...prev.piggies, newPiggy],
    }));

    setDraft(initialDraft(owner));
    setCreateOpen(false);
  };

  const ownerTabs = [
    { key: "child", label: role === "parent" ? "Цели ребёнка" : "Мои цели" },
    { key: "family", label: "Общие цели" },
  ];

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] text-white">
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-[#0b0b12] px-5 pb-3 shadow-md shadow-black/30"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0) + 16px)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <IconBack className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xl font-bold">Копилки</div>
          <div className="text-sm text-white/60">Всего накоплено: {fmtRub(totals.total)}</div>
        </div>
      </header>

      <section className="px-5 pt-36">
        <div 
          className={`relative min-h-[100px] rounded-[24px] ${getCurrentTopBackground()} px-6 py-6 pr-28 shadow-lg shadow-black/30`}
          style={getCurrentTopBackgroundStyle()}
        >
          <div className="text-[26px] font-extrabold leading-none tabular-nums">{fmtRub(totals.total)}</div>
          <div className="mt-2 text-sm text-white/80">Копим мечты вместе с семьёй</div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/85">
            {summaryChips.map((chip) => (
              <span key={chip.label} className="rounded-full bg-white/20 px-3 py-1 font-semibold">
                {chip.label}: {chip.value}
              </span>
            ))}
          </div>
          <img
            src={getCurrentPenguin()}
            alt="Пингвин-коуч"
            className="pointer-events-none absolute bottom-2 right-2 h-[92px] select-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
          />
          {role === "child" && (
            <button
              onClick={() => setTopCustomizationModal(true)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
              aria-label="Настройки верхней панели"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="flex items-center gap-2 rounded-[18px] bg-[#131318] p-2">
          {ownerTabs.map((tab) => {
            const active = ownerFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setOwnerFilter(tab.key)}
                className={`flex-1 rounded-[14px] px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-white text-black shadow" : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-4">
        <button
          type="button"
          onClick={openCreateModal}
          disabled={creationDisabled}
          className="w-full rounded-[18px] bg-white px-5 py-4 font-semibold text-black shadow-[0_12px_35px_rgba(0,0,0,0.35)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-black/40"
        >
          <div className="flex items-center justify-center gap-2">
            <IconPlus className="h-5 w-5" />
            <span>Создать цель</span>
          </div>
          {restrictionNote && (
            <div className="mt-1 text-xs text-black/55">{restrictionNote}</div>
          )}
        </button>
      </section>

      <section className="px-5 mt-5 pb-28 space-y-4">
        {filteredPiggies.length === 0 && (
          <div className="rounded-[18px] bg-[#131318] p-6 text-center text-white/70">
            {ownerFilter === "family"
              ? "Общих целей пока нет. Попросите родителя добавить новую."
              : "Создайте первую цель и начните копить."}
          </div>
        )}

        {filteredPiggies.map((piggy) => {
          const goal = Math.max(0, Number(piggy.goal) || 0);
          const amount = Math.max(0, Number(piggy.amount) || 0);
          const progress = goal > 0 ? Math.min(100, Math.round((amount / goal) * 100)) : 0;
          const editable = canEdit(piggy);
          const isCompleted = goal > 0 && amount >= goal;
          const isCelebrating = celebrations.some((item) => item.id === piggy.id);

          const autoTopUpAmount = clampPositive(piggy.autoTopUp?.amount);
          const autoTopUpActive = autoTopUpAmount > 0;
          const autoTopUpButtonClasses = [
            "col-span-2",
            "sm:col-span-4",
            "flex items-center justify-center gap-2",
            "rounded-xl border border-white/15 py-2 text-sm font-semibold transition",
            autoTopUpActive ? "bg-white/10 text-white hover:bg-white/15" : "bg-white/5 text-white/70 hover:bg-white/10",
          ].join(" ");
          const autoTopUpStateClass = autoTopUpActive
            ? "text-xs font-semibold text-fuchsia-300"
            : "text-xs font-semibold text-white/50";

          return (
            <div 
              key={piggy.id} 
              className={`relative overflow-hidden rounded-[18px] p-4 ring-1 ring-white/5 ${
                (() => {
                  const background = BACKGROUNDS.find(bg => bg.id === piggy.background) || BACKGROUNDS[0];
                  if (background.image) {
                    return 'bg-cover bg-center';
                  }
                  return `bg-gradient-to-br ${background.gradient}`;
                })()
              }`}
              style={(() => {
                const background = BACKGROUNDS.find(bg => bg.id === piggy.background) || BACKGROUNDS[0];
                if (background.image) {
                  return {
                    backgroundImage: `url(${background.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  };
                }
                return {};
              })()}
            >
              {isCelebrating ? <CelebrationBurst /> : null}
              <div className={isCompleted ? "pointer-events-none opacity-35" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-1 min-w-0 items-start gap-3">
                  <div className="h-11 w-11 flex-shrink-0 rounded-2xl" style={{ backgroundColor: piggy.color || COLORS[0] }} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {editable ? (
                        <input
                          className="w-full max-w-[220px] bg-transparent text-base font-semibold leading-tight outline-none"
                          value={piggy.name}
                          maxLength={48}
                          onChange={(event) => updatePiggy(piggy.id, { name: event.target.value })}
                        />
                      ) : (
                        <div className="break-words text-base font-semibold leading-tight text-white">{piggy.name}</div>
                      )}
                      {role === "parent" && (
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            piggy.owner === "family" ? "bg-blue-500/25 text-blue-100" : "bg-white/10 text-white/70"
                          }`}
                        >
                          {piggy.owner === "family" ? "Общая" : "Цель ребёнка"}
                        </span>
                      )}
                      {editable && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPiggyId(piggy.id);
                              setPiggyCustomizationModal(true);
                            }}
                            className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/70 transition hover:bg-white/10"
                            title="Настроить фон"
                          >
                            <SettingsIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ open: true, id: piggy.id })}
                            className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/70 transition hover:bg-white/10"
                            title="Удалить цель"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-white/60">
                      <span>Цель:</span>
                      {editable ? (
                        <input
                          type="number"
                          min={0}
                          className="w-24 bg-transparent text-right text-white outline-none"
                          value={goal}
                          onChange={(event) => {
                            const next = Math.max(0, Number(event.target.value) || 0);
                            updatePiggy(piggy.id, { goal: next });
                          }}
                        />
                      ) : (
                        <span className="tabular-nums text-white/80">{fmtRub(goal)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end text-right">
                  <div className="text-[20px] font-extrabold tabular-nums">{fmtRub(amount)}</div>
                  <div className="text-xs text-white/60">{progress}%</div>
                </div>
              </div>

              <div className="mt-3">
                <Progress value={amount} max={Math.max(1, goal)} />
              </div>

              {autoTopUpActive ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70">
                  <span>Автопополнение</span>
                  <span className="font-semibold text-white">по {fmtRub(autoTopUpAmount)} в день</span>
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleQuickAdd(piggy.id, preset)}
                    className="rounded-xl bg-white/10 py-2 font-semibold transition hover:bg-white/15"
                  >
                    +{fmtRub(preset)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmountModal({ open: true, id: piggy.id, mode: "deposit" })}
                  className="col-span-2 flex items-center justify-center gap-1 rounded-xl bg-white py-2 font-semibold text-black"
                >
                  <IconPlus className="h-4 w-4" />
                  {depositLabel(piggy.owner)}
                </button>
                {canWithdraw(piggy) ? (
                  <button
                    type="button"
                    onClick={() => setAmountModal({ open: true, id: piggy.id, mode: "withdraw" })}
                    className="col-span-2 flex items-center justify-center gap-1 rounded-xl bg-white/10 py-2 font-semibold text-white/80 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:bg-white/5"
                    disabled={amount === 0}
                  >
                    <IconMinus className="h-4 w-4" />
                    Снять
                  </button>
                ) : null}
                {canManageAutoTopUp(piggy) ? (
                  <button
                    type="button"
                    onClick={() => setAutoModal({ open: true, id: piggy.id, initial: autoTopUpAmount })}
                    className={autoTopUpButtonClasses}
                  >
                    <span>Автопополнение</span>
                    <span className={autoTopUpStateClass}>{autoTopUpActive ? "вкл." : "выкл."}</span>
                  </button>
                ) : null}
              </div>
            </div>
            {isCompleted && role !== "parent" ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70 px-4 text-center">
                <div className="text-lg font-bold">Цель выполнена!</div>
                <button
                  type="button"
                  onClick={() => handleWithdrawAll(piggy.id, amount)}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow transition hover:bg-white/90"
                >
                  Снять деньги
                </button>
              </div>
            ) : null}
          </div>
          );
        })}
      </section>

      <AmountModal
        open={amountModal.open}
        onClose={() => setAmountModal({ open: false, id: null, mode: "deposit" })}
        title={amountModal.mode === "deposit" ? "Пополнить цель" : "Снять с цели"}
        onSubmit={handleAmountSubmit}
      />

      <AutoTopUpModal
        open={autoModal.open}
        initialAmount={autoModal.initial}
        onClose={closeAutoModal}
        onSubmit={handleAutoTopUpSubmit}
        onDisable={autoModal.initial > 0 ? handleAutoTopUpDisable : undefined}
      />

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: null })}
        refund={(() => {
          if (!confirmModal.open || !confirmModal.id) return 0;
          const item = piggies.find((p) => p.id === confirmModal.id);
          return Math.max(0, Number(item?.amount) || 0);
        })()}
        onConfirm={() => {
          if (confirmModal.id) {
            const newly = unlockAchievement("first_piggy_delete");
            if (newly) appendStoredTransaction({ amount: 20, category: "bonus", note: "Награда: первая очистка цели" });
            gainXp(5);
            removePiggy(confirmModal.id);
          }
        }}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="text-lg font-semibold">Добавить новую цель</div>
        <div className="mt-4 grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <label className="text-xs text-white/60">Название</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-fuchsia-500/40"
              placeholder="Например: Самокат"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-white/60">Цель, руб.</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-fuchsia-500/40"
              value={draft.goal}
              onChange={(event) => setDraft((prev) => ({ ...prev, goal: event.target.value }))}
            />
          </div>
        </div>

        {role === "parent" ? (
          <div className="mt-4 text-sm text-white/70">Цель будет создана как общая для семьи.</div>
        ) : null}

        <div className="mt-4">
          <div className="mb-2 text-xs text-white/60">Цвет</div>
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, color }))}
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: color, outline: draft.color === color ? "3px solid rgba(255,255,255,0.6)" : "none" }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 rounded-xl bg-white/10 py-2 font-semibold">
            Отмена
          </button>
          <button type="button" onClick={handleCreate} className="flex-1 rounded-xl bg-white py-2 font-semibold text-black">
            Создать
          </button>
        </div>
      </Modal>

      {/* Модальное окно кастомизации верхней панели */}
      <Modal open={topCustomizationModal} onClose={() => setTopCustomizationModal(false)} maxWidth="max-w-sm">
        <div className="max-h-[80vh] flex flex-col">
          <div className="text-lg font-semibold mb-4">Настройка верхней панели</div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="mt-4">
              <div className="mb-3 text-sm text-white/70">Пингвин</div>
              <div className="grid grid-cols-3 gap-3">
                {PENGUIN_SKINS.map((skin) => {
                  const owned = skin.ownedByDefault || isOwned(skin.id);
                  return (
                    <button
                      key={skin.id}
                      onClick={() => {
                        if (owned) {
                          setSelectedSkin(skin.id);
                        } else {
                          window.location.hash = "#/shop";
                        }
                      }}
                      className={`relative overflow-hidden rounded-xl p-3 text-center transition ${
                        selectedSkin === skin.id ? "ring-2 ring-[#5d2efc]" : "ring-0"
                      } ${!owned ? "opacity-60" : ""}`}
                    >
                      <div className="aspect-square overflow-hidden rounded-lg bg-white/10">
                        <img src={skin.image} alt={skin.label} className="h-full w-full object-contain" />
                      </div>
                      <div className="mt-2 text-xs text-white/80">{skin.label}</div>
                      {selectedSkin === skin.id && owned && (
                        <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#5d2efc] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-2 w-2 text-white">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                      {!owned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                          <div className="text-xs text-white font-semibold">Купить</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 text-sm text-white/70">Фон</div>
              <div className="grid grid-cols-2 gap-3">
                {BACKGROUNDS.map((background) => (
                  <button
                    key={background.id}
                    onClick={() => setSelectedTopBackground(background.id)}
                    className={`relative overflow-hidden rounded-xl p-3 text-center transition ${
                      selectedTopBackground === background.id ? "ring-2 ring-[#5d2efc]" : "ring-0"
                    }`}
                  >
                    <div 
                      className={`aspect-video rounded-lg ${
                        background.image 
                          ? 'bg-cover bg-center' 
                          : `bg-gradient-to-r ${background.gradient}`
                      }`}
                      style={background.image ? { backgroundImage: `url(${background.image})` } : {}}
                    />
                    <div className="mt-2 text-xs text-white/80">{background.label}</div>
                    {selectedTopBackground === background.id && (
                      <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#5d2efc] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-2 w-2 text-white">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setTopCustomizationModal(false)}
              className="flex-1 rounded-xl bg-white/10 py-2 font-semibold"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => {
                // Сохраняем настройки
                activateReward({ id: selectedSkin, type: "penguinWear" });
                activateReward({ id: selectedTopBackground, type: "topBackground" });
                setTopCustomizationModal(false);
              }}
              className="flex-1 rounded-xl bg-white py-2 font-semibold text-black"
            >
              Применить
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно кастомизации копилки */}
      <Modal open={piggyCustomizationModal} onClose={() => setPiggyCustomizationModal(false)} maxWidth="max-w-sm">
        <div className="max-h-[80vh] flex flex-col">
          <div className="text-lg font-semibold mb-4">Настройка фона копилки</div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="mb-3 text-sm text-white/70">Фон</div>
            <div className="grid grid-cols-2 gap-3">
              {BACKGROUNDS.map((background) => (
                <button
                  key={background.id}
                  onClick={() => {
                    if (editingPiggyId) {
                      updatePiggy(editingPiggyId, { background: background.id });
                    }
                  }}
                  className={`relative overflow-hidden rounded-xl p-3 text-center transition ${
                    (() => {
                      const piggy = piggies.find(p => p.id === editingPiggyId);
                      return piggy?.background === background.id ? "ring-2 ring-[#5d2efc]" : "ring-0";
                    })()
                  }`}
                >
                  <div 
                    className={`aspect-video rounded-lg ${
                      background.image 
                        ? 'bg-cover bg-center' 
                        : `bg-gradient-to-r ${background.gradient}`
                    }`}
                    style={background.image ? { backgroundImage: `url(${background.image})` } : {}}
                  />
                  <div className="mt-2 text-xs text-white/80">{background.label}</div>
                  {(() => {
                    const piggy = piggies.find(p => p.id === editingPiggyId);
                    return piggy?.background === background.id && (
                      <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#5d2efc] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-2 w-2 text-white">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    );
                  })()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setPiggyCustomizationModal(false)}
              className="flex-1 rounded-xl bg-white/10 py-2 font-semibold"
            >
              Готово
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}












