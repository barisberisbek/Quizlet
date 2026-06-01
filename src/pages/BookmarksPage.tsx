import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkX, ArrowRight, BookOpen } from 'lucide-react';
import { useBookmarkStore } from '../store/bookmarkStore';
import { useQuizStore } from '../store/quizStore';
import { cn } from '../lib/utils';

export function BookmarksPage() {
  const navigate = useNavigate();
  const { bookmarks, removeBookmark, clearAllBookmarks } = useBookmarkStore();
  const { quizIndex, selectQuiz, setCurrentQuestion } = useQuizStore();

  // Quiz'e ve kursa göre grupla
  const grouped = useMemo(() => {
    const groups: Record<string, {
      quizTitle: string;
      quizId: string;
      course: string;
      items: typeof bookmarks;
    }> = {};
    bookmarks.forEach((b) => {
      if (!groups[b.quizId]) {
        const quiz = quizIndex.find((q) => q.id === b.quizId);
        groups[b.quizId] = {
          quizTitle: quiz?.title || b.quizId,
          quizId: b.quizId,
          course: quiz?.course || 'Dynamic Web Programming',
          items: [],
        };
      }
      groups[b.quizId].items.push(b);
    });
    return Object.values(groups);
  }, [bookmarks, quizIndex]);

  const handleGoToQuestion = async (quizId: string, questionId: string) => {
    const meta = quizIndex.find((q) => q.id === quizId);
    if (!meta) return;
    await selectQuiz(meta);
    // Soru indexini bul ve navigate et
    navigate(`/quiz/${quizId}`);
    // Quiz yüklendikten sonra soruya git (basit yaklaşım)
    setTimeout(() => {
      // activeQuiz yüklendikten sonra doğru soruya git
      const { activeQuiz } = useQuizStore.getState();
      if (activeQuiz) {
        const idx = activeQuiz.questions.findIndex(q => q.id === questionId);
        if (idx !== -1) setCurrentQuestion(idx);
      }
    }, 300);
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
            Yer İmleri
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {bookmarks.length} yer imli soru{bookmarks.length !== 1 ? '' : ''}
          </p>
        </div>
        {bookmarks.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Tüm yer imleri silinsin mi?')) clearAllBookmarks();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            <BookmarkX size={13} />
            Tümünü Sil
          </button>
        )}
      </motion.div>

      {bookmarks.length === 0 && (
        <div className="glass-card p-8 text-center">
          <BookOpen size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 mb-1">Henüz yer imi yok</p>
          <p className="text-xs text-slate-500">
            Quiz çözerken soruları yer imleyerek buradan hızlıca tekrar edebilirsin.
          </p>
        </div>
      )}

      {grouped.map((group, gi) => (
        <motion.div
          key={group.quizId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.05 }}
          className="glass-card overflow-hidden"
        >
          {/* Quiz başlığı */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">{group.course}</p>
              <h2 className="text-sm font-semibold text-slate-200 truncate">{group.quizTitle}</h2>
            </div>
            <button
              onClick={() => handleGoToQuestion(group.quizId, group.items[0].questionId)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 ml-3"
            >
              Quizi Aç <ArrowRight size={12} />
            </button>
          </div>

          {/* Bookmark listesi */}
          <div className="divide-y divide-white/5">
            {group.items.map((bookmark) => (
              <div
                key={bookmark.questionId}
                className="px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Soru metni veya ID */}
                    {bookmark.questionSnippet ? (
                      <p className="text-sm text-slate-200 leading-snug line-clamp-2 mb-1.5">
                        {bookmark.questionSnippet.slice(0, 150)}
                        {bookmark.questionSnippet.length > 150 ? '…' : ''}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 font-mono mb-1.5">
                        {bookmark.questionId}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-600">
                        {new Date(bookmark.bookmarkedAt).toLocaleDateString('tr-TR')}
                      </span>
                      <button
                        onClick={() => handleGoToQuestion(bookmark.quizId, bookmark.questionId)}
                        className={cn(
                          'flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors'
                        )}
                      >
                        Soruya git <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeBookmark(bookmark.questionId)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 mt-0.5"
                    aria-label="Yer imini kaldır"
                  >
                    <BookmarkX size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
