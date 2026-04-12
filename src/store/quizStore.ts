import { create } from 'zustand';
import type { Quiz, QuizMeta, PracticeMode, ViewMode } from '../types/quiz.types';
import type { UserAnswer, QuizSession } from '../types/progress.types';
import { loadQuizIndex, loadQuiz } from '../services/quizzes/loader';
import { storage } from '../services/storage/localStorage';
import { getTodayDate } from '../lib/utils';

// ── State Shape ───────────────────────────────────────────────
interface QuizState {
  // Index
  quizIndex: QuizMeta[];
  indexLoading: boolean;
  indexError: string | null;

  // Active quiz
  activeQuiz: Quiz | null;
  quizLoading: boolean;
  quizError: string | null;

  // Session state
  currentQuestionIndex: number;
  practiceMode: PracticeMode;
  viewMode: ViewMode;
  questionOrder: number[];  // indices into questions array (for shuffling)

  // Sessions (persisted)
  sessions: Record<string, QuizSession>;

  // Actions
  fetchIndex: () => Promise<void>;
  selectQuiz: (meta: QuizMeta) => Promise<void>;
  clearActiveQuiz: () => void;
  setCurrentQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setPracticeMode: (mode: PracticeMode) => void;
  setViewMode: (mode: ViewMode) => void;
  answerQuestion: (questionId: string, selectedOptionIds: string[], isCorrect: boolean) => void;
  revealExplanation: (questionId: string) => void;
  getSession: (quizId: string) => QuizSession | undefined;
  getAnswer: (questionId: string) => UserAnswer | undefined;
  resetQuizProgress: (quizId: string) => void;
}

