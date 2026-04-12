import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  CheckCircle2,
  XCircle,
  Flame,
  BookOpen,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { storage } from '../services/storage/localStorage';
import { cn, formatPercent } from '../lib/utils';
import type { UserStats } from '../types/progress.types';
import { DEFAULT_STATS } from '../types/progress.types';

export function StatsPage() {
  const stats: UserStats = storage.get<UserStats>('stats') || DEFAULT_STATS;

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  const topicEntries = useMemo(() => {
    return Object.values(stats.topicStats).sort((a, b) => b.answered - a.answered);
  }, [stats.topicStats]);

  const handleExport = () => {
    const data = {
      sessions: storage.get('sessions'),
      bookmarks: storage.get('bookmarks'),
      wrongAnswers: storage.get('wrongAnswers'),
      stats: storage.get('stats'),
      preferences: storage.get('preferences'),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dwp-quiz-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.sessions) storage.set('sessions', data.sessions);
          if (data.bookmarks) storage.set('bookmarks', data.bookmarks);
          if (data.wrongAnswers) storage.set('wrongAnswers', data.wrongAnswers);
          if (data.stats) storage.set('stats', data.stats);
          if (data.preferences) storage.set('preferences', data.preferences);
          window.location.reload();
        } catch {
          alert('Invalid file format. Please use a valid DWP Quiz export file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset ALL progress? This cannot be undone.')) {
      storage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-400" />
          Statistics
        </h1>
        <p className="text-xs text-slate-500 mt-1">Track your progress and performance</p>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          {
            label: 'Total Answered',
            value: stats.totalAnswered,
            icon: BookOpen,
            color: 'text-indigo-400',
            bg: 'bg-indigo-400/10 border-indigo-400/20',
          },
          {
            label: 'Correct',
            value: stats.totalCorrect,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10 border-emerald-400/20',
          },
          {
            label: 'Incorrect',
            value: stats.totalWrong,
            icon: XCircle,
            color: 'text-rose-400',
            bg: 'bg-rose-400/10 border-rose-400/20',
          },
          {
            label: 'Accuracy',
            value: `${accuracy}%`,
            icon: Target,
            color: 'text-violet-400',
            bg: 'bg-violet-400/10 border-violet-400/20',
          },
        ].map((card) => (
          <div key={card.label} className="glass-card p-4 space-y-2">
            <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center', card.bg)}>
              <card.icon size={14} className={card.color} />
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-[11px] text-slate-500 font-medium">{card.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <Flame size={18} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200">Practice Streak</h2>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-amber-400">{stats.streakDays}</span>
          <span className="text-sm text-slate-500">consecutive days</span>
        </div>
        {stats.lastPracticeDate && (
          <p className="text-[10px] text-slate-600 mt-1">
            Last practiced: {stats.lastPracticeDate}
          </p>
        )}
      </motion.div>

      {/* Per-topic Performance */}
      {topicEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">Performance by Topic</h2>
          </div>

          <div className="space-y-3">
            {topicEntries.map((topic) => {
              const topicAccuracy = topic.answered > 0
                ? Math.round((topic.correct / topic.answered) * 100)
                : 0;

              return (
                <div key={topic.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">{topic.topic}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500">
                        {topic.correct}/{topic.answered}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-bold',
                          topicAccuracy >= 80
                            ? 'text-emerald-400'
                            : topicAccuracy >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        )}
                      >
                        {formatPercent(topic.correct, topic.answered)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        topicAccuracy >= 80
                          ? 'bg-emerald-500'
                          : topicAccuracy >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      )}
                      style={{ width: `${topicAccuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {stats.totalAnswered === 0 && (
        <div className="glass-card p-8 text-center">
          <BarChart3 size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 mb-1">No stats yet</p>
          <p className="text-xs text-slate-500">
            Start answering quiz questions to see your performance here.
          </p>
        </div>
      )}

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-5"
      >
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Data Management</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 border border-white/5 transition-colors"
          >
            <Download size={13} />
            Export Progress
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 border border-white/5 transition-colors"
          >
            <Upload size={13} />
            Import Progress
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <Trash2 size={13} />
            Reset All Progress
          </button>
        </div>
      </motion.div>
    </div>
  );
}
