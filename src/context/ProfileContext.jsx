import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "wbkids.profile.v1";

const DEFAULT_STATE = {
  xp: 0,
  level: 1,
  motto: "Коплю на мечту!",
  name: "Я",
  avatar: "penguin_default",
  theme: "app_night", // app_day | app_night | app_wb | app_russ
  achievements: {
    first_topup: false,
    piggy_1000: false,
    quizzes_week_complete: false,
    quiz_perfect_once: false,
    first_piggy_deposit: false,
    first_piggy_delete: false,
  },
};

function readState() {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, achievements: { ...DEFAULT_STATE.achievements, ...(parsed?.achievements || {}) } };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => readState());

  useEffect(() => writeState(profile), [profile]);

  const gainXp = useCallback((amount) => {
    setProfile((p) => {
      const nextXp = Math.max(0, Math.floor((p.xp || 0) + (amount || 0)));
      // Simple level curve: each level needs 100 XP
      const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);
      return { ...p, xp: nextXp, level: nextLevel };
    });
  }, []);

  const setMotto = useCallback((text) => setProfile((p) => ({ ...p, motto: (text || "").toString().slice(0, 60) })), []);
  const setAvatar = useCallback((id) => setProfile((p) => ({ ...p, avatar: id })), []);
  const setTheme = useCallback((id) => setProfile((p) => ({ ...p, theme: id })), []);
  const setName = useCallback((text) => setProfile((p) => ({ ...p, name: (text || "").toString().slice(0, 24) })), []);

  const unlockAchievement = useCallback((key) => {
    let changed = false;
    setProfile((p) => {
      const already = !!p?.achievements?.[key];
      changed = !already;
      if (already) return p;
      return { ...p, achievements: { ...p.achievements, [key]: true } };
    });
    return changed;
  }, []);

  const value = useMemo(() => ({ profile, gainXp, setMotto, setAvatar, setTheme, setName, unlockAchievement }), [profile, gainXp, setMotto, setAvatar, setTheme, setName, unlockAchievement]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}


