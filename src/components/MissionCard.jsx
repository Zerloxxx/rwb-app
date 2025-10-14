import { useMissions } from "../context/MissionsContext";
import { useCoins } from "../context/CoinsContext";
import { transferParentToChild } from "../utils/piggyStorage";

const MissionCard = ({ mission }) => {
  const { 
    getMissionProgress, 
    isMissionCompleted, 
    completeMission,
    triggerMission 
  } = useMissions();
  const { balance, buyReward } = useCoins();

  const progress = getMissionProgress(mission.id);
  const completed = isMissionCompleted(mission.id);
  const progressPercent = Math.min((progress / mission.target) * 100, 100);

  const handleClaimReward = () => {
    if (completed) return;
    
    const success = completeMission(mission.id);
    if (success) {
      // Деньги переводим с карты родителя на карту ребёнка
      if (mission.reward.type === "money") {
        transferParentToChild(mission.reward.amount || 0);
      } else if (mission.reward.type === "coins") {
        // Монеты остаются как внутренняя валюта
        console.log(`Получено ${mission.reward.amount} монет!`);
      }
    }
  };

  const getRewardIcon = () => {
    switch (mission.reward.type) {
      case "coins":
        return "💰";
      case "badge":
        return "🏆";
      case "skin":
        return "🎨";
      default:
        return "🎁";
    }
  };

  const getRewardText = () => {
    switch (mission.reward.type) {
      case "coins":
        return `${mission.reward.amount} монет`;
      case "badge":
        return "Значок";
      case "skin":
        return "Скин";
      default:
        return "Награда";
    }
  };

  const getTypeColor = () => {
    switch (mission.type) {
      case "daily":
        return "from-green-600/80 to-emerald-700/80";
      case "weekly":
        return "from-blue-600/80 to-cyan-700/80";
      case "story":
        return "from-purple-600/80 to-pink-700/80";
      case "custom":
        return "from-amber-700/80 to-orange-800/80";
      default:
        return "from-gray-600/80 to-gray-700/80";
    }
  };

  const getTypeLabel = () => {
    switch (mission.type) {
      case "daily":
        return "Ежедневная";
      case "weekly":
        return "Еженедельная";
      case "story":
        return "Сюжетная";
      case "custom":
        return "От родителя";
      default:
        return "Миссия";
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-[18px] bg-gradient-to-r ${getTypeColor()} p-4 text-white shadow-lg`}>
      {/* Заголовок миссии */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mission.icon}</span>
            <div>
              <div className="text-sm font-medium text-white/80">{getTypeLabel()}</div>
              <div className="text-lg font-bold">{mission.title}</div>
            </div>
          </div>
          <div className="mt-1 text-sm text-white/90">{mission.description}</div>
        </div>
        
        {/* Награда */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-2xl">{getRewardIcon()}</div>
          <div className="text-xs font-medium text-white/80">{getRewardText()}</div>
          <div className="text-xs text-white/70">+{mission.xp} XP</div>
        </div>
      </div>

      {/* Прогресс */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">Прогресс</span>
          <span className="font-semibold">{progress}/{mission.target}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
          <div 
            className="h-full rounded-full bg-white/80 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Кнопка получения награды */}
      {progress >= mission.target && !completed && (
        <div className="mt-4">
          <button
            onClick={handleClaimReward}
            className="w-full rounded-xl bg-white/20 px-4 py-3 font-semibold text-white transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
          >
            🎉 Забрать награду
          </button>
        </div>
      )}

      {/* Статус выполнения */}
      {completed && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3">
          <span className="text-xl">✅</span>
          <span className="font-semibold">Миссия выполнена!</span>
        </div>
      )}
    </div>
  );
};

export default MissionCard;
