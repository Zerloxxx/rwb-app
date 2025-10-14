import { createContext, useContext, useReducer, useEffect } from "react";
import missionsData from "../data/missions.json";
import badgesData from "../data/badges.json";

const MISSIONS_STORAGE_KEY = "wbkids_missions_progress";
const BADGES_STORAGE_KEY = "wbkids_badges_earned";

const MissionsContext = createContext();

// Начальное состояние
const initialState = {
  missions: missionsData,
  customMissions: [],
  progress: {},
  completedMissions: {},
  earnedBadges: [],
  level: 1,
  xp: 0,
  totalXp: 0,
  dailyReset: null,
  weeklyReset: null
};

// Функции для работы с localStorage
const loadMissionsState = () => {
  try {
    const stored = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to load missions state:", error);
  }
  return {
    progress: {},
    completedMissions: {},
    customMissions: [],
    level: 1,
    xp: 0,
    totalXp: 0,
    dailyReset: null,
    weeklyReset: null
  };
};

const saveMissionsState = (state) => {
  try {
    localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify({
      progress: state.progress,
      completedMissions: state.completedMissions,
      customMissions: state.customMissions,
      level: state.level,
      xp: state.xp,
      totalXp: state.totalXp,
      dailyReset: state.dailyReset,
      weeklyReset: state.weeklyReset
    }));
  } catch (error) {
    console.warn("Failed to save missions state:", error);
  }
};

const loadBadgesState = () => {
  try {
    const stored = localStorage.getItem(BADGES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to load badges state:", error);
  }
  return [];
};

const saveBadgesState = (badges) => {
  try {
    localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(badges));
  } catch (error) {
    console.warn("Failed to save badges state:", error);
  }
};

// Функции для работы с миссиями
const calculateLevel = (totalXp) => {
  return Math.floor(totalXp / 100) + 1;
};

const getXpForLevel = (level) => {
  return (level - 1) * 100;
};

const getXpProgress = (totalXp) => {
  const level = calculateLevel(totalXp);
  const currentLevelXp = totalXp - getXpForLevel(level);
  const xpNeeded = 100;
  return {
    level,
    current: currentLevelXp,
    needed: xpNeeded,
    progress: (currentLevelXp / xpNeeded) * 100
  };
};

const shouldResetDaily = (lastReset) => {
  if (!lastReset) return true;
  const today = new Date().toDateString();
  return lastReset !== today;
};

const shouldResetWeekly = (lastReset) => {
  if (!lastReset) return true;
  const now = new Date();
  const lastResetDate = new Date(lastReset);
  const daysDiff = Math.floor((now - lastResetDate) / (1000 * 60 * 60 * 24));
  return daysDiff >= 7;
};

// Reducer для управления состоянием
const missionsReducer = (state, action) => {
  switch (action.type) {
    case "LOAD_STATE":
      return {
        ...state,
        ...action.payload
      };

    case "UPDATE_PROGRESS":
      const { missionId, progress } = action.payload;
      return {
        ...state,
        progress: {
          ...state.progress,
          [missionId]: progress
        }
      };

    case "COMPLETE_MISSION":
      const { mission, reward } = action.payload;
      const newCompletedMissions = {
        ...state.completedMissions,
        [mission.id]: {
          completedAt: new Date().toISOString(),
          reward
        }
      };

      // Добавляем XP
      const newTotalXp = state.totalXp + mission.xp;
      const newLevel = calculateLevel(newTotalXp);
      const newXp = newTotalXp - getXpForLevel(newLevel);

      // Если награда - значок, добавляем его
      let newEarnedBadges = state.earnedBadges;
      if (reward.type === "badge" && !state.earnedBadges.includes(reward.id)) {
        newEarnedBadges = [...state.earnedBadges, reward.id];
        saveBadgesState(newEarnedBadges);
      }

      return {
        ...state,
        completedMissions: newCompletedMissions,
        totalXp: newTotalXp,
        level: newLevel,
        xp: newXp,
        earnedBadges: newEarnedBadges
      };

    case "RESET_DAILY":
      const dailyMissions = state.missions.filter(m => m.type === "daily");
      const newProgress = { ...state.progress };
      const newDailyCompletedMissions = { ...state.completedMissions };
      
      dailyMissions.forEach(mission => {
        delete newProgress[mission.id];
        delete newDailyCompletedMissions[mission.id];
      });

      return {
        ...state,
        progress: newProgress,
        completedMissions: newDailyCompletedMissions,
        dailyReset: new Date().toDateString()
      };

    case "RESET_WEEKLY":
      const weeklyMissions = state.missions.filter(m => m.type === "weekly");
      const newWeeklyProgress = { ...state.progress };
      const newWeeklyCompletedMissions = { ...state.completedMissions };
      
      weeklyMissions.forEach(mission => {
        delete newWeeklyProgress[mission.id];
        delete newWeeklyCompletedMissions[mission.id];
      });

      return {
        ...state,
        progress: newWeeklyProgress,
        completedMissions: newWeeklyCompletedMissions,
        weeklyReset: new Date().toISOString()
      };

    case "CREATE_CUSTOM_MISSION":
      console.log('🔄 Reducer: CREATE_CUSTOM_MISSION', {
        currentCustomMissions: state.customMissions.length,
        newMission: action.payload
      });
      const newState = {
        ...state,
        customMissions: [...state.customMissions, action.payload]
      };
      console.log('✅ Reducer: Миссия добавлена, всего кастомных миссий:', newState.customMissions.length);
      return newState;

    default:
      return state;
  }
};

