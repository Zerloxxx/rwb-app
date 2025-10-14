import { useState } from 'react';
import { useParentLimits } from '../context/ParentLimitsContext';

const formatCurrency = (value) => `${value.toLocaleString()} ₽`;

export default function ParentLimits() {
  const {
    spendingLimits,
    operationPermissions,
    categoryRestrictions,
    whitelist,
    updateSpendingLimits,
    updateOperationPermissions,
    updateCategoryRestrictions,
    updateWhitelist,
    addWhitelistMerchant,
    removeWhitelistMerchant
  } = useParentLimits();

  const [activeTab, setActiveTab] = useState('limits');
  const [newMerchant, setNewMerchant] = useState({ name: '', category: '' });

  const tabs = [
    { key: 'limits', label: 'Лимиты', icon: '💰' },
    { key: 'permissions', label: 'Разрешения', icon: '🔒' },
    { key: 'categories', label: 'Категории', icon: '📂' },
    { key: 'whitelist', label: 'Белый список', icon: '✅' }
  ];

  const categories = [
    { id: 'food', name: 'Еда', icon: '🍎' },
    { id: 'fastfood', name: 'Фастфуд', icon: '🍔' },
    { id: 'games', name: 'Игры', icon: '🎮' },
    { id: 'entertainment', name: 'Развлечения', icon: '🎬' },
    { id: 'education', name: 'Образование', icon: '📚' },
    { id: 'health', name: 'Здоровье', icon: '💊' },
    { id: 'clothing', name: 'Одежда', icon: '👕' },
    { id: 'transport', name: 'Транспорт', icon: '🚌' }
  ];

  const handleAddMerchant = () => {
    if (newMerchant.name.trim()) {
      const merchant = {
        id: Date.now().toString(),
        name: newMerchant.name.trim(),
        category: newMerchant.category || 'other'
      };
      addWhitelistMerchant(merchant);
      setNewMerchant({ name: '', category: '' });
    }
  };

  const renderLimitsTab = () => (
    <div className="space-y-6">
      {/* Общие настройки */}
      <div className="rounded-[18px] bg-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Лимиты трат</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={spendingLimits.enabled}
              onChange={(e) => updateSpendingLimits({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {spendingLimits.enabled && (
          <div className="space-y-4">
            {/* Дневной лимит */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Дневной лимит
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={spendingLimits.dailyLimit}
                  onChange={(e) => updateSpendingLimits({ dailyLimit: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
                  placeholder="500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">₽</span>
              </div>
            </div>

            {/* Недельный лимит */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Недельный лимит
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={spendingLimits.weeklyLimit}
                  onChange={(e) => updateSpendingLimits({ weeklyLimit: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
                  placeholder="2000"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">₽</span>
              </div>
            </div>

            {/* Лимит на одну покупку */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Лимит на одну покупку
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={spendingLimits.singlePurchaseLimit}
                  onChange={(e) => updateSpendingLimits({ singlePurchaseLimit: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
                  placeholder="300"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">₽</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Текущие лимиты */}
      {spendingLimits.enabled && (
        <div className="rounded-[18px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-5">
          <h4 className="text-lg font-semibold mb-3">Текущие лимиты</h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Дневной лимит</span>
              <span className="font-semibold">{formatCurrency(spendingLimits.dailyLimit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Недельный лимит</span>
              <span className="font-semibold">{formatCurrency(spendingLimits.weeklyLimit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Лимит на покупку</span>
              <span className="font-semibold">{formatCurrency(spendingLimits.singlePurchaseLimit)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <div className="rounded-[18px] bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-4">Разрешения операций</h3>
        <div className="space-y-4">
          {Object.entries(operationPermissions).map(([key, value]) => {
            const labels = {
              onlinePurchases: 'Онлайн-покупки',
              atmWithdrawals: 'Снятие наличных в банкомате',
              cardPayments: 'Платежи картой',
              contactlessPayments: 'Бесконтактные платежи',
              internationalPayments: 'Международные платежи'
            };

            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-white/90">{labels[key]}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateOperationPermissions({ [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      {/* Заблокированные категории */}
      <div className="rounded-[18px] bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-4">Заблокированные категории</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const isBlocked = categoryRestrictions.blockedCategories.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => {
                  const newBlocked = isBlocked
                    ? categoryRestrictions.blockedCategories.filter(id => id !== category.id)
                    : [...categoryRestrictions.blockedCategories, category.id];
                  updateCategoryRestrictions({ blockedCategories: newBlocked });
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isBlocked 
                    ? 'bg-red-500/20 border-2 border-red-500/50' 
                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Разрешенные категории */}
      <div className="rounded-[18px] bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-4">Разрешенные категории</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const isAllowed = categoryRestrictions.allowedCategories.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => {
                  const newAllowed = isAllowed
                    ? categoryRestrictions.allowedCategories.filter(id => id !== category.id)
                    : [...categoryRestrictions.allowedCategories, category.id];
                  updateCategoryRestrictions({ allowedCategories: newAllowed });
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isAllowed 
                    ? 'bg-green-500/20 border-2 border-green-500/50' 
                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderWhitelistTab = () => (
    <div className="space-y-6">
      {/* Настройки белого списка */}
      <div className="rounded-[18px] bg-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Белый список магазинов</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={whitelist.enabled}
              onChange={(e) => updateWhitelist({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {whitelist.enabled && (
          <div className="space-y-4">
            {/* Добавить магазин */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMerchant.name}
                onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
                placeholder="Название магазина"
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleAddMerchant}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Добавить
              </button>
            </div>

            {/* Список магазинов */}
            <div className="space-y-2">
              {whitelist.merchants.map((merchant) => (
                <div key={merchant.id} className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                  <div>
                    <div className="font-medium">{merchant.name}</div>
                    <div className="text-sm text-white/60">{merchant.category}</div>
                  </div>
                  <button
                    onClick={() => removeWhitelistMerchant(merchant.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'limits':
        return renderLimitsTab();
      case 'permissions':
        return renderPermissionsTab();
      case 'categories':
        return renderCategoriesTab();
      case 'whitelist':
        return renderWhitelistTab();
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-[430px] min-h-screen bg-[#0b0b12] pb-24 text-white">
      {/* Заголовок */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-[#0b0b12] px-5 py-4 shadow-md shadow-black/30">
        <button 
          type="button" 
          onClick={() => (window.location.hash = "#/parent")} 
          className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          Назад
        </button>
        <div className="text-base font-semibold">Лимиты и разрешения</div>
        <div className="w-16"></div>
      </header>

      {/* Вкладки */}
      <div className="px-5 pt-4">
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



