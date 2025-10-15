import { useState } from "react";
import { useMissions } from "../context/MissionsContext";
import MissionCard from "../components/MissionCard";
import LevelProgress from "../components/LevelProgress";
import BadgeCollection from "../components/BadgeCollection";

const TABS = [
  { key: "active", label: "Активные" },
  { key: "completed", label: "Выполненные" },
  { key: "badges", label: "Значки" }
];

export default function Missions() {
  const { getActiveMissions, getCompletedMissions } = useMissions();
  const [activeTab, setActiveTab] = useState("active");

  const activeMissions = getActiveMissions();
  const completedMissions = getCompletedMissions();

  const getTabContent = () => {
    switch (activeTab) {
      case "active":
        return (
          <div className="space-y-4">
            {activeMissions.length === 0 ? (
              <div className="rounded-[18px] bg-white/5 p-6 text-center text-white/70">
                <div className="text-4xl mb-2">🎯</div>
                <div>Нет активных миссий</div>
                <div className="text-sm mt-1">Выполняйте действия в приложении, чтобы получить новые миссии!</div>
              </div>
            ) : (
              activeMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))
            )}
          </div>
        );
      
      case "completed":
        return (
          <div className="space-y-4">
            {completedMissions.length === 0 ? (
              <div className="rounded-[18px] bg-white/5 p-6 text-center text-white/70">
                <div className="text-4xl mb-2">🏆</div>
                <div>Пока нет выполненных миссий</div>
                <div className="text-sm mt-1">Выполните первую миссию, чтобы увидеть её здесь!</div>
              </div>
            ) : (
              completedMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))
            )}
          </div>
        );
      
      case "badges":
        return <BadgeCollection />;
      
      default:
        return null;
    }
  };

  return (
    <div className="screen-shell mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] pb-24 text-white">
      {/* Заголовок */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#0b0b12] px-5 pb-4 shadow-md shadow-black/30">
        <button 
          type="button" 
          onClick={() => (window.location.hash = "#/profile")} 
          className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          Назад
        </button>
        <div className="text-base font-semibold">Миссии</div>
        <div className="w-16"></div>
      </header>

      {/* Прогресс уровня */}
        <div className="px-5 pt-28">
        <LevelProgress />
      </div>

      {/* Вкладки */}
        <div className="px-5 pt-28">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key 
                  ? "bg-[#5d2efc] text-white" 
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <main className="px-5 pt-4">
        {getTabContent()}
      </main>
    </div>
  );
}

