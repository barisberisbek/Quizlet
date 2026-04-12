import type { Difficulty } from '../types/quiz.types';

/**
 * Utility functions used across the application.
 */

/** Joins class names, filtering out falsy values */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Shuffles an array using Fisher-Yates algorithm */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Returns a color class for difficulty badges */
export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
  }
}

/** Returns a label for difficulty */
export function getDifficultyLabel(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/** Format a percentage */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/** Get today's date as ISO string (YYYY-MM-DD) */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/** Calculate streak from practice dates */
export function calculateStreak(practiceDates: string[]): number {
  if (practiceDates.length === 0) return 0;

  const sorted = [...new Set(practiceDates)].sort().reverse();
  const today = getTodayDate();

  // Check if the most recent date is today or yesterday
  const mostRecent = sorted[0];
  const dayDiff = dateDiffInDays(mostRecent, today);
  if (dayDiff > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = dateDiffInDays(sorted[i], sorted[i - 1]);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function dateDiffInDays(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.abs(Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