// ── Store ─────────────────────────────────────────────────────
export const useQuizStore = create<QuizState>((set, get) => ({
  // Initial state
  quizIndex: [],
  indexLoading: false,
  indexError: null,
  activeQuiz: null,
  quizLoading: false,
  quizError: null,
  currentQuestionIndex: 0,
  practiceMode: 'normal',
  viewMode: 'card',
  questionOrder: [],
  sessions: storage.get<Record<string, QuizSession>>('sessions') || {},

  // ── Actions ──────────────────────────────────────────────────

  fetchIndex: async () => {
    set({ indexLoading: true, indexError: null });
    try {
      const index = await loadQuizIndex();
      set({ quizIndex: index.quizzes, indexLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load quiz index';
      set({ indexError: msg, indexLoading: false });
      console.error('[QuizStore]', msg);
    }
  },

  selectQuiz: async (meta: QuizMeta) => {
    set({ quizLoading: true, quizError: null, currentQuestionIndex: 0 });
    try {
      const quiz = await loadQuiz(meta);
      const order = quiz.questions.map((_, i) => i);
      
      // Restore session if exists
      const sessions = get().sessions;
      const session = sessions[meta.id];
      const questionIndex = session?.currentQuestionIndex ?? 0;

      // Save last opened quiz
      storage.set('lastOpenedQuizId', meta.id);

      set({
        activeQuiz: quiz,
        quizLoading: false,
        questionOrder: order,
        currentQuestionIndex: questionIndex,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load quiz';
      set({ quizError: msg, quizLoading: false });
      console.error('[QuizStore]', msg);
    }
  },

  clearActiveQuiz: () => {
    set({ activeQuiz: null, quizError: null, currentQuestionIndex: 0 });
  },

  setCurrentQuestion: (index: number) => {
    const quiz = get().activeQuiz;
    if (!quiz) return;
    const clampedIndex = Math.max(0, Math.min(index, quiz.questions.length - 1));
    set({ currentQuestionIndex: clampedIndex });

    // Persist position in session
    const sessions = { ...get().sessions };
    const quizId = quiz.meta.id;
    if (sessions[quizId]) {
      sessions[quizId] = { ...sessions[quizId], currentQuestionIndex: clampedIndex, lastAccessedAt: Date.now() };
      set({ sessions });
      storage.set('sessions', sessions);
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, activeQuiz } = get();
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      get().setCurrentQuestion(currentQuestionIndex + 1);
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      get().setCurrentQuestion(currentQuestionIndex - 1);
    }
  },

  setPracticeMode: (mode: PracticeMode) => {
    set({ practiceMode: mode });
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
    storage.set('viewMode', mode);
  },

  answerQuestion: (questionId: string, selectedOptionIds: string[], isCorrect: boolean) => {
    const quiz = get().activeQuiz;
    if (!quiz) return;

    const quizId = quiz.meta.id;
    const sessions = { ...get().sessions };
    const now = Date.now();
    const today = getTodayDate();

    // Create or update session
    if (!sessions[quizId]) {
      sessions[quizId] = {
        quizId,
        startedAt: now,
        lastAccessedAt: now,
        currentQuestionIndex: get().currentQuestionIndex,
        answers: {},
        completed: false,
      };
    }

    const answer: UserAnswer = {
      questionId,
      selectedOptionIds,
      isCorrect,
      answeredAt: now,
      revealed: false,
    };

    sessions[quizId] = {
      ...sessions[quizId],
      lastAccessedAt: now,
      answers: { ...sessions[quizId].answers, [questionId]: answer },
    };

    // Check completion
    const answeredCount = Object.keys(sessions[quizId].answers).length;
    if (answeredCount >= quiz.questions.length) {
      sessions[quizId].completed = true;
      sessions[quizId].completedAt = now;
    }

    set({ sessions });
    storage.set('sessions', sessions);

    // Update stats
    updateStats(isCorrect, quiz.questions.find(q => q.id === questionId)?.topic || 'unknown', today);

    // Track wrong answers
    if (!isCorrect) {
      addWrongAnswer(quizId, questionId);
    }
  },

  revealExplanation: (questionId: string) => {
    const quiz = get().activeQuiz;
    if (!quiz) return;

    const quizId = quiz.meta.id;
    const sessions = { ...get().sessions };
    if (sessions[quizId]?.answers[questionId]) {
      sessions[quizId] = {
        ...sessions[quizId],
        answers: {
          ...sessions[quizId].answers,
          [questionId]: { ...sessions[quizId].answers[questionId], revealed: true },
        },
      };
      set({ sessions });
      storage.set('sessions', sessions);
    }
  },

  getSession: (quizId: string) => {
    return get().sessions[quizId];
  },

  getAnswer: (questionId: string) => {
    const quiz = get().activeQuiz;
    if (!quiz) return undefined;
    const session = get().sessions[quiz.meta.id];
    return session?.answers[questionId];
  },

  resetQuizProgress: (quizId: string) => {
    const sessions = { ...get().sessions };
    delete sessions[quizId];
    set({ sessions, currentQuestionIndex: 0 });
    storage.set('sessions', sessions);
  },
}));

// ── Helper: Update Stats ──────────────────────────────────────
function updateStats(isCorrect: boolean, topic: string, today: string) {
  const stats = storage.get<Record<string, unknown>>('stats') || {
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    streakDays: 0,
    lastPracticeDate: '',
    practiceDates: [],
    topicStats: {},
  };

  const totalAnswered = ((stats.totalAnswered as number) || 0) + 1;
  const totalCorrect = ((stats.totalCorrect as number) || 0) + (isCorrect ? 1 : 0);
  const totalWrong = ((stats.totalWrong as number) || 0) + (isCorrect ? 0 : 1);
  const practiceDates = stats.practiceDates as string[] || [];
  if (!practiceDates.includes(today)) {
    practiceDates.push(today);
  }

  const topicStats = (stats.topicStats as Record<string, { topic: string; answered: number; correct: number; wrong: number }>) || {};
  if (!topicStats[topic]) {
    topicStats[topic] = { topic, answered: 0, correct: 0, wrong: 0 };
  }
  topicStats[topic].answered++;
  if (isCorrect) topicStats[topic].correct++;
  else topicStats[topic].wrong++;

  storage.set('stats', {
    ...stats,
    totalAnswered,
    totalCorrect,
    totalWrong,
    lastPracticeDate: today,
    practiceDates,
    topicStats,
  });
}

// ── Helper: Wrong Answer Tracking ─────────────────────────────
function addWrongAnswer(quizId: string, questionId: string) {
  const wrongAnswers = storage.get<Array<{ questionId: string; quizId: string; wrongAt: number; retryCount: number; resolved: boolean }>>('wrongAnswers') || [];
  const existing = wrongAnswers.find(w => w.questionId === questionId && w.quizId === quizId);
  if (existing) {
    existing.retryCount++;
    existing.wrongAt = Date.now();
  } else {
    wrongAnswers.push({
      questionId,
      quizId,
      wrongAt: Date.now(),
      retryCount: 0,
      resolved: false,
    });
  }
  storage.set('wrongAnswers', wrongAnswers);
}
