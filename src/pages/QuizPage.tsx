import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Shuffle,
  RotateCcw,
  BookmarkCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useQuizStore } from '../store/quizStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import { QuestionCard } from '../components/question/QuestionCard';
import { cn, shuffle, getDifficultyColor, getDifficultyLabel } from '../lib/utils';
import { storage } from '../services/storage/localStorage';
import type { PracticeMode, ViewMode } from '../types/quiz.types';
import type { WrongAnswer } from '../types/progress.types';

export function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const {
    activeQuiz,
    quizLoading,
    quizError,
    quizIndex,
    fetchIndex,
    selectQuiz,
    sessions,
    currentQuestionIndex,
    setCurrentQuestion,
    resetQuizProgress,
  } = useQuizStore();

  const { bookmarks } = useBookmarkStore();

  // viewMode localStorage'dan yükle
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => storage.get<ViewMode>('viewMode') || 'card'
  );
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('normal');
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  // viewMode değişince kaydet
  useEffect(() => {
    storage.set('viewMode', viewMode);
  }, [viewMode]);

  // Direkt navigasyonla gelindiyse quiz yükle
  useEffect(() => {
    if (!activeQuiz && quizId && quizIndex.length === 0) {
      fetchIndex();
    }
  }, [activeQuiz, quizId, quizIndex.length, fetchIndex]);

  useEffect(() => {
    if (!activeQuiz && quizId && quizIndex.length > 0) {
      const meta = quizIndex.find((q) => q.id === quizId);
      if (meta) selectQuiz(meta);
    }
  }, [activeQuiz, quizId, quizIndex, selectQuiz]);

  // Filtreli soru indisleri
  const questionIndices = useMemo(() => {
    if (!activeQuiz) return [];
    const allIndices = activeQuiz.questions.map((_, i) => i);

    switch (practiceMode) {
      case 'shuffled':
        return shuffledIndices.length > 0 ? shuffledIndices : allIndices;

      case 'wrong_only': {
        const wrongAnswers = storage.get<WrongAnswer[]>('wrongAnswers') || [];
        const wrongQIds = wrongAnswers
          .filter((w) => w.quizId === activeQuiz.meta.id && !w.resolved)
          .map((w) => w.questionId);
        return allIndices.filter((i) => wrongQIds.includes(activeQuiz.questions[i].id));
      }

      case 'bookmarked_only': {
        const bookmarkedQIds = bookmarks
          .filter((b) => b.quizId === activeQuiz.meta.id)
          .map((b) => b.questionId);
        return allIndices.filter((i) => bookmarkedQIds.includes(activeQuiz.questions[i].id));
      }

      default:
        return allIndices;
    }
  }, [activeQuiz, practiceMode, shuffledIndices, bookmarks]);

  const totalInView = questionIndices.length;

  const handleShuffle = () => {
    if (!activeQuiz) return;
    setShuffledIndices(shuffle(activeQuiz.questions.map((_, i) => i)));
    setPracticeMode('shuffled');
    setCurrentQuestion(0);
  };

  const handleModeToggle = (mode: PracticeMode) => {
    if (mode === 'shuffled') { handleShuffle(); return; }
    setPracticeMode((prev) => (prev === mode ? 'normal' : mode));
    setCurrentQuestion(0);
  };

  const handleReset = () => {
    if (!activeQuiz) return;
    if (!confirmReset) { setConfirmReset(true); return; }
    resetQuizProgress(activeQuiz.meta.id);
    setConfirmReset(false);
    setPracticeMode('normal');
    setShuffledIndices([]);
    setCurrentQuestion(0);
    window.location.reload();
  };

  // FIX: Klavye navigasyonu — totalInView'a göre sınırla, input odaklanmışsa geçme
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'card') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'j') {
        if (currentQuestionIndex < totalInView - 1) setCurrentQuestion(currentQuestionIndex + 1);
      }
      if (e.key === 'ArrowLeft' || e.key === 'k') {
        if (currentQuestionIndex > 0) setCurrentQuestion(currentQuestionIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentQuestionIndex, totalInView, setCurrentQuestion]);

  // Loading
  if (quizLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="skeleton h-12 w-64" />
        <div className="skeleton h-2 w-full" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (quizError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={40} className="text-rose-400 mb-4" />
        <h2 className="text-lg font-semibold text-rose-300 mb-2">Quiz Yüklenemedi</h2>
        <p className="text-sm text-slate-400 max-w-md mb-4">{quizError}</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={14} />
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (!activeQuiz) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-slate-400">Quiz yükleniyor...</p>
      </div>
    );
  }

  const session      = sessions[activeQuiz.meta.id];
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const correctCount  = session
    ? Object.values(session.answers).filter((a) => a.isCorrect).length
    : 0;
  const progress = activeQuiz.questions.length > 0
    ? Math.round((answeredCount / activeQuiz.questions.length) * 100)
    : 0;

  const effectiveIndex  = questionIndices[currentQuestionIndex] ?? 0;
  const currentQuestion = activeQuiz.questions[effectiveIndex];

  const PRACTICE_MODES: { mode: PracticeMode; label: string; icon: typeof Shuffle }[] = [
    { mode: 'normal',          label: 'Normal',      icon: LayoutGrid },
    { mode: 'shuffled',        label: 'Karıştır',    icon: Shuffle },
    { mode: 'wrong_only',      label: 'Yanlışlar',   icon: RotateCcw },
    { mode: 'bookmarked_only', label: 'Yer İmleri',  icon: BookmarkCheck },
  ];

  return (
    <div className="space-y-5 py-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={12} />
          Ana Sayfa
        </button>

        {/* Başlık + kontroller */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{activeQuiz.meta.title}</h1>
            {activeQuiz.meta.course && (
              <p className="text-[11px] text-slate-500 mt-0.5">{activeQuiz.meta.course}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                getDifficultyColor(activeQuiz.meta.difficulty)
              )}>
                {getDifficultyLabel(activeQuiz.meta.difficulty)}
              </span>
              <span className="text-xs text-slate-500">{activeQuiz.questions.length} soru</span>
              <span className="text-xs text-slate-500">{answeredCount} cevaplandı</span>
              {correctCount > 0 && (
                <span className="text-xs text-emerald-400">{correctCount} doğru</span>
              )}
            </div>
          </div>

          {/* Kontrol satırı */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View mode */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => setViewMode('card')}
                className={cn('p-1.5 rounded-md transition-colors',
                  viewMode === 'card' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                )}
                aria-label="Kart görünümü"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                )}
                aria-label="Liste görünümü"
              >
                <List size={14} />
              </button>
            </div>

            {/* Practice mode pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {PRACTICE_MODES.map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => handleModeToggle(mode)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap',
                    practiceMode === mode
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Reset */}
            <div className="flex items-center gap-1 ml-auto">
              <AnimatePresence mode="wait">
                {confirmReset ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-xs text-rose-400">Emin misin?</span>
                    <button
                      onClick={handleReset}
                      className="px-2 py-1 text-xs rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                    >
                      Evet
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-1 text-xs rounded bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      Hayır
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="reset"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setConfirmReset(true)}
                    className="p-1.5 rounded-lg bg-white/5 text-slate-600 border border-white/5 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
                    title="İlerlemeyi sıfırla"
                    aria-label="İlerlemeyi sıfırla"
                  >
                    <RotateCcw size={13} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span className="hidden md:block text-slate-600 font-mono">← → tuşları ile ilerle</span>
            <span>
              {practiceMode !== 'normal' && `${totalInView} soru görünümde · `}
              {progress}% tamamlandı
            </span>
          </div>
        </div>

        {/* Tamamlanma banner */}
        <AnimatePresence>
          {session?.completed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card p-4 flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5"
            >
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Quiz tamamlandı! 🎉</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {correctCount}/{activeQuiz.questions.length} doğru · %{Math.round((correctCount / activeQuiz.questions.length) * 100)} başarı
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtre boş */}
        {totalInView === 0 && practiceMode !== 'normal' && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-slate-400 mb-2">
              {practiceMode === 'wrong_only'
                ? 'Yanlış cevap yok — tebrikler! 🎉'
                : 'Bu quizde yer imli soru yok.'}
            </p>
            <button
              onClick={() => setPracticeMode('normal')}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Normal moda geç
            </button>
          </div>
        )}
      </motion.div>

      {/* Card View */}
      {viewMode === 'card' && totalInView > 0 && currentQuestion && (
        <div className="space-y-4">
          <QuestionCard
            key={`${currentQuestion.id}-${practiceMode}`}
            question={currentQuestion}
            index={effectiveIndex}
            quizId={activeQuiz.meta.id}
            existingAnswer={
              practiceMode === 'wrong_only'
                ? undefined
                : session?.answers[currentQuestion.id]
            }
          />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentQuestionIndex > 0 && setCurrentQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex <= 0}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl transition-colors min-h-[40px]',
                currentQuestionIndex <= 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 bg-white/5 hover:bg-white/10 border border-white/5'
              )}
            >
              <ChevronLeft size={14} />
              Önceki
            </button>

            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {currentQuestionIndex + 1} / {totalInView}
            </span>

            <button
              onClick={() => currentQuestionIndex < totalInView - 1 && setCurrentQuestion(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex >= totalInView - 1}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl transition-colors min-h-[40px]',
                currentQuestionIndex >= totalInView - 1
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 bg-white/5 hover:bg-white/10 border border-white/5'
              )}
            >
              Sonraki
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Question dots */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {questionIndices.map((qIdx, i) => {
              const q      = activeQuiz.questions[qIdx];
              const answer = session?.answers[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(i)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-[10px] font-bold transition-all duration-150',
                    i === currentQuestionIndex && 'ring-2 ring-indigo-500/50 scale-110',
                    answer?.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                      : answer && !answer.isCorrect
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                      : i === currentQuestionIndex
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'
                  )}
                >
                  {qIdx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && totalInView > 0 && (
        <div className="space-y-4">
          {questionIndices.map((qIdx) => {
            const q = activeQuiz.questions[qIdx];
            return (
              <QuestionCard
                key={`${q.id}-${practiceMode}`}
                question={q}
                index={qIdx}
                quizId={activeQuiz.meta.id}
                existingAnswer={
                  practiceMode === 'wrong_only'
                    ? undefined
                    : session?.answers[q.id]
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
