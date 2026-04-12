import { z } from 'zod';

// ── Question Types ────────────────────────────────────────────
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

// ── Difficulty Levels ─────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

// ── Answer Option ─────────────────────────────────────────────
export interface AnswerOption {
  id: string;
  label: string;  // e.g. "A", "B", "C", "D" or "True", "False"
  text: string;   // The answer text content (supports markdown)
}

// ── Question ──────────────────────────────────────────────────
export interface Question {
  id: string;
  type: QuestionType;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  questionMd: string;          // Question stem in markdown
  codeBlock?: string;          // Optional code snippet
  codeLanguage?: string;       // Language for syntax highlighting
  image?: string;              // Optional image URL (relative to BASE_URL)
  options: AnswerOption[];
  correctAnswer: string[];     // Array of correct option IDs
  explanationMd: string;       // Explanation in markdown
  tags: string[];
  sourceRefs?: string[];
  mergedFromCount?: number;
  needs_review?: boolean;
}

// ── Quiz Metadata ─────────────────────────────────────────────
export interface QuizMeta {
  id: string;
  title: string;
  description: string;
  source: string;              // e.g. "2024 Midterm", "Practice Set"
  year?: number;
  topic: string;               // Primary topic
  topics: string[];            // All topics covered
  questionCount: number;
  difficulty: Difficulty;
  estimatedMinutes?: number;
  tags: string[];
  fileName: string;            // JSON file name for loading
}

// ── Full Quiz (loaded) ────────────────────────────────────────
export interface Quiz {
  meta: QuizMeta;
  questions: Question[];
}

// ── Quiz Index (discovery manifest) ───────────────────────────
export interface QuizIndex {
  version: string;
  lastUpdated: string;
  quizzes: QuizMeta[];
}

// ── Practice Mode ─────────────────────────────────────────────
export type PracticeMode = 
  | 'normal'
  | 'shuffled'
  | 'wrong_only'
  | 'bookmarked_only'
  | 'topic_practice';

// ── View Mode ─────────────────────────────────────────────────
export type ViewMode = 'card' | 'list';

// ── Zod Schemas for Runtime Validation ────────────────────────
export const AnswerOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
  topic: z.string(),
  subtopic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionMd: z.string(),
  codeBlock: z.string().optional(),
  codeLanguage: z.string().optional(),
  image: z.string().optional(),
  options: z.array(AnswerOptionSchema),
  correctAnswer: z.array(z.string()),
  explanationMd: z.string(),
  tags: z.array(z.string()),
  sourceRefs: z.array(z.string()).optional(),
  mergedFromCount: z.number().optional(),
  needs_review: z.boolean().optional(),
});

export const QuizMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  source: z.string(),
  year: z.number().optional(),
  topic: z.string(),
  topics: z.array(z.string()),
  questionCount: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedMinutes: z.number().optional(),
  tags: z.array(z.string()),
  fileName: z.string(),
});

export const QuizSchema = z.object({
  meta: QuizMetaSchema,
  questions: z.array(QuestionSchema),
});

export const QuizIndexSchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  quizzes: z.array(QuizMetaSchema),
});
