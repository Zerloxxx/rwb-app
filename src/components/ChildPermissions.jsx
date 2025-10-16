import { useParentLimits } from '../context/ParentLimitsContext';

const formatCurrency = (value) => `${value.toLocaleString()} ₽`;

export default function ChildPermissions() {
  const {
    spendingLimits,
    operationPermissions,
    categoryRestrictions,
    whitelist
  } = useParentLimits();

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

  const getCategoryName = (categoryId) => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  const getCategoryIcon = (categoryId) => {
    return categories.find(cat => cat.id === categoryId)?.icon || '📦';
  };

  return (
    <div className="space-y-6">
      {/* Лимиты трат */}
      {spendingLimits.enabled && (
        <div className="rounded-[18px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Лимиты трат
          </h3>
          <div className="space-y-3">
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

      {/* Разрешения операций */}
      <div className="rounded-[18px] bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          Разрешения операций
        </h3>
        <div className="space-y-3">
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
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  value 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {value ? 'Разрешено' : 'Запрещено'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Заблокированные категории */}
      {categoryRestrictions.blockedCategories.length > 0 && (
        <div className="rounded-[18px] bg-red-600/20 p-5 border border-red-500/30">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🚫</span>
            Заблокированные категории
          </h3>
          <div className="flex flex-wrap gap-2">
            {categoryRestrictions.blockedCategories.map((categoryId) => (
              <div key={categoryId} className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-xl border border-red-500/30">
                <span className="text-lg">{getCategoryIcon(categoryId)}</span>
                <span className="text-sm font-medium">{getCategoryName(categoryId)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Разрешенные категории */}
      {categoryRestrictions.allowedCategories.length > 0 && (
        <div className="rounded-[18px] bg-green-600/20 p-5 border border-green-500/30">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            Разрешенные категории
          </h3>
          <div className="flex flex-wrap gap-2">
            {categoryRestrictions.allowedCategories.map((categoryId) => (
              <div key={categoryId} className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-xl border border-green-500/30">
                <span className="text-lg">{getCategoryIcon(categoryId)}</span>
                <span className="text-sm font-medium">{getCategoryName(categoryId)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Белый список магазинов */}
      {whitelist.enabled && whitelist.merchants.length > 0 && (
        <div className="rounded-[18px] bg-blue-600/20 p-5 border border-blue-500/30">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            Белый список магазинов
          </h3>
          <div className="space-y-2">
            {whitelist.merchants.map((merchant) => (
              <div key={merchant.id} className="flex items-center gap-3 px-3 py-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <span className="text-lg">🏪</span>
                <div>
                  <div className="font-medium">{merchant.name}</div>
                  <div className="text-xs text-white/70">{getCategoryName(merchant.category)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информационное сообщение */}
      <div className="rounded-[18px] bg-white/5 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <div className="font-semibold mb-1">О лимитах и разрешениях</div>
            <div className="text-sm text-white/80">
              Эти настройки установлены родителем для вашей безопасности. 
              Если вам нужно что-то купить, что превышает лимиты, обратитесь к родителям за разрешением.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









