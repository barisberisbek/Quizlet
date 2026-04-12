import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkX, ArrowRight, BookOpen } from 'lucide-react';
import { useBookmarkStore } from '../store/bookmarkStore';
import { useQuizStore } from '../store/quizStore';


export function BookmarksPage() {
  const navigate = useNavigate();
  const { bookmarks, removeBookmark, clearAllBookmarks } = useBookmarkStore();
  const { quizIndex, selectQuiz } = useQuizStore();

  // Group bookmarks by quiz
  const grouped = useMemo(() => {
    const groups: Record<string, { quizTitle: string; quizId: string; items: typeof bookmarks }> = {};
    bookmarks.forEach((b) => {
      if (!groups[b.quizId]) {
        const quiz = quizIndex.find((q) => q.id === b.quizId);
        groups[b.quizId] = {
          quizTitle: quiz?.title || b.quizId,
          quizId: b.quizId,
          items: [],
        };
      }
      groups[b.quizId].items.push(b);
    });
    return Object.values(groups);
  }, [bookmarks, quizIndex]);

  const handleGoToQuiz = async (quizId: string) => {
    const meta = quizIndex.find((q) => q.id === quizId);
    if (meta) {
      await selectQuiz(meta);
      navigate(`/quiz/${quizId}`);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bookmark size={20} className="text-amber-400" />
            Bookmarks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {bookmarks.length} bookmarked question{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
        {bookmarks.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all bookmarks?')) clearAllBookmarks();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            <BookmarkX size={13} />
            Clear All
          </button>
        )}
      </motion.div>

      {bookmarks.length === 0 && (
        <div className="glass-card p-8 text-center">
          <BookOpen size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 mb-1">No bookmarks yet</p>
          <p className="text-xs text-slate-500">
            Bookmark questions while taking quizzes to review them later.
          </p>
        </div>
      )}

      {grouped.map((group) => (
        <motion.div
          key={group.quizId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h2 className="text-sm font-semibold text-slate-200">{group.quizTitle}</h2>
            <button
              onClick={() => handleGoToQuiz(group.quizId)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open Quiz <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {group.items.map((bookmark) => (
              <div
                key={bookmark.questionId}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <p className="text-xs text-slate-300 font-mono">{bookmark.questionId}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Bookmarked {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeBookmark(bookmark.questionId)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  aria-label="Remove bookmark"
                >
                  <BookmarkX size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
