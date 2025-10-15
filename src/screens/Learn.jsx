import quizzes from "../data/quizzes.json";
import ProgressBar from "../components/ProgressBar";
import { useCoins } from "../context/CoinsContext";

export default function Learn() {
  const { balance, quizProgress } = useCoins();
  const goto = (path) => (window.location.hash = `#${path}`);

  return (
    <div className="screen-shell mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] pb-24 text-white">
      {/* README: Добавляйте новые темы в src/data/quizzes.json.
         Каждая тема имеет slug, title, level, questions[].
         Прогресс сохраняется в localStorage по ключу rwb_quiz_progress.
         Лучший результат по теме хранится как bestCorrect/total. */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#0b0b12] px-5 pb-4 shadow-md shadow-black/30">
        <button onClick={() => (window.location.hash = "#/")} className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Назад</button>
        <div className="text-base font-semibold">Обучение</div>
        <div className="flex items-center gap-2">
          <button onClick={() => goto('/shop')} className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Магазин</button>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
            <span aria-hidden="true">💰</span>
            <span className="tabular-nums">{balance}</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-4 p-5">
        {quizzes.map((q) => {
          const best = quizProgress?.[q.slug]?.bestCorrect ?? 0;
          const total = q.questions.length;
          const pct = total > 0 ? Math.round((best / total) * 100) : 0;
          return (
            <div key={q.slug} className="rounded-[20px] bg-[#1a1a1f] p-5 shadow-lg shadow-black/25">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[16px] font-semibold">{q.title}</div>
                  <div className="text-xs text-white/60">Уровень: {q.level}</div>
                </div>
                <button onClick={() => goto(`/quiz/${q.slug}`)} className="rounded-[12px] bg-[#5d2efc] px-3 py-2 text-sm font-semibold hover:brightness-110">Начать тест</button>
              </div>
              <div className="mt-3">
                <ProgressBar value={pct} />
                <div className="mt-1 text-right text-xs text-white/60">Лучший результат: {best}/{total} ({pct}%)</div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
