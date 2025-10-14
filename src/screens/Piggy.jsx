import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import defaultPenguin from "../assets/penguin.png";
import { loadPiggyState, savePiggyState, savePiggyStateImmediate, PIGGY_UPDATED_EVENT, recoverPiggyState, validatePiggyState, safeSavePiggyState } from "../utils/piggyStorage";
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

const COLORS = ["#7c3aed", "#2563eb", "#16a34a", "#ea580c", "#db2777", "#0891b2"];
const PENGUIN_SKINS = [
  { id: "penguin_default", label: "Классика", image: defaultPenguin, ownedByDefault: true },
  { id: "penguin_cosmo", label: "Космонавт", image: "./penguin-cosmo.png", ownedByDefault: false },
  { id: "penguin_racer", label: "Гонщик", image: "./penguin-racer.png", ownedByDefault: false },
];

const BACKGROUNDS = [
  { id: "default", label: "По умолчанию", gradient: "from-[#7a44ff] to-[#b35cff]", ownedByDefault: true },
  { id: "blue_sky", label: "Голубое небо", gradient: "from-blue-400 to-sky-400", ownedByDefault: false },
  { id: "cosmic_image", label: "Космический", image: "./cosmic-background.jpg", ownedByDefault: false },
  { id: "sunny_field", label: "Солнечное поле", image: "./sunny-field-background.jpg", ownedByDefault: false },
  { id: "cyberpunk_city", label: "Киберпанк город", image: "./cyberpunk-city-background.jpg", ownedByDefault: false },
];
const PRESET_AMOUNTS = [100, 300, 500, 1000];
const EMPTY_LIST = Object.freeze([]);
const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `piggy_${Math.random().toString(36).slice(2, 10)}`;

const DESIGN_STORAGE_KEY = "piggy_design_settings";

const loadDesignSettings = () => {
  try {
    const stored = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to load design settings:", error);
  }
  return {
    selectedSkin: "penguin_default",
    selectedBackground: "default"
  };
};

const saveDesignSettings = (settings) => {
  try {
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to save design settings:", error);
  }
};

