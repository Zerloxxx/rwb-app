import { useState } from 'react';
import { useMissions } from '../context/MissionsContext';
import { transferParentToChild } from '../utils/piggyStorage';

export default function ParentMissions() {
  const { 
    getActiveMissions, 
    getCompletedMissions, 
    getLevelInfo,
    createCustomMission,
    completeMission,
    isMissionCompleted
  } = useMissions();

  const [activeTab, setActiveTab] = useState('overview');
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    target: 1,
    reward: { type: 'money', amount: 100 },
    xp: 0,
    deadline: ''
  });

  const tabs = [
    { key: 'overview', label: 'Обзор', icon: '📊' },
    { key: 'active', label: 'Активные', icon: '🎯' },
    { key: 'completed', label: 'Выполненные', icon: '✅' },
    { key: 'create', label: 'Создать', icon: '➕' }
  ];

  const activeMissions = getActiveMissions();
  const completedMissions = getCompletedMissions();
  const levelInfo = getLevelInfo();

  const handleCreateMission = () => {
    if (newMission.title.trim() && newMission.description.trim()) {
      const mission = {
        id: `custom_${Date.now()}`,
        type: 'custom',
        title: newMission.title.trim(),
        description: newMission.description.trim(),
        target: newMission.target,
        reward: newMission.reward,
        xp: newMission.xp,
        deadline: newMission.deadline,
        icon: '🎁',
        createdBy: 'parent',
        createdAt: new Date().toISOString()
      };

      createCustomMission(mission);
      setNewMission({
        title: '',
        description: '',
        target: 1,
        reward: { type: 'money', amount: 100 },
        xp: 0,
        deadline: ''
      });
      setActiveTab('active'); // Переключаемся на вкладку активных миссий
    }
  };

  const handleRewardMission = async (missionId) => {
    // Находим миссию для получения информации о награде
    const allMissions = [...getActiveMissions(), ...getCompletedMissions()];
    const mission = allMissions.find(m => m.id === missionId);
    
    if (!mission) {
      console.error('Миссия не найдена:', missionId);
      return;
    }

    console.log('🎁 Награждение миссии:', mission);
    
    // Выполняем миссию
    const success = completeMission(missionId);
    if (success) {
      // Если награда - деньги, переводим их с карты родителя на карту ребенка
      if (mission.reward.type === 'money') {
        const transferSuccess = await transferParentToChild(mission.reward.amount);
        if (transferSuccess) {
          console.log(`✅ Переведено ${mission.reward.amount}₽ с карты родителя на карту ребенка`);
        } else {
          console.error('❌ Ошибка перевода денег');
        }
      }
      
      console.log(`✅ Миссия ${missionId} выполнена родителем!`);
    } else {
      console.error('❌ Ошибка выполнения миссии');
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Статистика ребенка */}
      <div className="rounded-[18px] bg-gradient-to-r from-purple-600/80 to-pink-600/80 p-6">
        <h3 className="text-lg font-semibold mb-4">Прогресс ребенка</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{levelInfo.level}</div>
            <div className="text-sm text-white/80">Уровень</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{levelInfo.current} XP</div>
            <div className="text-sm text-white/80">Опыт</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>До следующего уровня</span>
            <span>{levelInfo.needed - levelInfo.current} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/90 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Сводка миссий */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[18px] bg-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{activeMissions.length}</div>
          <div className="text-sm text-white/80">Активных миссий</div>
        </div>
        <div className="rounded-[18px] bg-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{completedMissions.length}</div>
          <div className="text-sm text-white/80">Выполнено</div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="rounded-[18px] bg-white/5 p-5">
        <h4 className="text-lg font-semibold mb-4">Быстрые действия</h4>
        <div className="space-y-3">
          <button
            onClick={() => setActiveTab('create')}
            className="w-full flex items-center gap-3 p-3 bg-blue-600/20 rounded-xl hover:bg-blue-600/30 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <div className="text-left">
              <div className="font-medium">Создать миссию</div>
              <div className="text-sm text-white/70">Назначить задание ребенку</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className="w-full flex items-center gap-3 p-3 bg-green-600/20 rounded-xl hover:bg-green-600/30 transition-colors"
          >
            <span className="text-2xl">🎯</span>
            <div className="text-left">
              <div className="font-medium">Проверить прогресс</div>
              <div className="text-sm text-white/70">Посмотреть активные миссии</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => (
    <div className="space-y-4">
      {activeMissions.length === 0 ? (
        <div className="rounded-[18px] bg-white/5 p-6 text-center text-white/70">
          <div className="text-4xl mb-2">🎯</div>
          <div>Нет активных миссий</div>
          <div className="text-sm mt-1">Создайте миссию для ребенка!</div>
        </div>
      ) : (
        activeMissions.map((mission) => (
          <div key={mission.id} className="rounded-[18px] bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{mission.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white/80">
                      {mission.type === 'custom' ? 'Родительская' : 
                       mission.type === 'daily' ? 'Ежедневная' :
                       mission.type === 'weekly' ? 'Еженедельная' : 'Сюжетная'}
                    </div>
                    <div className="text-lg font-bold">{mission.title}</div>
                  </div>
                </div>
                <div className="text-sm text-white/90 mb-3">{mission.description}</div>
                
                {/* Прогресс */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">Прогресс</span>
                    <span className="font-semibold">{mission.progress || 0}/{mission.target}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/80 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((mission.progress || 0) / mission.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Награда */}
                <div className="flex items-center gap-2 text-sm">
                  <span>Награда:</span>
                  <span className="font-semibold">
                    {mission.reward.type === 'money' ? `${mission.reward.amount} ₽` :
                     mission.reward.type === 'coins' ? `${mission.reward.amount} монет` :
                     mission.reward.type === 'badge' ? 'Значок' :
                     mission.reward.type === 'skin' ? 'Скин' : 'Награда'}
                  </span>
                  {mission.xp > 0 && <span className="text-white/70">+{mission.xp} XP</span>}
                </div>
              </div>

              {/* Кнопка награждения */}
              {(mission.progress || 0) >= mission.target && !isMissionCompleted(mission.id) && (
                <button
                  onClick={() => handleRewardMission(mission.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Наградить
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCompletedTab = () => (
    <div className="space-y-4">
      {completedMissions.length === 0 ? (
        <div className="rounded-[18px] bg-white/5 p-6 text-center text-white/70">
          <div className="text-4xl mb-2">🏆</div>
          <div>Пока нет выполненных миссий</div>
          <div className="text-sm mt-1">Ребенок еще не выполнил ни одной миссии</div>
        </div>
      ) : (
        completedMissions.map((mission) => (
          <div key={mission.id} className="rounded-[18px] bg-green-600/20 p-4 border border-green-500/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <div className="text-lg font-bold">{mission.title}</div>
                <div className="text-sm text-white/90 mb-2">{mission.description}</div>
                <div className="text-sm text-green-400">
                  Выполнено {new Date(mission.completedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCreateTab = () => (
    <div className="space-y-6">
      <div className="rounded-[18px] bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-4">Создать миссию для ребенка</h3>
        
        <div className="space-y-4">
          {/* Название миссии */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Название миссии
            </label>
            <input
              type="text"
              value={newMission.title}
              onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
              placeholder="Например: Отложи 100 ₽ в копилку"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Описание
            </label>
            <textarea
              value={newMission.description}
              onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
              placeholder="Подробное описание задания..."
              rows={3}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Цель */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Цель (количество)
            </label>
            <input
              type="number"
              value={newMission.target}
              onChange={(e) => setNewMission({ ...newMission, target: parseInt(e.target.value) || 1 })}
              min="1"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Награда */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Награда
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newMission.reward.type}
                onChange={(e) => setNewMission({ 
                  ...newMission, 
                  reward: { ...newMission.reward, type: e.target.value }
                })}
                className="rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:border-blue-500 focus:outline-none"
              >
                <option value="money">Деньги</option>
              </select>
              <input
                type="number"
                value={newMission.reward.amount}
                onChange={(e) => setNewMission({ 
                  ...newMission, 
                  reward: { ...newMission.reward, amount: parseInt(e.target.value) || 0 }
                })}
                min="1"
                placeholder="Количество"
                className="rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* XP отключён для миссий от родителя */}

          {/* Срок выполнения */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Срок выполнения (необязательно)
            </label>
            <input
              type="date"
              value={newMission.deadline}
              onChange={(e) => setNewMission({ ...newMission, deadline: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Кнопка создания */}
          <button
            onClick={handleCreateMission}
            disabled={!newMission.title.trim() || !newMission.description.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Создать миссию {(!newMission.title.trim() || !newMission.description.trim()) && "(заполните поля)"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'active':
        return renderActiveTab();
      case 'completed':
        return renderCompletedTab();
      case 'create':
        return renderCreateTab();
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
          onClick={() => (window.location.hash = "#/parent")} 
          className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          Назад
        </button>
        <div className="text-base font-semibold">Миссии ребенка</div>
        <div className="w-16"></div>
      </header>

      {/* Вкладки */}
        <div className="px-5 pt-28">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.key 
                  ? "bg-[#5d2efc] text-white" 
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <main className="px-5 pt-4">
        {renderTabContent()}
      </main>
    </div>
  );
}

