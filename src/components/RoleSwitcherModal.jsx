const ROLE_OPTIONS = [
  {
    id: "child",
    title: "Ребёнок",
    subtitle: "Игровой интерфейс",
    description: "Смотреть баланс копилок, цели и траты",
  },
  {
    id: "parent",
    title: "Родитель",
    subtitle: "Управление семьёй",
    description: "Пополнять карту, помогать с целями и следить за тратами",
  },
];

export default function RoleSwitcherModal({ open, onClose, currentRole, onSelectRole }) {
  if (!open) {
    return null;
  }

  const activeTitle = currentRole === "parent" ? "Родитель" : "Ребёнок";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-[90%] max-w-md rounded-3xl bg-[#14141a] p-6 text-white shadow-2xl ring-1 ring-white/10">
        <div className="text-[20px] font-semibold">Выберите профиль</div>
        <div className="mt-1 text-sm text-white/70">Сейчас активен режим «{activeTitle}»</div>
        <div className="mt-5 space-y-3">
          {ROLE_OPTIONS.map((role) => {
            const active = role.id === currentRole;
            return (
              <button
                type="button"
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className={`w-full rounded-2xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 ${
                  active
                    ? "border-fuchsia-400/60 bg-fuchsia-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[18px] font-semibold text-white">{role.title}</div>
                    <div className="text-sm text-white/70">{role.subtitle}</div>
                  </div>
                  {active && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">Сейчас</span>
                  )}
                </div>
                <div className="mt-3 text-sm text-white/70">{role.description}</div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-white/10 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
