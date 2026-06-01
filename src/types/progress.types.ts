// ── User Answer State ─────────────────────────────────────────
export interface UserAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  answeredAt: number;           // timestamp
  revealed: boolean;            // whether explanation was revealed
}

// ── Quiz Session ──────────────────────────────────────────────
export interface QuizSession {
  quizId: string;
  startedAt: number;
  lastAccessedAt: number;
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>;  // questionId → UserAnswer
  completed: boolean;
  completedAt?: number;
}

// ── Bookmark ──────────────────────────────────────────────────
export interface Bookmark {
  questionId: string;
  quizId: string;
  bookmarkedAt: number;
  note?: string;
  questionSnippet?: string;
}

// ── Wrong Answer Entry ────────────────────────────────────────
export interface WrongAnswer {
  questionId: string;
  quizId: string;
  wrongAt: number;
  retryCount: number;
  lastRetryAt?: number;
  resolved: boolean;            // resolved when answered correctly on retry
}

// ── User Stats ────────────────────────────────────────────────
export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  streakDays: number;
  lastPracticeDate: string;     // ISO date string
  practiceDates: string[];      // all practice dates for streak calc
  topicStats: Record<string, TopicStat>;
}

export interface TopicStat {
  topic: string;
  answered: number;
  correct: number;
  wrong: number;
}

// ── Default Values ────────────────────────────────────────────
export const DEFAULT_STATS: UserStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  totalWrong: 0,
  streakDays: 0,
  lastPracticeDate: '',
  practiceDates: [],
  topicStats: {},
};

