export default function Education({ onBack }) {
  return (
    <div className="screen-shell screen-shell--compact mx-auto w-full max-w-[430px] min-h-screen bg-[#0b0b12] text-white">
      <header
        className="sticky-header sticky-header--tight flex items-center justify-between bg-[#0b0b12] px-5 pb-4 shadow-md shadow-black/30"
      >
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-white/10 px-3 py-2 text-sm"
          aria-label="Назад"
        >
          Назад
        </button>
        <div className="text-base font-semibold">Обучение</div>
        <div className="w-14" />
      </header>

      <main className="space-y-4 px-5 py-5">
        <section className="rounded-[24px] bg-[#1a1a1f] p-5 shadow-lg shadow-black/20">
          <div className="text-[18px] font-semibold">Финансовая грамотность</div>
          <div className="mt-2 text-sm text-white/70">
            Здесь появятся задания и материалы для обучения обращению с деньгами.
          </div>
        </section>
        <section className="rounded-[24px] bg-[#1a1a1f] p-5 shadow-lg shadow-black/20">
          <div className="text-[16px] font-semibold">Скоро</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
            <li>Как копить на цели</li>
            <li>Как планировать траты</li>
            <li>Что такое кэшбэк и скидки</li>
          </ul>
        </section>
      </main>
    </div>
  );
}



