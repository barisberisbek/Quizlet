import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    nextQuestion,
    prevQuestion,
    resetQuizProgress,
  } = useQuizStore();

  const { bookmarks } = useBookmarkStore();
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('normal');
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Load quiz if navigated directly
  useEffect(() => {
    if (!activeQuiz && quizId) {
      // Need to fetch index first if not loaded
      if (quizIndex.length === 0) {
        fetchIndex().then(() => {
          // Will be handled by the next effect
        });
      }
    }
  }, [activeQuiz, quizId, quizIndex.length, fetchIndex]);

  // Select quiz once index is loaded
  useEffect(() => {
    if (!activeQuiz && quizId && quizIndex.length > 0) {
      const meta = quizIndex.find((q) => q.id === quizId);
      if (meta) {
        selectQuiz(meta);
      }
    }
  }, [activeQuiz, quizId, quizIndex, selectQuiz]);

  // Get filtered question indices based on practice mode
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
        return allIndices.filter((i) =>
          wrongQIds.includes(activeQuiz.questions[i].id)
        );
      }

      case 'bookmarked_only': {
        const bookmarkedQIds = bookmarks
          .filter((b) => b.quizId === activeQuiz.meta.id)
          .map((b) => b.questionId);
        return allIndices.filter((i) =>
          bookmarkedQIds.includes(activeQuiz.questions[i].id)
        );
      }

      default:
        return allIndices;
    }
  }, [activeQuiz, practiceMode, shuffledIndices, bookmarks]);

  const handleShuffle = () => {
    if (!activeQuiz) return;
    const indices = shuffle(activeQuiz.questions.map((_, i) => i));
    setShuffledIndices(indices);
    setPracticeMode('shuffled');
    setCurrentQuestion(0);
  };

  const handleReset = () => {
    if (!activeQuiz) return;
    if (window.confirm('Reset all progress for this quiz? This cannot be undone.')) {
      resetQuizProgress(activeQuiz.meta.id);
      window.location.reload();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'card') return;
      if (e.key === 'ArrowRight' || e.key === 'j') nextQuestion();
      if (e.key === 'ArrowLeft' || e.key === 'k') prevQuestion();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, nextQuestion, prevQuestion]);

  // Loading state
  if (quizLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="skeleton h-12 w-64" />
        <div className="skeleton h-2 w-full" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  // Error state
  if (quizError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={40} className="text-rose-400 mb-4" />
        <h2 className="text-lg font-semibold text-rose-300 mb-2">Failed to Load Quiz</h2>
        <p className="text-sm text-slate-400 max-w-md mb-4">{quizError}</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </button>
      </div>
    );
  }

  // No quiz selected
  if (!activeQuiz) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-slate-400">Loading quiz...</p>
      </div>
    );
  }

  const session = sessions[activeQuiz.meta.id];
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const correctCount = session
    ? Object.values(session.answers).filter((a) => a.isCorrect).length
    : 0;
  const totalInView = questionIndices.length;
  const progress = totalInView > 0 ? Math.round((answeredCount / activeQuiz.questions.length) * 100) : 0;

  // Current question for card mode
  const effectiveIndex = questionIndices[currentQuestionIndex] ?? 0;
  const currentQuestion = activeQuiz.questions[effectiveIndex];

  return (
    <div className="space-y-5 py-4">
      {/* Quiz Header */}
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
          Back to Home
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">{activeQuiz.meta.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                getDifficultyColor(activeQuiz.meta.difficulty)
              )}>
                {getDifficultyLabel(activeQuiz.meta.difficulty)}
              </span>
              <span className="text-xs text-slate-500">
                {activeQuiz.questions.length} questions
              </span>
              <span className="text-xs text-slate-500">
                {answeredCount} answered
              </span>
              {correctCount > 0 && (
                <span className="text-xs text-emerald-400">
                  {correctCount} correct
                </span>
              )}
            </div>
          </div>

          {/* View mode & actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => setViewMode('card')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'card'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                aria-label="Card view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                aria-label="List view"
              >
                <List size={14} />
              </button>
            </div>

            <button
              onClick={handleShuffle}
              className={cn(
                'p-1.5 rounded-lg border transition-colors',
                practiceMode === 'shuffled'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
              )}
              aria-label="Shuffle questions"
              title="Shuffle questions"
            >
              <Shuffle size={14} />
            </button>

            <button
              onClick={() => setPracticeMode(practiceMode === 'wrong_only' ? 'normal' : 'wrong_only')}
              className={cn(
                'p-1.5 rounded-lg border transition-colors',
                practiceMode === 'wrong_only'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
              )}
              aria-label="Wrong answers only"
              title="Practice wrong answers"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={() => setPracticeMode(practiceMode === 'bookmarked_only' ? 'normal' : 'bookmarked_only')}
              className={cn(
                'p-1.5 rounded-lg border transition-colors',
                practiceMode === 'bookmarked_only'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
              )}
              aria-label="Bookmarked only"
              title="Practice bookmarked"
            >
              <BookmarkCheck size={14} />
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-white/5 text-slate-500 border border-white/5 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
              aria-label="Reset progress"
              title="Reset quiz progress"
            >
              <RotateCcw size={14} />
            </button>
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
            <span>{practiceMode !== 'normal' ? `${totalInView} questions in view` : ''}</span>
            <span>{progress}% complete</span>
          </div>
        </div>

        {/* Empty mode message */}
        {totalInView === 0 && practiceMode !== 'normal' && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-slate-400 mb-2">
              {practiceMode === 'wrong_only'
                ? 'No wrong answers to practice! 🎉'
                : 'No bookmarked questions in this quiz.'}
            </p>
            <button
              onClick={() => setPracticeMode('normal')}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Switch to normal mode
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
            existingAnswer={session?.answers[currentQuestion.id]}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex <= 0}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                currentQuestionIndex <= 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10'
              )}
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {currentQuestionIndex + 1} / {totalInView}
            </span>

            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= totalInView - 1}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                currentQuestionIndex >= totalInView - 1
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10'
              )}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Question dots */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {questionIndices.map((qIdx, i) => {
              const q = activeQuiz.questions[qIdx];
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
                existingAnswer={session?.answers[q.id]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