const initialDraft = (owner) => ({
  name: "",
  goal: 5000,
  color: COLORS[0],
  background: "default",
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
  const [state, setState] = useState(() => {
    try {
      const loadedState = loadPiggyState();
      if (validatePiggyState(loadedState)) {
        return loadedState;
      } else {
        console.warn('⚠️ Загруженное состояние некорректно, восстанавливаем...');
        return recoverPiggyState();
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки состояния:', error);
      return recoverPiggyState();
    }
  });
  
  const { unlockAchievement, gainXp, profile } = useProfile();
  const { ownedRewards, isOwned, activateReward, active } = useCoins();
  const { triggerMission } = useMissions();
  
  // Функция для восстановления состояния при критических ошибках
  const recoverState = useCallback(() => {
    try {
      console.log('🔄 Восстановление состояния...');
      const recoveredState = recoverPiggyState();
      setState(recoveredState);
      console.log('✅ Состояние восстановлено');
    } catch (error) {
      console.error('❌ Не удалось восстановить состояние:', error);
    }
  }, []);

  // Синхронизация состояния при смене роли
  useEffect(() => {
    console.log('🔄 Синхронизация состояния при смене роли:', role);
    try {
      const currentState = loadPiggyState();
      console.log('📊 Загруженное состояние:', {
        piggiesCount: currentState.piggies?.length || 0,
        childPiggies: currentState.piggies?.filter(p => p.owner === 'child').length || 0,
        familyPiggies: currentState.piggies?.filter(p => p.owner === 'family').length || 0,
        cardBalance: currentState.cardBalance,
        parentCardBalance: currentState.parentCardBalance
      });
      
      if (validatePiggyState(currentState)) {
        setState(currentState);
        console.log('✅ Состояние синхронизировано для роли:', role);
      } else {
        console.warn('⚠️ Состояние некорректно, восстанавливаем...');
        recoverState();
      }
    } catch (error) {
      console.error('❌ Ошибка синхронизации состояния:', error);
      recoverState();
    }
  }, [role, recoverState]);

  // Слушатель событий для синхронизации состояния между вкладками
  useEffect(() => {
    const handleStorageUpdate = (event) => {
      if (event.detail) {
        console.log('🔄 Получено обновление состояния из другого окна/вкладки');
        setState(event.detail);
      }
    };

    window.addEventListener(PIGGY_UPDATED_EVENT, handleStorageUpdate);
    return () => window.removeEventListener(PIGGY_UPDATED_EVENT, handleStorageUpdate);
  }, []);
  
  const [designTab, setDesignTab] = useState("overview");
  const [designModal, setDesignModal] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(() => {
    const settings = loadDesignSettings();
    return settings.selectedSkin;
  });
  const [selectedBackground, setSelectedBackground] = useState(() => {
    const settings = loadDesignSettings();
    return settings.selectedBackground;
  });
  const piggies = Array.isArray(state?.piggies) ? state.piggies : EMPTY_LIST;
  const cardBalance = Math.max(0, Number(state?.cardBalance) || 0);
  const parentCardBalance = Math.max(0, Number(state?.parentCardBalance) || 0);

  useEffect(() => {
    // Миграция: добавляем поле background для существующих копилок
    const needsMigration = state.piggies.some(piggy => !piggy.background);
    if (needsMigration) {
      setState(prev => ({
        ...prev,
        piggies: prev.piggies.map(piggy => ({
          ...piggy,
          background: piggy.background || "default"
        }))
      }));
    }

    // Слушатель для обновления состояния при изменении в localStorage
    const handleStorageUpdate = (event) => {
      if (event.detail) {
        setState(event.detail);
      }
    };

    window.addEventListener(PIGGY_UPDATED_EVENT, handleStorageUpdate);
    
    return () => {
      window.removeEventListener(PIGGY_UPDATED_EVENT, handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    savePiggyState(state);
  }, [state]);

  useEffect(() => {
    saveDesignSettings({
      selectedSkin,
      selectedBackground
    });
  }, [selectedSkin, selectedBackground]);

  const totals = useMemo(() => {
    const childList = [];
    const familyList = [];
    let childSum = 0;
    let familySum = 0;

    console.log('📊 Обработка копилок для totals:', {
      totalPiggies: piggies.length,
      role,
      piggies: piggies.map(p => ({ id: p.id, name: p.name, owner: p.owner }))
    });

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

    const result = {
      childList,
      familyList,
      childTotal: childSum,
      familyTotal: familySum,
      total: childSum + familySum,
    };

    console.log('📊 Результат totals:', {
      childListCount: result.childList.length,
      familyListCount: result.familyList.length,
      childTotal: result.childTotal,
      familyTotal: result.familyTotal
    });

    return result;
  }, [piggies, role]);

  const [ownerFilter, setOwnerFilter] = useState(() => (role === "parent" ? "family" : "child"));
  const [amountModal, setAmountModal] = useState({ open: false, id: null, mode: "deposit" });
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [autoModal, setAutoModal] = useState({ open: false, id: null, initial: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [piggyBackgroundModal, setPiggyBackgroundModal] = useState({ open: false, id: null });
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
  
  const getCurrentBackground = () => {
    const background = BACKGROUNDS.find(bg => bg.id === selectedBackground);
    if (!background) return "from-[#7a44ff] to-[#b35cff]";
    
    if (background.image) {
      return `bg-[url('${background.image}')] bg-cover bg-center`;
    }
    return background.gradient;
  };
  
  const getCurrentPenguin = () => {
    const skin = PENGUIN_SKINS.find(skin => skin.id === selectedSkin);
    return skin ? skin.image : defaultPenguin;
  };

  const getPiggyBackground = (piggy) => {
    // Для родителя всегда темно-синий фон
    if (role === "parent") {
      return "from-blue-900 to-blue-800";
    }
    
    const backgroundId = piggy.background || "default";
    const background = BACKGROUNDS.find(bg => bg.id === backgroundId);
    if (!background) return "from-[#7a44ff] to-[#b35cff]";
    
    if (background.image) {
      // Проверяем, что изображение загружается
      const img = new Image();
      img.onerror = () => console.warn(`Не удалось загрузить изображение: ${background.image}`);
      img.src = background.image;
      return `bg-[url('${background.image}')] bg-cover bg-center`;
    }
    return background.gradient;
  };

  const summaryChips = [
    { label: "Копилки ребёнка", value: fmtRub(totals.childTotal) },
    { label: "Семейные копилки", value: fmtRub(totals.familyTotal) },
    { label: role === "parent" ? "Баланс родителя" : "Баланс карты", value: fmtRub(role === "parent" ? parentCardBalance : cardBalance) },
  ];

  const depositLabel = (owner) => {
    if (role === "parent") {
      return owner === "child" ? "Помочь" : "Пополнить";
    }
    return "Пополнить";
  };

  const moveFunds = (id, mode, rawAmount) => {
    try {
      const amount = clampPositive(rawAmount);
      if (!id || amount <= 0) {
        console.warn('⚠️ Некорректные параметры для moveFunds:', { id, mode, rawAmount });
        return null;
      }

      let transfer = null;

      setState((prev) => {
        try {
          const target = prev.piggies.find((item) => item.id === id);
          if (!target) {
            console.warn('⚠️ Копилка не найдена:', id);
            transfer = { status: "missing" };
            return prev;
          }

          const owner = target.owner === "family" ? "family" : "child";
          if (mode === "withdraw" && role === "parent" && owner === "child") {
            console.warn('⚠️ Родитель не может снимать с детских копилок');
            transfer = { status: "forbidden", piggy: target };
            return prev;
          }

          const currentAmount = Math.max(0, Number(target.amount) || 0);
          // Родитель использует свой баланс, ребенок - свой
          const currentCard = role === "parent" 
            ? Math.max(0, Number(prev.parentCardBalance) || 0)
            : Math.max(0, Number(prev.cardBalance) || 0);
          const goal = Math.max(0, Number(target.goal) || 0);
          const remainingCapacity = goal > 0 ? Math.max(0, goal - currentAmount) : Number.POSITIVE_INFINITY;

          console.log('🔄 moveFunds:', { 
            id, mode, amount, currentAmount, currentCard, goal, remainingCapacity, role 
          });


      if (mode === "withdraw") {
        const actual = Math.min(amount, currentAmount);
        if (actual <= 0) {
          transfer = { status: "empty", piggy: target };
          return prev;
        }
        transfer = { status: "success", type: "withdraw", amount: actual, piggy: target };
        // Деньги возвращаются на карту того, кто снимает
        if (role === "parent") {
          return {
            ...prev,
            parentCardBalance: currentCard + actual,
            piggies: prev.piggies.map((item) =>
              item.id === id ? { ...item, amount: currentAmount - actual } : item
            ),
          };
        } else {
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

      const actual = Math.min(amount, currentCard, remainingCapacity);
      if (actual <= 0) {
        transfer = { status: currentCard <= 0 ? "insufficient" : "full", piggy: target };
        return prev;
      }

      transfer = {
        status: "success",
        type: "deposit",
        amount: actual,
        piggy: target,
        capped: actual < amount,
      };

      // Родитель тратит со своего баланса, ребенок - со своего
      if (role === "parent") {
        return {
          ...prev,
          parentCardBalance: currentCard - actual,
          piggies: prev.piggies.map((item) =>
            item.id === id ? { ...item, amount: currentAmount + actual } : item
          ),
        };
      } else {
        return {
          ...prev,
          cardBalance: currentCard - actual,
          piggies: prev.piggies.map((item) =>
            item.id === id ? { ...item, amount: currentAmount + actual } : item
          ),
        };
      }
      
      return prev;
    } catch (error) {
      console.error('❌ Ошибка в setState moveFunds:', error);
      transfer = { status: "error", error: error.message };
      return prev;
    }
  });

      if (transfer?.status === "insufficient" && typeof window !== "undefined") {
        window.alert("Недостаточно средств на карте");
      }

      if (transfer?.status === "full" && typeof window !== "undefined") {
        window.alert("Цель уже достигла максимальной суммы");
      }

      if (transfer?.status === "success" && transfer.type === "deposit") {
        appendStoredTransaction({
          amount: transfer.amount,
          category: "other",
          note: `                "${transfer.piggy.name || "            "}"`,
        });
        
        // Триггеры миссий
        triggerMission("daily_piggy_deposit", 1);
        triggerMission("weekly_savings", transfer.amount);
      }

      if (transfer?.status === "error") {
        console.error('❌ Ошибка в moveFunds:', transfer.error);
      }

      return transfer;
    } catch (error) {
      console.error('❌ Критическая ошибка в moveFunds:', error);
      return { status: "error", error: error.message };
    }
  };

  const handleQuickAdd = (id, amount) => {
    const res = moveFunds(id, "deposit", amount);
    if (res?.status === "success" && res.type === "deposit") {
      const newly = unlockAchievement("first_piggy_deposit");
      if (newly) {
        appendStoredTransaction({ amount: 30, category: "bonus", note: "Награда: первое пополнение" });
      }
      if (res.amount >= 100) gainXp(10);
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
      
      // Родитель не может снимать с детских копилок
      if (role === "parent" && target.owner === "child") {
        console.log('⚠️ Родитель не может снимать с детских копилок');
        return prev;
      }
      
      const currentAmount = Math.max(0, Number(target.amount) || 0);
      if (currentAmount <= 0) {
        // Нечего выводить — просто удалим копилку
        return {
          ...prev,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      }

      // Деньги возвращаются на карту того, кто снимает
      if (role === "parent") {
        const nextParentCard = Math.max(0, Number(prev.parentCardBalance) || 0) + currentAmount;
        return {
          ...prev,
          parentCardBalance: nextParentCard,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      } else {
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
    console.log(`removePiggy вызван: id=${id}, role=${role}`);
    setState((prev) => {
      const target = prev.piggies.find((p) => p.id === id);
      if (!target) {
        console.log('Копилка не найдена');
        return prev;
      }
      
      // Родитель может удалять только общие копилки, не детские
      if (role === "parent" && target.owner === "child") {
        console.log('⚠️ Родитель не может удалять детские копилки');
        return prev;
      }
      
      const amount = Math.max(0, Number(target.amount) || 0);
      console.log(`Удаление копилки "${target.name}" на сумму ${amount}₽`);
      
      // Деньги возвращаются на карту того, кто удаляет
      if (role === "parent") {
        const nextParentCard = Math.max(0, Number(prev.parentCardBalance) || 0) + amount;
        console.log(`Родитель: баланс ${prev.parentCardBalance}₽ → ${nextParentCard}₽`);
        return {
          ...prev,
          parentCardBalance: nextParentCard,
          piggies: prev.piggies.filter((item) => item.id !== id),
        };
      } else {
        const nextCard = Math.max(0, Number(prev.cardBalance) || 0) + amount;
        console.log(`Ребенок: баланс ${prev.cardBalance}₽ → ${nextCard}₽`);
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
      let parentCardBalance = Math.max(0, Number(prev.parentCardBalance) || 0);
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

        // Определяем какой баланс использовать для автопополнения
        const currentBalance = piggy.owner === "family" ? parentCardBalance : cardBalance;
        
        for (const dayKey of pendingDays) {
          if (currentBalance <= 0) {
            break;
          }
          if (goal > 0 && piggyAmount >= goal) {
            break;
          }
          const capacity = goal > 0 ? Math.max(0, goal - piggyAmount) : Number.POSITIVE_INFINITY;
          const actual = Math.min(amountPerDay, capacity, currentBalance);
          if (actual <= 0) {
            break;
          }
          piggyAmount += actual;
          
          // Списываем с правильного баланса
          if (piggy.owner === "family") {
            parentCardBalance -= actual;
          } else {
            cardBalance -= actual;
          }
          
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
        parentCardBalance,
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

  const creationDisabled = role !== "parent" && ownerFilter === "family";

  const restrictionNote = (() => {
    if (role !== "parent" && ownerFilter === "family") {
      return "Новую общую цель может создать родитель";
    }
    return null;
  })();

  const openCreateModal = () => {
    if (creationDisabled) return;
    // Родитель всегда создает общие копилки, ребенок - свои
    const owner = role === "parent" ? "family" : "child";
    setDraft(initialDraft(owner));
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    try {
      // Родитель может создавать общие копилки, ребенок - только свои
      const owner = role === "parent" ? "family" : "child";
      const name = draft.name.trim();
      
      // Валидация
      if (!name) {
        console.warn('⚠️ Имя копилки не может быть пустым');
        return;
      }
      
      if (name.length > 60) {
        console.warn('⚠️ Имя копилки слишком длинное (максимум 60 символов)');
        return;
      }

      const goal = Math.max(0, Number(draft.goal) || 0);
      if (goal > 1000000) {
        console.warn('⚠️ Цель слишком большая (максимум 1,000,000)');
        return;
      }

      const newPiggy = {
        id: makeId(),
        name,
        goal,
        amount: 0,
        color: draft.color || "#7c3aed",
        background: "default",
        owner,
        createdAt: new Date().toISOString(),
      };

      console.log('🔄 Создание копилки:', newPiggy);

      // Проверяем, что копилка с таким именем не существует
      const existingPiggy = state.piggies.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existingPiggy) {
        console.warn('⚠️ Копилка с таким именем уже существует');
        return;
      }

      // Обновляем состояние
      setState((prev) => {
        const newState = {
          ...prev,
          piggies: [...prev.piggies, newPiggy],
        };
        console.log('✅ Новое состояние:', newState);
        
        // Валидируем новое состояние
        if (!validatePiggyState(newState)) {
          console.error('❌ Некорректное состояние после создания копилки');
          recoverState();
          return prev;
        }
        
        return newState;
      });

      // Триггер миссии для создания первой копилки
      triggerMission("story_first_piggy", 1);

      // Сбрасываем форму
      setDraft(initialDraft(owner));
      setCreateOpen(false);
      
      console.log('✅ Копилка успешно создана');
    } catch (error) {
      console.error('❌ Ошибка при создании копилки:', error);
    }
  };

  const ownerTabs = [
    { key: "child", label: role === "parent" ? "Цели ребёнка" : "Мои цели" },
    { key: "family", label: "Общие цели" },
  ];

  return (
    <div className="mx-auto w-[430px] min-h-screen bg-[#0b0b12] text-white">
      <header
        className="sticky top-0 z-40 flex items-center gap-3 bg-[#0b0b12] px-5 pb-3 shadow-md shadow-black/30"
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

      <section className="px-5">
        
        <div className={`relative min-h-[100px] rounded-[24px] ${getCurrentBackground().startsWith('bg-[url') ? getCurrentBackground() : `bg-gradient-to-r ${getCurrentBackground()}`} px-6 py-6 pr-28 shadow-lg shadow-black/30`}>
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
          <button
            type="button"
            onClick={() => setDesignModal(true)}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/80 transition hover:bg-white/30 hover:text-white"
            title="Дизайн"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          </button>
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
            "rounded-xl py-2 text-sm font-semibold transition-all duration-200",
            autoTopUpActive 
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:from-teal-400 hover:to-cyan-400" 
              : "bg-white/5 text-white/70 border border-white/15 hover:bg-white/10 hover:border-white/25",
          ].join(" ");
          const autoTopUpStateClass = autoTopUpActive
            ? "text-xs font-semibold text-white"
            : "text-xs font-semibold text-white/50";

          return (
            <div key={piggy.id} className={`relative overflow-hidden rounded-[18px] ${getPiggyBackground(piggy).startsWith('bg-[url') ? getPiggyBackground(piggy) : `bg-gradient-to-r ${getPiggyBackground(piggy)}`} p-4 ring-1 ring-white/5`}>
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
                      {editable && role !== "parent" && (
                        <button
                          type="button"
                          onClick={() => setPiggyBackgroundModal({ open: true, id: piggy.id })}
                          className="ml-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white/80 transition-all hover:from-purple-500/30 hover:to-pink-500/30 hover:text-white hover:scale-105 active:scale-95"
                          title="Выбрать фон"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      {editable && !(role === "parent" && piggy.owner === "child") && (
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ open: true, id: piggy.id })}
                          className="ml-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-red-500/20 hover:text-red-300 hover:scale-105 active:scale-95"
                          title="Удалить цель"
                        >
                          <IconTrash className="h-5 w-5" />
                        </button>
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
            {isCompleted && !(role === "parent" && piggy.owner === "child") ? (
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

      {/* Модальное окно дизайна */}
      <Modal open={designModal} onClose={() => setDesignModal(false)} maxWidth="max-w-md">
        <div className="text-lg font-semibold mb-4">Настройка дизайна</div>
        
        {/* Выбор пингвина */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 text-white/80">Выберите пингвина</h3>
          <div className="grid grid-cols-2 gap-3">
            {PENGUIN_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                onClick={() => setSelectedSkin(skin.id)}
                className={`relative rounded-xl p-3 transition-all ${
                  selectedSkin === skin.id 
                    ? "ring-2 ring-fuchsia-500 bg-fuchsia-500/10" 
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <img
                  src={skin.image}
                  alt={skin.label}
                  className="w-full h-16 object-contain mb-2"
                />
                <div className="text-xs font-medium">{skin.label}</div>
                {selectedSkin === skin.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-fuchsia-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Выбор фона */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 text-white/80">Выберите фон</h3>
          <div className="grid grid-cols-2 gap-3">
            {BACKGROUNDS.map((background) => (
              <button
                key={background.id}
                type="button"
                onClick={() => setSelectedBackground(background.id)}
                className={`relative rounded-xl p-3 transition-all ${
                  selectedBackground === background.id 
                    ? "ring-2 ring-fuchsia-500 bg-fuchsia-500/10" 
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`w-full h-16 rounded-lg ${background.image ? `bg-[url('${background.image}')] bg-cover bg-center` : `bg-gradient-to-r ${background.gradient}`} mb-2`} />
                <div className="text-xs font-medium">{background.label}</div>
                {selectedBackground === background.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-fuchsia-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => setDesignModal(false)} 
            className="flex-1 rounded-xl bg-white/10 py-2 font-semibold"
          >
            Готово
          </button>
        </div>
      </Modal>

      {/* Модальное окно выбора фона копилки */}
      <Modal open={piggyBackgroundModal.open} onClose={() => setPiggyBackgroundModal({ open: false, id: null })} maxWidth="max-w-md">
        <div className="text-lg font-semibold mb-4">Выберите фон для копилки</div>
        
        <div className="grid grid-cols-2 gap-3">
          {BACKGROUNDS.map((background) => (
            <button
              key={background.id}
              type="button"
              onClick={() => {
                const piggy = piggies.find(p => p.id === piggyBackgroundModal.id);
                if (piggy) {
                  updatePiggy(piggy.id, { background: background.id });
                }
                setPiggyBackgroundModal({ open: false, id: null });
              }}
              className="relative rounded-xl p-3 transition-all bg-white/5 hover:bg-white/10"
            >
              <div className={`w-full h-20 rounded-lg ${background.image ? `bg-[url('${background.image}')] bg-cover bg-center` : `bg-gradient-to-r ${background.gradient}`} mb-2`} />
              <div className="text-xs font-medium">{background.label}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button 
            type="button" 
            onClick={() => setPiggyBackgroundModal({ open: false, id: null })} 
            className="flex-1 rounded-xl bg-white/10 py-2 font-semibold"
          >
            Отмена
          </button>
        </div>
      </Modal>
    </div>
  );
}












