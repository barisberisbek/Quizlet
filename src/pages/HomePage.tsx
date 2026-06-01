import { useEffect, useMemo } from 'react';
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
  GraduationCap,
} from 'lucide-react';
import { useQuizStore } from '../store/quizStore';
import { useUIStore } from '../store/uiStore';
import { storage } from '../services/storage/localStorage';
import { cn } from '../lib/utils';
import type { UserStats } from '../types/progress.types';
import { DEFAULT_STATS } from '../types/progress.types';
import type { QuizMeta } from '../types/quiz.types';

// Ders renk şeması
const COURSE_COLORS: Record<string, { accent: string; bg: string; border: string; dot: string }> = {
  'Dynamic Web Programming': {
    accent: 'text-indigo-400',
    bg:     'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    dot:    'bg-indigo-500',
  },
  'Information Retrieval Systems': {
    accent: 'text-violet-400',
    bg:     'bg-violet-500/10',
    border: 'border-violet-500/20',
    dot:    'bg-violet-500',
  },
};

const DEFAULT_COURSE_COLOR = {
  accent: 'text-slate-400',
  bg:     'bg-slate-500/10',
  border: 'border-slate-500/20',
  dot:    'bg-slate-500',
};

export function HomePage() {
  const navigate = useNavigate();
  const { quizIndex, fetchIndex, indexLoading, sessions, selectQuiz } = useQuizStore();
  const { setSidebarOpen } = useUIStore();

  const stats: UserStats = storage.get<UserStats>('stats') || DEFAULT_STATS;
  const lastQuizId = storage.get<string>('lastOpenedQuizId');

  useEffect(() => {
    if (quizIndex.length === 0 && !indexLoading) {
      fetchIndex();
    }
  }, [quizIndex.length, indexLoading, fetchIndex]);

  const totalQuestions = quizIndex.reduce((sum, q) => sum + q.questionCount, 0);
  const totalAnswered  = stats.totalAnswered;
  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  const lastQuiz = lastQuizId ? quizIndex.find((q) => q.id === lastQuizId) : null;

  // Kursa göre grupla
  const groupedByCourse = useMemo(() => {
    const groups: Record<string, QuizMeta[]> = {};
    for (const q of quizIndex) {
      const course = q.course || 'Dynamic Web Programming';
      if (!groups[course]) groups[course] = [];
      groups[course].push(q);
    }
    return Object.entries(groups);
  }, [quizIndex]);

  const handleContinue = async () => {
    if (lastQuiz) {
      await selectQuiz(lastQuiz);
      navigate(`/quiz/${lastQuiz.id}`);
    }
  };

  const statCards = [
    {
      label: 'Cevaplanan',
      value: totalAnswered,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    {
      label: 'Doğruluk',
      value: `${accuracy}%`,
      icon: Target,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10 border-indigo-400/20',
    },
    {
      label: 'Seri',
      value: `${stats.streakDays} gün`,
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20',
    },
    {
      label: 'Quiz',
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
          <GraduationCap size={12} />
          CS Quiz Platform
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Quiz ile Sınava Hazırlan
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
          Geçmiş sınav sorularını anlık geri bildirim, detaylı açıklamalar ve
          ilerleme takibi ile çalış.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
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
              Devam Et: {lastQuiz.title.slice(0, 24)}{lastQuiz.title.length > 24 ? '…' : ''}
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
              lastQuiz
                ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/25',
              'transition-all duration-200'
            )}
          >
            Quizlere Göz At
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

      {/* Quiz Listesi — Kursa Göre Gruplu */}
      {quizIndex.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Mevcut Quizler</h2>
            <span className="text-xs text-slate-500">{totalQuestions} soru</span>
          </div>

          {groupedByCourse.map(([course, quizzes], groupIdx) => {
            const colors = COURSE_COLORS[course] || DEFAULT_COURSE_COLOR;
            const courseTotal = quizzes.reduce((s, q) => s + q.questionCount, 0);

            return (
              <motion.div
                key={course}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + groupIdx * 0.08 }}
                className="space-y-2"
              >
                {/* Ders başlığı */}
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
                  <h3 className={cn('text-xs font-bold tracking-wide uppercase', colors.accent)}>
                    {course}
                  </h3>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] text-slate-600">{courseTotal} soru</span>
                </div>

                {/* Quiz kartları */}
                <div className="grid gap-2">
                  {quizzes.map((quiz, i) => {
                    const session = sessions[quiz.id];
                    const answeredCount = session ? Object.keys(session.answers).length : 0;
                    const correctCount  = session
                      ? Object.values(session.answers).filter((a) => a.isCorrect).length
                      : 0;
                    const progress = quiz.questionCount > 0
                      ? Math.round((answeredCount / quiz.questionCount) * 100)
                      : 0;

                    return (
                      <motion.button
                        key={quiz.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * i }}
                        onClick={async () => {
                          await selectQuiz(quiz);
                          navigate(`/quiz/${quiz.id}`);
                        }}
                        className={cn(
                          'glass-card p-4 text-left group transition-all',
                          `hover:${colors.border}`
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                                {quiz.title}
                              </h3>
                              {session?.completed && (
                                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{quiz.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-slate-500">
                                {quiz.questionCount} soru
                              </span>
                              {quiz.estimatedMinutes && (
                                <span className="text-[10px] text-slate-500">
                                  ~{quiz.estimatedMinutes} dk
                                </span>
                              )}
                              {answeredCount > 0 && (
                                <span className={cn('text-[10px]', colors.accent)}>
                                  {answeredCount}/{quiz.questionCount} · {correctCount} doğru
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-2 shrink-0">
                            {progress > 0 && (
                              <div className="w-11 h-11 relative">
                                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="oklch(0.25 0.02 250)"
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="oklch(0.55 0.19 250)"
                                    strokeWidth="3"
                                    strokeDasharray={`${progress}, 100`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className={cn('absolute inset-0 flex items-center justify-center text-[9px] font-bold', colors.accent)}>
                                  {progress}%
                                </span>
                              </div>
                            )}
                            <ArrowRight
                              size={14}
                              className={cn('text-slate-600 group-hover:translate-x-0.5 transition-all', `group-hover:${colors.accent}`)}
                            />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          <div className="text-center pt-1">
            <button
              onClick={() => navigate('/stats')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <BarChart3 size={12} />
              Detaylı istatistikler
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