export const MissionsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(missionsReducer, initialState);

  // Загружаем состояние при инициализации
  useEffect(() => {
    const savedState = loadMissionsState();
    const savedBadges = loadBadgesState();
    
    dispatch({
      type: "LOAD_STATE",
      payload: {
        ...savedState,
        earnedBadges: savedBadges
      }
    });
  }, []);

  // Сохраняем состояние при изменениях
  useEffect(() => {
    saveMissionsState(state);
  }, [state.progress, state.completedMissions, state.level, state.xp, state.totalXp, state.dailyReset, state.weeklyReset]);

  // Проверяем необходимость сброса ежедневных и еженедельных миссий
  useEffect(() => {
    if (shouldResetDaily(state.dailyReset)) {
      dispatch({ type: "RESET_DAILY" });
    }
    if (shouldResetWeekly(state.weeklyReset)) {
      dispatch({ type: "RESET_WEEKLY" });
    }
  }, [state.dailyReset, state.weeklyReset]);

  // Функции для работы с миссиями
  const updateMissionProgress = (missionId, progress) => {
    dispatch({
      type: "UPDATE_PROGRESS",
      payload: { missionId, progress }
    });
  };

  const completeMission = (missionId) => {
    const mission = state.missions.find(m => m.id === missionId);
    if (!mission) return false;

    const currentProgress = state.progress[missionId] || 0;
    if (currentProgress < mission.target) return false;

    // Проверяем, не выполнена ли уже миссия
    if (state.completedMissions[missionId]) return false;

    dispatch({
      type: "COMPLETE_MISSION",
      payload: {
        mission,
        reward: mission.reward
      }
    });

    return true;
  };

  const getMissionProgress = (missionId) => {
    return state.progress[missionId] || 0;
  };

  const isMissionCompleted = (missionId) => {
    return !!state.completedMissions[missionId];
  };

  const getActiveMissions = () => {
    const allMissions = [...state.missions, ...state.customMissions];
    console.log('📊 getActiveMissions:', {
      regularMissions: state.missions.length,
      customMissions: state.customMissions.length,
      totalMissions: allMissions.length,
      customMissionsList: state.customMissions.map(m => ({ id: m.id, title: m.title, type: m.type }))
    });
    
    const activeMissions = allMissions.filter(mission => {
      if (mission.oneTime && state.completedMissions[mission.id]) {
        return false;
      }
      return true;
    });
    
    console.log('📊 Активные миссии:', activeMissions.length);
    return activeMissions;
  };

  const getCompletedMissions = () => {
    const allMissions = [...state.missions, ...state.customMissions];
    return allMissions.filter(mission => state.completedMissions[mission.id]);
  };

  const getEarnedBadges = () => {
    return badgesData.filter(badge => state.earnedBadges.includes(badge.id));
  };

  const getLevelInfo = () => {
    return getXpProgress(state.totalXp);
  };

  const triggerMission = (missionId, amount = 1) => {
    const mission = state.missions.find(m => m.id === missionId);
    if (!mission) return;

    const currentProgress = state.progress[missionId] || 0;
    const newProgress = Math.min(currentProgress + amount, mission.target);
    
    updateMissionProgress(missionId, newProgress);

    // Автоматически завершаем миссию, если цель достигнута
    if (newProgress >= mission.target && !state.completedMissions[missionId]) {
      completeMission(missionId);
    }
  };

  const createCustomMission = (mission) => {
    console.log('🔄 Создание кастомной миссии:', mission);
    dispatch({ type: "CREATE_CUSTOM_MISSION", payload: mission });
    console.log('✅ Кастомная миссия создана');
  };

  const value = {
    // Состояние
    missions: state.missions,
    customMissions: state.customMissions,
    progress: state.progress,
    completedMissions: state.completedMissions,
    earnedBadges: state.earnedBadges,
    level: state.level,
    xp: state.xp,
    totalXp: state.totalXp,
    
    // Функции
    updateMissionProgress,
    completeMission,
    createCustomMission,
    getMissionProgress,
    isMissionCompleted,
    getActiveMissions,
    getCompletedMissions,
    getEarnedBadges,
    getLevelInfo,
    triggerMission
  };

  return (
    <MissionsContext.Provider value={value}>
      {children}
    </MissionsContext.Provider>
  );
};

export const useMissions = () => {
  const context = useContext(MissionsContext);
  if (!context) {
    throw new Error("useMissions must be used within a MissionsProvider");
  }
  return context;
};
