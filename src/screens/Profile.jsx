import { useMemo, useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { useCoins } from "../context/CoinsContext";
import defaultPenguin from "../assets/penguin.png";
import usePiggyOverview from "../hooks/usePiggyOverview";
import ChildPermissions from "../components/ChildPermissions";

const AVATARS = [
  { id: "penguin_default", label: "Обычный", src: defaultPenguin },
  { id: "penguin_racer", label: "Гонщик", src: "./penguin-racer.png" },
  { id: "penguin_cosmo", label: "Космонавт", src: "./penguin-cosmo.png" },
];

const THEMES = [
  { id: "app_night", label: "Тёмная" },
  { id: "app_wb", label: "WB Фиолет" },
  { id: "app_russ", label: "Russ Голубая" },
  { id: "app_space", label: "Космос" },
];

const LEVEL_TITLES = [
  "Финансовый новичок",
  "Ответственный сберегатель",
  "Маленький инвестор",
  "Юный финансист",
];

function getLevelTitle(level = 1) {
  if (level >= 4) return LEVEL_TITLES[3];
  if (level >= 3) return LEVEL_TITLES[2];
  if (level >= 2) return LEVEL_TITLES[1];
  return LEVEL_TITLES[0];
}

function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full rounded-full bg-white/10" style={{ height: 10 }}>
      <div className="h-full rounded-full bg-[#5d2efc] transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Modal({ open, onClose, children, maxWidth = "max-w-md" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className={`relative w-full ${maxWidth} rounded-2xl bg-[#14141a] p-5 text-white ring-1 ring-white/10`}>{children}</div>
    </div>
  );
}

