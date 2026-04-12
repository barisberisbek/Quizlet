import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  Flame,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useQuizStore } from '../store/quizStore';
import { useUIStore } from '../store/uiStore';
import { storage } from '../services/storage/localStorage';
import { cn } from '../lib/utils';
import type { UserStats } from '../types/progress.types';
import { DEFAULT_STATS } from '../types/progress.types';

export function HomePage() {
  const navigate = useNavigate();
  const { quizIndex, fetchIndex, indexLoading, sessions, selectQuiz } = useQuizStore();
  const { setSidebarOpen } = useUIStore();

  // Load stats from localStorage
  const stats: UserStats = storage.get<UserStats>('stats') || DEFAULT_STATS;
  const lastQuizId = storage.get<string>('lastOpenedQuizId');

  useEffect(() => {
    if (quizIndex.length === 0 && !indexLoading) {
      fetchIndex();
    }
  }, [quizIndex.length, indexLoading, fetchIndex]);

  const totalQuestions = quizIndex.reduce((sum, q) => sum + q.questionCount, 0);
  const totalAnswered = stats.totalAnswered;
  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  const lastQuiz = lastQuizId ? quizIndex.find((q) => q.id === lastQuizId) : null;

  const handleContinue = async () => {
    if (lastQuiz) {
      await selectQuiz(lastQuiz);
      navigate(`/quiz/${lastQuiz.id}`);
    }
  };

  const handleBrowse = () => {
    setSidebarOpen(true);
  };

  const statCards = [
    {
      label: 'Questions Answered',
      value: totalAnswered,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: Target,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10 border-indigo-400/20',
    },
    {
      label: 'Streak',
      value: `${stats.streakDays} days`,
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20',
    },
    {
      label: 'Quizzes',
      value: quizIndex.length,
      icon: BookOpen,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10 border-violet-400/20',
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium">
          <BookOpen size={12} />
          Dynamic Web Programming
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          DWP Quiz Platform
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
          Practice past exam questions with instant feedback, detailed explanations,
          and progress tracking. Build your confidence for midterms and finals.
        </p>

        <div className="flex justify-center gap-3 pt-2">
          {lastQuiz && (
            <button
              onClick={handleContinue}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
                'bg-indigo-500 text-white hover:bg-indigo-400',
                'shadow-lg shadow-indigo-500/25 transition-all duration-200',
                'hover:shadow-xl hover:shadow-indigo-500/30'
              )}
            >
              <Clock size={14} />
              Continue: {lastQuiz.title}
            </button>
          )}
          <button
            onClick={handleBrowse}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
              lastQuiz
                ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/25',
              'transition-all duration-200'
            )}
          >
            Browse Quizzes
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
            className="glass-card p-4 space-y-2"
          >
            <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center', card.bg)}>
              <card.icon size={14} className={card.color} />
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-[11px] text-slate-500 font-medium">{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Quizzes */}
      {quizIndex.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Available Quizzes</h2>
            <span className="text-xs text-slate-500">{totalQuestions} total questions</span>
          </div>

          <div className="grid gap-2">
            {quizIndex.map((quiz, i) => {
              const session = sessions[quiz.id];
              const answeredCount = session ? Object.keys(session.answers).length : 0;
              const correctCount = session
                ? Object.values(session.answers).filter((a) => a.isCorrect).length
                : 0;
              const progress = Math.round((answeredCount / quiz.questionCount) * 100);

              return (
                <motion.button
                  key={quiz.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
                  onClick={async () => {
                    await selectQuiz(quiz);
                    navigate(`/quiz/${quiz.id}`);
                  }}
                  className="glass-card p-4 text-left group hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                          {quiz.title}
                        </h3>
                        {session?.completed && (
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{quiz.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-500">
                          {quiz.questionCount} questions
                        </span>
                        {quiz.estimatedMinutes && (
                          <span className="text-[10px] text-slate-500">
                            ~{quiz.estimatedMinutes} min
                          </span>
                        )}
                        {answeredCount > 0 && (
                          <span className="text-[10px] text-indigo-400">
                            {answeredCount}/{quiz.questionCount} done · {correctCount} correct
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {progress > 0 && (
                        <div className="w-12 h-12 relative">
                          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="oklch(0.25 0.02 250)"
                              strokeWidth="2.5"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="oklch(0.55 0.19 250)"
                              strokeWidth="2.5"
                              strokeDasharray={`${progress}, 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                            {progress}%
                          </span>
                        </div>
                      )}
                      <ArrowRight
                        size={14}
                        className="text-slate-600 group-hover:text-indigo-400 transition-colors"
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/stats')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <BarChart3 size={12} />
              View detailed stats
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {indexLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      )}
    </div>
  );
}
