import { QuizIndexSchema, QuizSchema } from '../../types/quiz.types';
import type { Quiz, QuizIndex, QuizMeta } from '../../types/quiz.types';

/**
 * QuizLoaderService — Loads quiz data from static JSON files.
 * 
 * All paths resolve via import.meta.env.BASE_URL to ensure correct
 * resolution on both local dev (/) and GitHub Pages (/Dynamic-Web-Programming/).
 * 
 * Future migration path:
 * - Replace fetch calls with Firestore queries
 * - QuizMeta could come from a Firestore collection
 * - Full quiz data from subcollections or Cloud Storage
 * - The interface can remain the same
 */

const BASE = import.meta.env.BASE_URL;

/**
 * Fetches the quiz index manifest.
 */
export async function loadQuizIndex(): Promise<QuizIndex> {
  const url = `${BASE}data/index.json`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load quiz index: ${res.status} ${res.statusText} (${url})`);
  }

  const raw = await res.json();
  
  // Runtime validation
  const result = QuizIndexSchema.safeParse(raw);
  if (!result.success) {
    console.error('[QuizLoader] Invalid quiz index:', result.error.issues);
    throw new Error(`Invalid quiz index format: ${result.error.issues.map(i => i.message).join(', ')}`);
  }

  return result.data;
}

/**
 * Fetches a single quiz by its metadata.
 */
export async function loadQuiz(meta: QuizMeta): Promise<Quiz> {
  const url = `${BASE}data/quizzes/${meta.fileName}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load quiz "${meta.title}": ${res.status} ${res.statusText} (${url})`);
  }

  const raw = await res.json();

  // Runtime validation
  const result = QuizSchema.safeParse(raw);
  if (!result.success) {
    console.error(`[QuizLoader] Invalid quiz data for "${meta.title}":`, result.error.issues);
    throw new Error(`Invalid quiz data: ${result.error.issues.map(i => i.message).join(', ')}`);
  }

  return result.data;
}

/**
 * Loads all quizzes from the index.
 */
export async function loadAllQuizzes(): Promise<Quiz[]> {
  const index = await loadQuizIndex();
  const quizzes = await Promise.allSettled(
    index.quizzes.map((meta) => loadQuiz(meta))
  );

  const loaded: Quiz[] = [];
  quizzes.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      loaded.push(result.value);
    } else {
      console.error(`[QuizLoader] Failed to load quiz "${index.quizzes[i].title}":`, result.reason);
    }
  });

  return loaded;
}
