import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  ChevronRight,
  X,
  Filter,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useQuizStore } from '../../store/quizStore';
import { useUIStore } from '../../store/uiStore';
import { cn, getDifficultyColor, getDifficultyLabel, formatPercent } from '../../lib/utils';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    quizIndex,
    indexLoading,
    indexError,
    fetchIndex,
    selectQuiz,
    activeQuiz,
    sessions,
  } = useQuizStore();

  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarSearchQuery,
    setSearchQuery,
    sidebarTopicFilter,
    setTopicFilter,
    clearFilters,
  } = useUIStore();

  // Fetch quiz index on mount
  useEffect(() => {
    if (quizIndex.length === 0 && !indexLoading) {
      fetchIndex();
    }
  }, [quizIndex.length, indexLoading, fetchIndex]);

  // Get unique topics from quiz index
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    quizIndex.forEach((q) => q.topics.forEach((t) => topics.add(t)));
    return Array.from(topics).sort();
  }, [quizIndex]);

  // Filter quizzes
  const filteredQuizzes = useMemo(() => {
    return quizIndex.filter((quiz) => {
      const matchesSearch =
        !sidebarSearchQuery ||
        quiz.title.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
        quiz.topic.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
        quiz.tags.some((t) =>
          t.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
        );

      const matchesTopic =
        !sidebarTopicFilter ||
        quiz.topics.includes(sidebarTopicFilter) ||
        quiz.topic === sidebarTopicFilter;

      return matchesSearch && matchesTopic;
    });
  }, [quizIndex, sidebarSearchQuery, sidebarTopicFilter]);

  const handleSelectQuiz = async (quiz: typeof quizIndex[0]) => {
    await selectQuiz(quiz);
    navigate(`/quiz/${quiz.id}`);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const getQuizProgress = (quizId: string, questionCount: number) => {
    const session = sessions[quizId];
    if (!session) return { answered: 0, correct: 0, percent: 0 };
    const answered = Object.keys(session.answers).length;
    const correct = Object.values(session.answers).filter((a) => a.isCorrect).length;
    return { answered, correct, percent: Math.round((answered / questionCount) * 100) };
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-0 left-0 z-50 h-full w-72 flex flex-col',
              'bg-[var(--color-surface-1)] border-r border-white/5',
              'md:z-30'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <BookOpen size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-100 tracking-tight">DWP Quiz</h1>
                  <p className="text-[10px] text-slate-500 font-medium">Study Platform</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors md:hidden"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-3 border-b border-white/5 space-y-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={sidebarSearchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-8 pr-3 py-2 text-xs rounded-lg',
                    'bg-white/5 border border-white/5',
                    'text-slate-200 placeholder-slate-500',
                    'focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20',
                    'transition-colors'
                  )}
                />
              </div>

              {/* Topic filter chips */}
              {allTopics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sidebarTopicFilter && (
                    <button
                      onClick={() => clearFilters()}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full hover:bg-indigo-500/30 transition-colors"
                    >
                      <Filter size={10} />
                      {sidebarTopicFilter}
                      <X size={10} />
                    </button>
                  )}
                  {!sidebarTopicFilter && (
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                      {allTopics.slice(0, 8).map((topic) => (
                        <button
                          key={topic}
                          onClick={() => setTopicFilter(topic)}
                          className="px-2 py-0.5 text-[10px] font-medium bg-white/5 text-slate-400 border border-white/5 rounded-full hover:bg-white/10 hover:text-slate-300 transition-colors"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quiz list */}
            <div className="flex-1 overflow-y-auto py-2">
              {indexLoading && (
                <div className="px-4 py-8 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-16 mx-1" />
                  ))}
                </div>
              )}

              {indexError && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-rose-400 mb-2">Failed to load quizzes</p>
                  <p className="text-xs text-slate-500 mb-3">{indexError}</p>
                  <button
                    onClick={() => fetchIndex()}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!indexLoading && !indexError && filteredQuizzes.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-slate-400">No quizzes found</p>
                  {sidebarSearchQuery && (
                    <button
                      onClick={() => clearFilters()}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {filteredQuizzes.map((quiz) => {
                const isActive = activeQuiz?.meta.id === quiz.id || location.pathname.includes(quiz.id);
                const progress = getQuizProgress(quiz.id, quiz.questionCount);

                return (
                  <button
                    key={quiz.id}
                    onClick={() => handleSelectQuiz(quiz)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 mx-1 mb-0.5 rounded-lg transition-all duration-150',
                      'hover:bg-white/5 group',
                      isActive && 'bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15'
                    )}
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {progress.answered === quiz.questionCount && progress.answered > 0 ? (
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          ) : progress.answered > 0 ? (
                            <Circle size={13} className="text-amber-400 shrink-0" />
                          ) : null}
                          <p
                            className={cn(
                              'text-xs font-semibold truncate',
                              isActive ? 'text-indigo-300' : 'text-slate-200'
                            )}
                          >
                            {quiz.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">
                            {quiz.questionCount} questions
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-medium px-1.5 py-0 rounded border',
                              getDifficultyColor(quiz.difficulty)
                            )}
                          >
                            {getDifficultyLabel(quiz.difficulty)}
                          </span>
                        </div>
                        {/* Progress bar */}
                        {progress.answered > 0 && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500/60 transition-all duration-300"
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {formatPercent(progress.answered, quiz.questionCount)}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight
                        size={14}
                        className={cn(
                          'shrink-0 mt-1 transition-colors',
                          isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer stats */}
            <div className="px-4 py-3 border-t border-white/5 bg-[var(--color-surface-0)]">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{quizIndex.length} quizzes</span>
                <span>
                  {quizIndex.reduce((sum, q) => sum + q.questionCount, 0)} questions
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
