import { create } from 'zustand';
import { storage } from '../services/storage/localStorage';
import type { Bookmark } from '../types/progress.types';

// ── Bookmark Store ────────────────────────────────────────────
interface BookmarkState {
  bookmarks: Bookmark[];
  isBookmarked: (questionId: string) => boolean;
  toggleBookmark: (questionId: string, quizId: string) => void;
  removeBookmark: (questionId: string) => void;
  getBookmarksForQuiz: (quizId: string) => Bookmark[];
  clearAllBookmarks: () => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: storage.get<Bookmark[]>('bookmarks') || [],

  isBookmarked: (questionId: string) => {
    return get().bookmarks.some((b) => b.questionId === questionId);
  },

  toggleBookmark: (questionId: string, quizId: string) => {
    const bookmarks = [...get().bookmarks];
    const index = bookmarks.findIndex((b) => b.questionId === questionId);

    if (index >= 0) {
      bookmarks.splice(index, 1);
    } else {
      bookmarks.push({
        questionId,
        quizId,
        bookmarkedAt: Date.now(),
      });
    }

    set({ bookmarks });
    storage.set('bookmarks', bookmarks);
  },

  removeBookmark: (questionId: string) => {
    const bookmarks = get().bookmarks.filter((b) => b.questionId !== questionId);
    set({ bookmarks });
    storage.set('bookmarks', bookmarks);
  },

  getBookmarksForQuiz: (quizId: string) => {
    return get().bookmarks.filter((b) => b.quizId === quizId);
  },

  clearAllBookmarks: () => {
    set({ bookmarks: [] });
    storage.set('bookmarks', []);
  },
}));
