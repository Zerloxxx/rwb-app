import { useEffect, useMemo, useState } from "react";
import Home from "./screens/Home";
import ParentHome from "./screens/ParentHome";
import Piggy from "./screens/Piggy";
import Spends from "./screens/Spends";
import Learn from "./screens/Learn";
import Quiz from "./screens/Quiz";
import Shop from "./screens/Shop";
import Profile from "./screens/Profile";
import Card from "./screens/Card";
import Missions from "./screens/Missions";
import ParentLimits from "./screens/ParentLimits";
import ParentMissions from "./screens/ParentMissions";
import RoleSwitcherModal from "./components/RoleSwitcherModal";
import { CoinsProvider, useCoins } from "./context/CoinsContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AutosaveProvider } from "./context/AutosaveContext";
import { MissionsProvider } from "./context/MissionsContext";
import { ParentLimitsProvider } from "./context/ParentLimitsContext";

const ROLE_STORAGE_KEY = "wbkids.role.v1";
const DEFAULT_ROLE = "child";

function readRole() {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_ROLE;
  }
  try {
    const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ROLE;
    }
    if (raw === "child" || raw === "parent") {
      return raw;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.role === "child" || parsed?.role === "parent") {
      return parsed.role;
    }
  } catch {
    // ignore malformed values
  }
  return DEFAULT_ROLE;
}

function AppInner() {
  const [role, setRole] = useState(() => readRole());
  const [screen, setScreen] = useState("home");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const { active } = useCoins();

  useEffect(() => {
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify({ role }));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [role]);

  const openRoleModal = () => setRoleModalOpen(true);
  const closeRoleModal = () => setRoleModalOpen(false);

  const handleRoleSelect = (nextRole) => {
    if (nextRole === role) {
      closeRoleModal();
      return;
    }
    setRole(nextRole);
    // Не сбрасываем экран при смене роли, чтобы пользователь остался на том же экране
    closeRoleModal();
  };

  const goto = (nextScreen) => setScreen(nextScreen);

  // hash-router
  useEffect(() => {
    const syncFromHash = () => {
      const h = window.location.hash || "";
      if (h.startsWith("#/learn")) setScreen("learn");
      else if (h.startsWith("#/profile")) setScreen("profile");
      else if (h.startsWith("#/missions")) setScreen("missions");
      else if (h.startsWith("#/parent/limits")) setScreen("parent-limits");
      else if (h.startsWith("#/parent/missions")) setScreen("parent-missions");
      else if (h.startsWith("#/quiz/")) setScreen("quiz");
      else if (h.startsWith("#/shop")) setScreen("shop");
      else if (h.startsWith("#/card")) setScreen("card");
      else if (h.startsWith("#/spends")) setScreen("spends");
      else if (h.startsWith("#/piggy")) setScreen("piggy");
      else setScreen("home");
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  let content = null;

  switch (screen) {
    case "piggy":
      content = (
        <Piggy
          role={role}
          onBack={() => setScreen("home")}
          onOpenRoleModal={openRoleModal}
        />
      );
      break;
    case "spends":
      content = <Spends role={role} onBack={() => setScreen("home")} />;
      break;
    case "learn":
      content = <Learn />;
      break;
    case "quiz":
      content = <Quiz />;
      break;
    case "shop":
      content = <Shop />;
      break;
    case "card":
      content = <Card onBack={() => setScreen("home")} role={role} />;
      break;
    case "profile":
      content = <Profile />;
      break;
    case "missions":
      content = <Missions />;
      break;
    case "parent-limits":
      content = <ParentLimits />;
      break;
    case "parent-missions":
      content = <ParentMissions />;
      break;
    default:
      content =
        role === "parent" ? (
          <ParentHome goto={goto} role={role} onOpenRoleModal={openRoleModal} />
        ) : (
          <Home goto={goto} role={role} onOpenRoleModal={openRoleModal} />
        );
  }

  // apply active app theme
  useEffect(() => {
    const body = document.body;
    body.classList.remove("app-day", "app-night", "app-wb", "app-russ");
    if (active?.appTheme === "app_day") body.classList.add("app-day");
    if (active?.appTheme === "app_night") body.classList.add("app-night");
    if (active?.appTheme === "app_wb") body.classList.add("app-wb");
    if (active?.appTheme === "app_russ") body.classList.add("app-russ");
  }, [active]);

  return (
    <>
      {content}
      <RoleSwitcherModal
        open={roleModalOpen}
        currentRole={role}
        onClose={closeRoleModal}
        onSelectRole={handleRoleSelect}
      />
    </>
  );
}

export default function App() {
  return (
    <CoinsProvider>
      <ProfileProvider>
        <MissionsProvider>
          <ParentLimitsProvider>
            <AutosaveProvider>
              <AppInner />
            </AutosaveProvider>
          </ParentLimitsProvider>
        </MissionsProvider>
      </ProfileProvider>
    </CoinsProvider>
  );
}