export default function Profile() {
  const { profile, setAvatar, setMotto, setTheme, setName } = useProfile();
  const { quizProgress, active, setAppTheme } = useCoins();
  const overview = usePiggyOverview();
  const [mottoDraft, setMottoDraft] = useState(profile.motto || "");
  const [nameDraft, setNameDraft] = useState(profile.name || "");
  const [editOpen, setEditOpen] = useState(false);
  const [achvOpen, setAchvOpen] = useState(false);
  const [achvSelected, setAchvSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const currentAvatarSrc = useMemo(() => AVATARS.find((a) => a.id === profile.avatar)?.src || AVATARS[0].src, [profile.avatar]);

  const nextLevelXp = useMemo(() => (profile.level * 100), [profile.level]);
  const currentXpInLevel = useMemo(() => profile.xp % 100, [profile.xp]);
  const progressPct = useMemo(() => Math.round((currentXpInLevel / 100) * 100), [currentXpInLevel]);

  const achievements = [
    {
      id: "first_piggy_deposit",
      icon: "🏅",
      name: "Первое пополнение",
      unlocked: !!profile.achievements.first_piggy_deposit,
      desc: "Ты пополнил копилку впервые!",
      progress: profile.achievements.first_piggy_deposit ? 1 : 0,
      target: 1,
      reward: 30,
    },
    {
      id: "piggy_1000",
      icon: "💰",
      name: "1000 ₽ в копилке",
      unlocked: !!profile.achievements.piggy_1000 || (overview?.childTotal || 0) >= 1000,
      desc: "Отлично! Собрано 1000 ₽ в личных целях.",
      progress: Math.min(1000, Math.max(0, overview?.childTotal || 0)),
      target: 1000,
      reward: 40,
    },
    {
      id: "quiz_perfect_once",
      icon: "🎓",
      name: "Идеальный тест",
      unlocked: !!profile.achievements.quiz_perfect_once,
      desc: "Пройди любой тест на 100%.",
      progress: profile.achievements.quiz_perfect_once ? 1 : 0,
      target: 1,
      reward: 50,
    },
    {
      id: "quizzes_week_complete",
      icon: "📚",
      name: "Все тесты недели",
      unlocked: !!profile.achievements.quizzes_week_complete,
      desc: "Собери серию идеальных прохождений подряд.",
      progress: Math.max(0, quizProgress?.streak || 0),
      target: 3,
      reward: 60,
    },
  ];

  return (
    <div className="screen-shell mx-auto w-full max-w-[430px] min-h-[100svh] bg-[#0b0b12] pb-24 text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#0b0b12] px-5 pb-4 shadow-md shadow-black/30">
        <button type="button" onClick={() => (window.location.hash = "#/")} className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Назад</button>
        <div className="text-base font-semibold">Профиль</div>
        <div className="w-16" />
      </header>

      {/* Контент вкладок */}
      {activeTab === "overview" && (
        <>
          <section className="px-5 pt-36">
            {/* Приветствие и аватар */}
            <div
              className="relative overflow-hidden rounded-[24px] p-5 shadow-lg shadow-black/30"
              style={{
                backgroundImage:
                  (active?.appTheme || profile.theme) === "app_space"
                    ? "url(./profile-space.jpg)"
                    : (active?.appTheme || profile.theme) === "app_russ"
                    ? "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(56,189,248,1) 100%)"
                    : (active?.appTheme || profile.theme) === "app_wb"
                    ? "linear-gradient(90deg, #7a44ff 0%, #b35cff 100%)"
                    : "linear-gradient(90deg, #111827 0%, #1f2937 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/10">
              <img src={currentAvatarSrc} alt="Пингвин" className="h-full w-full object-contain" />
            </div>
            <div className="flex-1">
              <div className="text-[18px] font-semibold">Привет, {profile.name || "друг"}!</div>
              <div className="text-sm text-white/80">{getLevelTitle(profile.level)}</div>
              <div className="mt-2 text-xs text-white/70">{profile.motto}</div>
            </div>
            <button type="button" onClick={() => { setName(profile.name || ""); setMottoDraft(profile.motto || ""); setEditOpen(true); }} className="rounded-[12px] bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">Редактировать</button>
          </div>
          <div className="mt-4">
            <ProgressBar value={progressPct} />
            <div className="mt-1 text-right text-xs text-white/80">До следующего уровня осталось {100 - (currentXpInLevel)} XP</div>
          </div>
        </div>
      </section>

      {/* Вкладки */}
      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
              activeTab === "overview" 
                ? "bg-[#5d2efc] text-white" 
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            <span>👤</span>
            <span>Обзор</span>
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
              activeTab === "permissions" 
                ? "bg-[#5d2efc] text-white" 
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            <span>🔒</span>
            <span>Разрешения</span>
          </button>
        </div>
      </div>

      {/* Миссии */}
      <section className="px-5 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[16px] font-semibold">Миссии</div>
          <button 
            type="button"
            onClick={() => (window.location.hash = "#/missions")}
            className="rounded-[12px] bg-[#5d2efc] px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          >
            Все миссии
          </button>
        </div>
        
        {/* Краткий обзор миссий */}
        <div className="rounded-[18px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Активные миссии</div>
              <div className="text-xs text-white/70">Выполняйте задания для получения наград</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">3</div>
              <div className="text-xs text-white/70">активных</div>
            </div>
          </div>
        </div>
      </section>

      {/* Достижения */}
      <section className="px-5 pt-5">
        <div className="mb-2 text-[16px] font-semibold">Достижения</div>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((a) => (
            <button
              key={a.id}
              onClick={() => { setAchvSelected(a); setAchvOpen(true); }}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-[16px] p-2 text-center text-xs shadow-md ${a.unlocked ? "bg-white/15" : "bg-white/10 hover:bg-white/15"}`}
            >
              <div className={`text-2xl ${a.unlocked ? "opacity-100" : "opacity-80"}`}>{a.icon}</div>
              <div className={`mt-1 ${a.unlocked ? "text-white" : "text-white/80"}`}>{a.name}</div>
            </button>
          ))}
        </div>
      </section>
        </>
      )}

      {/* Вкладка разрешений */}
      {activeTab === "permissions" && (
        <main className="px-5 pt-8">
          <ChildPermissions />
        </main>
      )}

      {/* Редактирование профиля в модалке */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="min-w-0 text-base font-semibold sm:flex-1 sm:text-center">Редактировать профиль</div>
        <div className="mt-3 text-xs text-white/70">Имя</div>
        <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="mt-1 w-full rounded-[12px] bg-white/10 px-3 py-2 text-sm outline-none" placeholder="Имя" />
        <div className="mt-4 text-xs text-white/70">Фраза под именем</div>
        <input value={mottoDraft} onChange={(e) => setMottoDraft(e.target.value)} className="mt-1 w-full rounded-[12px] bg-white/10 px-3 py-2 text-sm outline-none" placeholder="Коплю на самокат!" />
        <div className="mt-4 text-sm text-white/70">Аватар</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {AVATARS.map((v) => (
              <button key={v.id} onClick={() => setAvatar(v.id)} className={`overflow-hidden rounded-[12px] p-1 shadow ${profile.avatar === v.id ? "ring-2 ring-[#5d2efc]" : "ring-0"}`}>
                <div className="aspect-square overflow-hidden rounded-[10px] bg-white/10">
                  <img src={v.src} alt={v.label} className="h-full w-full object-cover" />
                </div>
                <div className="mt-1 text-center text-[10px] text-white/70">{v.label}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm text-white/70">Тема оформления</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => { setTheme(t.id); setAppTheme(t.id); }} className={`rounded-[12px] px-2 py-2 text-center text-xs ${ (active?.appTheme || profile.theme) === t.id ? "bg-[#5d2efc]" : "bg-white/10 hover:bg-white/20"}`}>{t.label}</button>
            ))}
          </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setEditOpen(false)} className="flex-1 rounded-[12px] bg-white/10 px-3 py-2 text-sm font-semibold">Отмена</button>
          <button type="button" onClick={() => { setName(nameDraft); setMotto(mottoDraft); setEditOpen(false); }} className="flex-1 rounded-[12px] bg-[#5d2efc] px-3 py-2 text-sm font-semibold hover:brightness-110">Сохранить</button>
        </div>
      </Modal>

      {/* Модалка прогресса достижения */}
      <Modal open={achvOpen} onClose={() => setAchvOpen(false)}>
        {achvSelected ? (
          <div>
            <div className="text-base font-semibold flex items-center gap-2">
              <span className="text-xl">{achvSelected.icon}</span>
              <span>{achvSelected.name}</span>
            </div>
            <div className="mt-2 text-sm text-white/80">{achvSelected.desc}</div>
            <div className="mt-4">
              <ProgressBar value={Math.round((Math.min(achvSelected.progress, achvSelected.target) / Math.max(1, achvSelected.target)) * 100)} />
              <div className="mt-1 text-right text-xs text-white/70">
                {Math.min(achvSelected.progress, achvSelected.target)} / {achvSelected.target}
              </div>
            </div>
            {achvSelected.unlocked ? (
              <div className="mt-3 rounded-[12px] bg-green-500/15 px-3 py-2 text-xs text-green-200">Награда получена: +{achvSelected.reward} монет</div>
            ) : (
              <div className="mt-3 rounded-[12px] bg-white/5 px-3 py-2 text-xs text-white/70">Заверши задание, чтобы получить +{achvSelected.reward} монет</div>
            )}
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setAchvOpen(false)} className="rounded-[12px] bg-white/10 px-3 py-2 text-sm font-semibold">Понятно</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <section className="pb-28" />
    </div>
  );
}
