import { useMissions } from "../context/MissionsContext";

const LevelProgress = () => {
  const { getLevelInfo } = useMissions();
  const levelInfo = getLevelInfo();

  return (
    <div className="rounded-[18px] bg-gradient-to-r from-purple-600/80 to-pink-600/80 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/80">Уровень</div>
          <div className="text-3xl font-bold">{levelInfo.level}</div>
        </div>
        
        <div className="flex-1 mx-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/80">Опыт</span>
            <span className="font-semibold">{levelInfo.current}/{levelInfo.needed} XP</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/20">
            <div 
              className="h-full rounded-full bg-white/90 transition-all duration-500"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-white/80">До следующего</div>
          <div className="text-lg font-bold">{levelInfo.needed - levelInfo.current} XP</div>
        </div>
      </div>
    </div>
  );
};

export default LevelProgress;
