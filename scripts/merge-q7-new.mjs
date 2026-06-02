/**
 * merge-q7-new.mjs
 *
 * 5 yeni Quiz7 JSON dosyasını mevcut irs-q7-merged.json'a merge eder.
 * Kriter: normalize(questionMd) + normalize(correctAnswerText) — birebir aynı soru+cevap → atla.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CWD = process.cwd();

// ── helpers ──────────────────────────────────────────────────────────────────

function normalize(text = '') {
  return text
    .toLowerCase()
    .replace(/[çÇ]/g, 'c').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[ıİ]/g, 'i')
    .replace(/`/g, '').replace(/\*+/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCorrectText(q) {
  const rawAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
  const key = String(rawAnswer || '').trim().toLowerCase();
  const opt = (q.options || []).find(o =>
    String(o.id || '').toLowerCase() === key ||
    String(o.label || '').toLowerCase() === key
  );
  return normalize(opt?.text || key);
}

function fingerprint(q) {
  return normalize(q.questionMd || '') + '|||' + getCorrectText(q);
}

function pad(n) { return String(n).padStart(3, '0'); }

// ── load existing file ────────────────────────────────────────────────────────

const existingPath = join(CWD, 'public', 'data', 'quizzes', 'irs', 'irs-q7-merged.json');
const existing = JSON.parse(readFileSync(existingPath, 'utf8'));
const seen = new Set(existing.questions.map(fingerprint));
console.log(`Existing: ${existing.questions.length} questions`);

// ── load new source files ─────────────────────────────────────────────────────

const newFiles = [
  'C:/Users/baris/Downloads/Quiz7.json',
  'C:/Users/baris/Downloads/Quiz7 (1).json',
  'C:/Users/baris/Downloads/Quiz7 (2).json',
  'C:/Users/baris/Downloads/Quiz7 (3).json',
  'C:/Users/baris/Downloads/Quiz7 (4).json',
];

const newQuestions = [];
let skipped = 0;

for (const filePath of newFiles) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const source = data.source || filePath.split('/').pop();
  console.log(`\nProcessing: ${source} (${data.questions.length} questions)`);

  for (const q of data.questions) {
    const fp = fingerprint(q);
    if (seen.has(fp)) {
      console.log(`  SKIP (dup): ${(q.questionMd || '').slice(0, 70)}...`);
      skipped++;
      continue;
    }
    seen.add(fp);

    // Normalize correctAnswer: always lowercase single string
    const rawAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
    const correctKey = String(rawAnswer || '').trim().toLowerCase();

    // Find matching option, normalize option ids to lowercase + add label
    const options = (q.options || []).map(o => {
      const idLower = String(o.id || '').toLowerCase();
      return {
        id:    idLower,
        label: idLower.toUpperCase(),
        text:  o.text,
      };
    });

    newQuestions.push({
      id:            'PLACEHOLDER',   // will be assigned after numbering
      type:          q.type || 'single_choice',
      topic:         q.topic || '',
      subtopic:      q.subtopic || '',
      difficulty:    q.difficulty || 'medium',
      questionMd:    q.questionMd,
      options,
      correctAnswer: [correctKey],
      explanationMd: q.explanationMd || '',
      tags:          q.tags || [],
      sourceRefs:    [source],
      mergedFromCount: 1,
      needs_review:  false,
    });
    console.log(`  ADD: ${(q.questionMd || '').slice(0, 70)}...`);
  }
}

console.log(`\nSkipped (duplicates): ${skipped}`);
console.log(`New unique questions:  ${newQuestions.length}`);

// ── merge & re-number ─────────────────────────────────────────────────────────

const merged = [...existing.questions, ...newQuestions];
const idPrefix = 'irs-q7';
merged.forEach((q, i) => { q.id = `${idPrefix}-${pad(i + 1)}`; });

// ── update meta ───────────────────────────────────────────────────────────────

existing.meta.questionCount    = merged.length;
existing.meta.estimatedMinutes = Math.round(merged.length * 1.5);

// Merge new topics
const topicSet = new Set(existing.meta.topics || []);
for (const q of newQuestions) {
  if (q.topic) topicSet.add(q.topic);
  if (q.subtopic) topicSet.add(q.subtopic);
}
existing.meta.topics = [...topicSet].sort();

existing.questions = merged;

writeFileSync(existingPath, JSON.stringify(existing, null, 2), 'utf8');

console.log(`\n✓ Done. ${existing.questions.length} total questions in irs-q7-merged.json`);
console.log(`  Added: ${newQuestions.length}, Skipped: ${skipped}`);
