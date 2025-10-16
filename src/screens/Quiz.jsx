import { useEffect, useMemo, useRef, useState } from "react";
import quizzes from "../data/quizzes.json";
import QuizCard from "../components/QuizCard";
import ResultModal from "../components/ResultModal";
import { useCoins } from "../context/CoinsContext";
import { useProfile } from "../context/ProfileContext";
import { useMissions } from "../context/MissionsContext";

export default function Quiz() {
  const [slug, setSlug] = useState("");
  useEffect(() => {
    const parse = () => {
      const m = (window.location.hash || "").match(/#\/quiz\/(.+)/);
      setSlug(m ? decodeURIComponent(m[1]) : "");
    };
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);
  const { addCoins, quizProgress, updateQuizResult } = useCoins();
  const { unlockAchievement, gainXp } = useProfile();
  const { triggerMission } = useMissions();

  const quiz = useMemo(() => quizzes.find((q) => q.slug === slug), [slug]);
  const total = quiz?.questions?.length ?? 0;
  const prevBest = quizProgress?.[slug]?.bestCorrect ?? 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [coinsAwarded, setCoinsAwarded] = useState(0);
  const [perfectBonus, setPerfectBonus] = useState(false);
  const [streakBonus, setStreakBonus] = useState(false);
  const finishedOnceRef = useRef(false);

  if (!quiz) return null;

  const handleAnswer = ({ correct }) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = Boolean(correct);
      return next;
    });
  };

  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  const finish = () => {
    if (finishedOnceRef.current) {
      return; // защита от повторного начисления за один забег
    }
    const correctCount = answers.filter(Boolean).length;

    // анти-фарм логика
    const wasPerfect = prevBest === total;
    let baseCoinsPerCorrect = wasPerfect ? 2 : 10;
    let deltaCorrect = correctCount;
    let perfectNow = false;
    let streakNow = false;

    if (!wasPerfect) {
      // Платим только за улучшение результата по сравнению с лучшим
      deltaCorrect = Math.max(0, correctCount - prevBest);
    }

    let coins = deltaCorrect * baseCoinsPerCorrect;
    if (!wasPerfect) {
      if (correctCount === total) {
        coins += 20; // perfect bonus
        perfectNow = true;
      }
    }

    updateQuizResult(slug, correctCount, total);

    // streak bonus читаем ПОСЛЕ updateQuizResult через состояние? Упростим: посчитаем локально
    const prevStreak = quizProgress?.streak ?? 0;
    const nextStreak = correctCount === total ? prevStreak + 1 : 0;
    if (nextStreak > 0 && nextStreak % 3 === 0) {
      coins += 30;
      streakNow = true;
    }

    setPerfectBonus(perfectNow);
    setStreakBonus(streakNow);
    setCoinsAwarded(coins);
    if (coins > 0) addCoins(coins);
    if (correctCount === total) {
      const newly = unlockAchievement("quiz_perfect_once");
      gainXp(50);
      if (newly) addCoins(50);
    } else if (deltaCorrect > 0) {
      gainXp(10);
    }
    
    // Триггеры миссий
    triggerMission("daily_quiz_complete", 1);
    triggerMission("story_first_quiz", 1);
    
    // Проверяем серию побед для еженедельной миссии
    const currentStreak = quizProgress?.streak || 0;
    if (correctCount >= Math.ceil(total * 0.8)) {
      triggerMission("weekly_quiz_streak", 1);
    }
    
    setShowResult(true);
    finishedOnceRef.current = true;
  };

  const restart = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setShowResult(false);
    setCoinsAwarded(0);
    setPerfectBonus(false);
    setStreakBonus(false);
    finishedOnceRef.current = false;
  };

  const warningPerfectFarm = prevBest === total;

  return (
    <div className="screen-shell mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] pb-24 text-white">
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#0b0b12] px-5 pb-4 shadow-md shadow-black/30">
        <button type="button" onClick={() => (window.location.hash = "#/learn")} className="rounded-[12px] bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Назад</button>
        <div className="text-base font-semibold">{quiz.title}</div>
        <div className="w-16" />
      </header>

      <main className="space-y-4 p-5 pt-30">
        {warningPerfectFarm ? (
          <div className="rounded-[12px] bg-yellow-500/10 p-3 text-xs text-yellow-200">
            Этот тест уже пройден на 100%. Повторное прохождение даёт урезанные монеты.
          </div>
        ) : null}

        <QuizCard
          key={currentIndex} // форсируем перемонтирование при переходе к следующему вопросу
          question={quiz.questions[currentIndex]}
          index={currentIndex}
          total={total}
          onAnswer={(payload) => {
            if (typeof payload.correct === "boolean") handleAnswer(payload);
            if (payload.next) {
              if (currentIndex === total - 1) finish();
              else goNext();
            }
          }}
        />

      </main>

      <ResultModal
        open={showResult}
        correct={answers.filter(Boolean).length}
        total={total}
        coins={coinsAwarded}
        perfectBonus={perfectBonus}
        streakBonus={streakBonus}
        onRetry={restart}
        onShop={() => (window.location.hash = "#/shop")}
        onClose={restart}
      />
    </div>
  );
}
