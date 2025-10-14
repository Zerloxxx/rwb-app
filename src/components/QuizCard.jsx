import { useEffect, useState } from "react";

export default function QuizCard({ question, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  // Сбрасываем выбор и состояние проверки при смене вопроса
  useEffect(() => {
    setSelected(null);
    setChecked(false);
    setIsCorrect(null);
  }, [index, question]);

  const handleSubmit = () => {
    if (selected == null) return;
    const correct = selected === question.answerIndex;
    setChecked(true);
    setIsCorrect(correct);
    onAnswer?.({ correct, selectedIndex: selected });
  };

  const nextDisabled = selected == null || !checked;

  return (
    <div className="rounded-[24px] bg-[#1a1a1f] p-5 text-white shadow-lg shadow-black/25">
      <div className="mb-2 text-xs text-white/70">Вопрос {index + 1} из {total}</div>
      <div className="text-[18px] font-semibold">{question.q}</div>

      <div className="mt-4 space-y-2">
        {question.options.map((opt, i) => {
          const selectedThis = selected === i;
          const correctThis = checked && i === question.answerIndex;
          const wrongThis = checked && selectedThis && !correctThis;
          return (
            <label key={i} className={`flex items-center gap-3 rounded-[14px] border px-3 py-2 text-sm transition ${selectedThis ? "border-white/40 bg-white/10" : "border-white/10 hover:border-white/20"} ${correctThis ? "!border-green-500/50" : ""} ${wrongThis ? "!border-red-500/50" : ""}`}>
              <input
                type="radio"
                name={`q-${index}`}
                checked={selectedThis}
                onChange={() => setSelected(i)}
                className="h-4 w-4"
              />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-[12px] bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
        >
          Ответить
        </button>
        <button
          type="button"
          onClick={() => onAnswer?.({ next: true, selectedIndex: selected, correct: isCorrect })}
          disabled={nextDisabled}
          className={`rounded-[12px] px-4 py-2 text-sm font-semibold ${nextDisabled ? "bg-white/5 text-white/30" : "bg-[#5d2efc] text-white hover:brightness-110"}`}
        >
          Дальше
        </button>
      </div>

      {checked && isCorrect === false && question.hint && (
        <div className="mt-3 rounded-[12px] bg-yellow-500/10 p-3 text-xs text-yellow-200">
          Подсказка пингвина: {question.hint}
        </div>
      )}
    </div>
  );
}


