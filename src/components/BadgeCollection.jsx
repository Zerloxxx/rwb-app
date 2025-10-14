import { useMissions } from "../context/MissionsContext";
import badgesData from "../data/badges.json";

const BadgeCollection = () => {
  const { getEarnedBadges } = useMissions();
  const earnedBadges = getEarnedBadges();
  const earnedBadgeIds = earnedBadges.map(badge => badge.id);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return "border-gray-500/60 bg-gray-700/60";
      case "uncommon":
        return "border-green-500/60 bg-green-700/60";
      case "rare":
        return "border-blue-500/60 bg-blue-700/60";
      case "epic":
        return "border-purple-500/60 bg-purple-700/60";
      case "legendary":
        return "border-yellow-500/60 bg-yellow-700/60";
      default:
        return "border-gray-500/60 bg-gray-700/60";
    }
  };

  const getRarityLabel = (rarity) => {
    switch (rarity) {
      case "common":
        return "Обычный";
      case "uncommon":
        return "Необычный";
      case "rare":
        return "Редкий";
      case "epic":
        return "Эпический";
      case "legendary":
        return "Легендарный";
      default:
        return "Обычный";
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-bold text-white">Коллекция значков</div>
      
      <div className="grid grid-cols-2 gap-3">
        {badgesData.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          
          return (
            <div
              key={badge.id}
              className={`relative overflow-hidden rounded-[14px] border-2 p-4 transition-all ${
                isEarned 
                  ? `${getRarityColor(badge.rarity)}` 
                  : "border-gray-600 bg-gray-800 opacity-50"
              }`}
            >
              {/* Значок */}
              <div className="text-center">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className={`text-sm font-semibold ${isEarned ? "text-white" : "text-gray-400"}`}>
                  {badge.name}
                </div>
                <div className={`text-xs ${isEarned ? "text-white/80" : "text-gray-500"}`}>
                  {badge.description}
                </div>
              </div>

              {/* Редкость */}
              <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
                isEarned 
                  ? "bg-white/20 text-white" 
                  : "bg-gray-600 text-gray-300"
              }`}>
                {getRarityLabel(badge.rarity)}
              </div>

              {/* Статус */}
              {!isEarned && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl opacity-30">🔒</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Статистика */}
      <div className="rounded-[14px] bg-white/5 p-4">
        <div className="text-sm text-white/80">
          Получено значков: <span className="font-semibold text-white">{earnedBadges.length}</span> из <span className="font-semibold text-white">{badgesData.length}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-green-600/80 to-emerald-600/80 transition-all duration-500"
            style={{ width: `${(earnedBadges.length / badgesData.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BadgeCollection;
