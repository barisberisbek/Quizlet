/**
 * Quiz Merge Script
 * 
 * Groups incoming quiz JSON files by quiz number (Q1-Q4),
 * deduplicates in 3 passes (exact, normalized, near-duplicate),
 * and outputs merged quiz files compatible with the DWP Quiz Platform schema.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

// ── Configuration ──────────────────────────────────────────
const INCOMING_DIR = join(process.cwd(), 'incoming-json');
const OUTPUT_DIR = join(process.cwd(), 'public', 'data', 'quizzes');
const INDEX_PATH = join(process.cwd(), 'public', 'data', 'index.json');
const REPORT_DIR = join(process.cwd(), 'reports');
const REPORT_PATH = join(REPORT_DIR, 'merge-report.md');

// ── Step 1: Read all incoming files ───────────────────────
console.log('=== DWP Quiz Merge Tool ===\n');

const files = readdirSync(INCOMING_DIR).filter(f => f.endsWith('.json'));
console.log(`Found ${files.length} incoming JSON files:\n`);
files.forEach(f => console.log(`  - ${f}`));

// ── Step 2: Group files by quiz number ────────────────────
function detectQuizNumber(filename) {
  const fn = filename.toLowerCase();
  
  // Direct Q1, Q2, Q3, Q4 patterns
  const directMatch = fn.match(/q(\d)/i);
  if (directMatch) return parseInt(directMatch[1]);
  
  // "Quiz 1", "Quiz 2", etc.
  const quizMatch = fn.match(/quiz\s*(\d)/i);
  if (quizMatch) return parseInt(quizMatch[1]);
  
  return null;
}

const groups = { 1: [], 2: [], 3: [], 4: [] };
const ungrouped = [];

for (const file of files) {
  const quizNum = detectQuizNumber(file);
  if (quizNum && groups[quizNum]) {
    groups[quizNum].push(file);
  } else {
    ungrouped.push(file);
  }
}

console.log('\n--- Grouping ---');
for (const [num, files] of Object.entries(groups)) {
  console.log(`Q${num}: ${files.length} files`);
  files.forEach(f => console.log(`    ${f}`));
}
if (ungrouped.length > 0) {
  console.log(`Ungrouped: ${ungrouped.length} files`);
  ungrouped.forEach(f => console.log(`    ${f}`));
}

// ── Step 3: Parse all files ───────────────────────────────
function parseQuizFile(filepath) {
  try {
    const raw = readFileSync(filepath, 'utf-8');
    // Remove BOM if present
    const cleaned = raw.replace(/^\uFEFF/, '');
    const data = JSON.parse(cleaned);
    return { success: true, data, error: null };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
}

function extractQuestions(data) {
  // Handle different possible structures
  if (Array.isArray(data.questions)) return data.questions;
  if (Array.isArray(data)) return data;
  return [];
}

// ── Step 4: Normalization functions ───────────────────────
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    // Remove leading question numbering
    .replace(/^(soru\s*\d+[\.\)\:]?\s*)/i, '')
    .replace(/^(question\s*\d+[\.\)\:]?\s*)/i, '')
    .replace(/^(\d+[\.\)\:]?\s*)/, '')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Normalize dashes
    .replace(/[–—]/g, '-')
    // Normalize Turkish characters for comparison only
    .replace(/İ/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c');
}

function normalizeOptions(options) {
  if (!options || !Array.isArray(options)) return '';
  return options
    .map(o => normalizeText(o.text || ''))
    .sort()
    .join('|||');
}

function normalizeCorrectAnswer(answer) {
  if (!answer) return '';
  if (Array.isArray(answer)) return answer.map(a => a.toLowerCase()).sort().join(',');
  return String(answer).toLowerCase();
}

// ── Step 5: Fingerprinting for dedup ──────────────────────
function exactFingerprint(q) {
  const qText = (q.questionMd || q.question || q.text || '').trim();
  const opts = normalizeOptions(q.options);
  const correct = normalizeCorrectAnswer(q.correctAnswer);
  return `${qText}|||${opts}|||${correct}`;
}

function normalizedFingerprint(q) {
  const qText = normalizeText(q.questionMd || q.question || q.text || '');
  const opts = normalizeOptions(q.options);
  const correct = normalizeCorrectAnswer(q.correctAnswer);
  return `${qText}|||${opts}|||${correct}`;
}

function stemFingerprint(q) {
  // Just the question text, heavily normalized
  return normalizeText(q.questionMd || q.question || q.text || '');
}

// Similarity score (Jaccard on words)
function wordSimilarity(a, b) {
  const wordsA = new Set(normalizeText(a).split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(normalizeText(b).split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

// ── Step 6: Choose best version ───────────────────────────
function chooseBestQuestion(questions) {
  // Score each version
  let best = questions[0];
  let bestScore = 0;
  
  for (const q of questions) {
    let score = 0;
    // Prefer version with explanation
    if (q.explanationMd && q.explanationMd.trim().length > 0) score += 3;
    // Prefer version with more explanation text
    if (q.explanationMd) score += Math.min(q.explanationMd.length / 100, 2);
    // Prefer version with code block
    if (q.codeBlock && q.codeBlock.trim().length > 0) score += 2;
    // Prefer version with more tags
    if (q.tags && q.tags.length > 0) score += 1;
    // Prefer version with topic/subtopic
    if (q.topic) score += 0.5;
    if (q.subtopic) score += 0.5;
    // Prefer version with difficulty
    if (q.difficulty) score += 0.5;
    // Prefer longer question text (usually more complete)
    if (q.questionMd) score += Math.min(q.questionMd.length / 200, 1);
    // Prefer version with label in options
    if (q.options && q.options[0] && q.options[0].label) score += 0.5;
    
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }
  
  return best;
}

// ── Step 7: Adapt question to platform schema ─────────────
function adaptQuestion(q, quizNum, index, sourceRefs, mergedFromCount, needsReview) {
  const questionText = q.questionMd || q.question || q.text || '';
  const options = (q.options || []).map((o, i) => ({
    id: o.id || String.fromCharCode(97 + i), // a, b, c, d
    label: o.label || o.id || String.fromCharCode(65 + i), // A, B, C, D
    text: o.text || '',
  }));
  
  const correctAnswer = Array.isArray(q.correctAnswer) 
    ? q.correctAnswer.map(a => a.toLowerCase())
    : [String(q.correctAnswer || '').toLowerCase()];
  
  // Map old A/B/C/D answers to new lowercase ids
  const mappedAnswer = correctAnswer.map(a => {
    const match = options.find(o => 
      o.id.toLowerCase() === a.toLowerCase() || 
      o.label.toLowerCase() === a.toLowerCase()
    );
    return match ? match.id.toLowerCase() : a.toLowerCase();
  });
  
  // Ensure option IDs are lowercase
  const normalizedOptions = options.map(o => ({
    ...o,
    id: o.id.toLowerCase(),
  }));

  return {
    id: `q${quizNum}-${String(index + 1).padStart(2, '0')}`,
    type: q.type || 'single_choice',
    topic: q.topic || 'General',
    subtopic: q.subtopic || undefined,
    difficulty: q.difficulty || 'medium',
    questionMd: questionText,
    codeBlock: (q.codeBlock && q.codeBlock.trim()) ? q.codeBlock : undefined,
    codeLanguage: (q.codeLanguage && q.codeLanguage.trim()) ? q.codeLanguage : undefined,
    image: (q.image && q.image.trim()) ? q.image : undefined,
    options: normalizedOptions,
    correctAnswer: mappedAnswer,
    explanationMd: q.explanationMd || 'No explanation provided.',
    tags: q.tags || [],
    sourceRefs,
    mergedFromCount,
    needs_review: needsReview,
  };
}

// ── Step 8: Merge one quiz group ──────────────────────────
function mergeQuizGroup(quizNum, fileNames) {
  const stats = {
    quizNum,
    inputFiles: fileNames,
    totalQuestionsRaw: 0,
    exactDuplicates: 0,
    normalizedDuplicates: 0,
    nearDuplicates: 0,
    finalCount: 0,
    parseErrors: [],
    reviewItems: [],
  };
  
  // Parse all files in this group
  const allQuestions = []; // { question, sourceFile }
  
  for (const file of fileNames) {
    const filepath = join(INCOMING_DIR, file);
    const { success, data, error } = parseQuizFile(filepath);
    
    if (!success) {
      stats.parseErrors.push({ file, error });
      console.error(`  ✗ Parse error in ${file}: ${error}`);
      continue;
    }
    
    const questions = extractQuestions(data);
    console.log(`  ✓ ${file}: ${questions.length} questions`);
    
    for (const q of questions) {
      allQuestions.push({ question: q, sourceFile: file });
      stats.totalQuestionsRaw++;
    }
  }
  
  // === Pass 1: Exact duplicates ===
  const exactMap = new Map(); // fingerprint -> [{ question, sourceFile }]
  for (const entry of allQuestions) {
    const fp = exactFingerprint(entry.question);
    if (!exactMap.has(fp)) exactMap.set(fp, []);
    exactMap.get(fp).push(entry);
  }
  
  const afterExact = [];
  for (const [fp, entries] of exactMap) {
    if (entries.length > 1) {
      stats.exactDuplicates += entries.length - 1;
    }
    // Keep best version, track sources
    const best = chooseBestQuestion(entries.map(e => e.question));
    afterExact.push({
      question: best,
      sources: entries.map(e => e.sourceFile),
    });
  }
  
  // === Pass 2: Normalized duplicates ===
  const normalizedMap = new Map();
  for (const entry of afterExact) {
    const fp = normalizedFingerprint(entry.question);
    if (!normalizedMap.has(fp)) normalizedMap.set(fp, []);
    normalizedMap.get(fp).push(entry);
  }
  
  const afterNormalized = [];
  for (const [fp, entries] of normalizedMap) {
    if (entries.length > 1) {
      stats.normalizedDuplicates += entries.length - 1;
    }
    const allSources = entries.flatMap(e => e.sources);
    const uniqueSources = [...new Set(allSources)];
    const best = chooseBestQuestion(entries.map(e => e.question));
    afterNormalized.push({
      question: best,
      sources: uniqueSources,
    });
  }
  
  // === Pass 3: Near duplicates (stem similarity > 0.85) ===
  const merged = [];
  const used = new Set();
  
  for (let i = 0; i < afterNormalized.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = [afterNormalized[i]];
    
    for (let j = i + 1; j < afterNormalized.length; j++) {
      if (used.has(j)) continue;
      
      const stemA = stemFingerprint(afterNormalized[i].question);
      const stemB = stemFingerprint(afterNormalized[j].question);
      const sim = wordSimilarity(
        afterNormalized[i].question.questionMd || '',
        afterNormalized[j].question.questionMd || ''
      );
      
      if (sim > 0.85) {
        cluster.push(afterNormalized[j]);
        used.add(j);
        stats.nearDuplicates++;
      }
    }
    
    used.add(i);
    
    const allSources = cluster.flatMap(e => e.sources);
    const uniqueSources = [...new Set(allSources)];
    const best = chooseBestQuestion(cluster.map(e => e.question));
    const needsReview = cluster.length > 1;
    
    if (needsReview) {
      const texts = cluster.map(e => (e.question.questionMd || '').substring(0, 80));
      stats.reviewItems.push({
        texts,
        sources: uniqueSources,
        similarity: 'near-duplicate (>85%)',
      });
    }
    
    merged.push({
      question: best,
      sources: uniqueSources,
      needsReview,
    });
  }
  
  stats.finalCount = merged.length;
  return { merged, stats };
}

// ── Step 9: Build quiz metadata ───────────────────────────
const quizMeta = {
  1: {
    title: 'Quiz 1 — Web Fundamentals & JavaScript Basics',
    description: 'Web history, HTML, HTTP, networking, CSS basics, and JavaScript fundamentals.',
    source: 'DWP Past Exams',
    topic: 'Web Fundamentals',
    difficulty: 'medium',
  },
  2: {
    title: 'Quiz 2 — DOM, Events & Async JavaScript',
    description: 'DOM manipulation, event handling, async/await, promises, and browser APIs.',
    source: 'DWP Past Exams',
    topic: 'DOM & Events',
    difficulty: 'medium',
  },
  3: {
    title: 'Quiz 3 — Node.js, Express & Server-Side',
    description: 'Node.js runtime, Express middleware, routing, templating, and server-side concepts.',
    source: 'DWP Past Exams',
    topic: 'Node.js & Express',
    difficulty: 'medium',
  },
  4: {
    title: 'Quiz 4 — REST, Databases & Security',
    description: 'REST API design, database concepts, authentication, cookies, sessions, and security.',
    source: 'DWP Past Exams',
    topic: 'REST & Security',
    difficulty: 'hard',
  },
};

// ── Step 10: Run merge for all groups ─────────────────────
console.log('\n=== Merging ===\n');

const allStats = [];
const indexQuizzes = [];

for (const quizNum of [1, 2, 3, 4]) {
  const fileNames = groups[quizNum];
  if (fileNames.length === 0) {
    console.log(`Q${quizNum}: No files, skipping.`);
    continue;
  }
  
  console.log(`\n--- Q${quizNum} (${fileNames.length} files) ---`);
  const { merged, stats } = mergeQuizGroup(quizNum, fileNames);
  allStats.push(stats);
  
  // Convert to platform schema
  const questions = merged.map((entry, i) => 
    adaptQuestion(
      entry.question,
      quizNum,
      i,
      entry.sources,
      entry.sources.length,
      entry.needsReview
    )
  );
  
  // Detect all topics
  const topics = [...new Set(questions.map(q => q.topic))].filter(Boolean);
  
  const meta = quizMeta[quizNum];
  const quizId = `q${quizNum}-merged`;
  const fileName = `q${quizNum}-merged.json`;
  
  // Build full quiz JSON
  const quizJson = {
    meta: {
      id: quizId,
      title: meta.title,
      description: meta.description,
      source: meta.source,
      topic: meta.topic,
      topics,
      questionCount: questions.length,
      difficulty: meta.difficulty,
      estimatedMinutes: Math.ceil(questions.length * 1.5),
      tags: [`quiz-${quizNum}`, 'merged', 'past-exam'],
      fileName,
    },
    questions,
  };
  
  // Write output
  const outputPath = join(OUTPUT_DIR, fileName);
  writeFileSync(outputPath, JSON.stringify(quizJson, null, 2), 'utf-8');
  console.log(`  → Wrote ${outputPath} (${questions.length} questions)`);
  
  // Add to index
  indexQuizzes.push(quizJson.meta);
  
  console.log(`  Summary: ${stats.totalQuestionsRaw} raw → ${stats.finalCount} unique`);
  console.log(`    Exact dups: ${stats.exactDuplicates}`);
  console.log(`    Normalized dups: ${stats.normalizedDuplicates}`);
  console.log(`    Near dups: ${stats.nearDuplicates}`);
  if (stats.reviewItems.length > 0) {
    console.log(`    ⚠ ${stats.reviewItems.length} items flagged for review`);
  }
}

// ── Step 11: Write index.json ─────────────────────────────
const indexJson = {
  version: '2.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  quizzes: indexQuizzes,
};

writeFileSync(INDEX_PATH, JSON.stringify(indexJson, null, 2), 'utf-8');
console.log(`\n✓ Wrote ${INDEX_PATH}`);

// ── Step 12: Generate merge report ────────────────────────
mkdirSync(REPORT_DIR, { recursive: true });

let report = `# DWP Quiz Merge Report\n\n`;
report += `**Generated**: ${new Date().toISOString()}\n\n`;
report += `## Input Files\n\n`;
report += `Found **${files.length}** JSON files in \`incoming-json/\`:\n\n`;

for (const f of files) {
  const quizNum = detectQuizNumber(f);
  report += `- \`${f}\` → **Q${quizNum || '?'}**\n`;
}

report += `\n## Grouping\n\n`;
report += `| Quiz | Files | Raw Questions |\n`;
report += `|------|-------|---------------|\n`;
for (const stats of allStats) {
  report += `| Q${stats.quizNum} | ${stats.inputFiles.length} | ${stats.totalQuestionsRaw} |\n`;
}

report += `\n## Deduplication Results\n\n`;
report += `| Quiz | Raw | Exact Dups | Normalized Dups | Near Dups | **Final Unique** |\n`;
report += `|------|-----|------------|-----------------|-----------|------------------|\n`;
for (const stats of allStats) {
  report += `| Q${stats.quizNum} | ${stats.totalQuestionsRaw} | ${stats.exactDuplicates} | ${stats.normalizedDuplicates} | ${stats.nearDuplicates} | **${stats.finalCount}** |\n`;
}

const totalRaw = allStats.reduce((s, st) => s + st.totalQuestionsRaw, 0);
const totalFinal = allStats.reduce((s, st) => s + st.finalCount, 0);
const totalExact = allStats.reduce((s, st) => s + st.exactDuplicates, 0);
const totalNormalized = allStats.reduce((s, st) => s + st.normalizedDuplicates, 0);
const totalNear = allStats.reduce((s, st) => s + st.nearDuplicates, 0);

report += `| **Total** | **${totalRaw}** | **${totalExact}** | **${totalNormalized}** | **${totalNear}** | **${totalFinal}** |\n`;

// Review items
const allReviewItems = allStats.flatMap(s => 
  s.reviewItems.map(r => ({ ...r, quizNum: s.quizNum }))
);

if (allReviewItems.length > 0) {
  report += `\n## Items Flagged for Review\n\n`;
  report += `${allReviewItems.length} question(s) were merged as near-duplicates and may need manual review:\n\n`;
  
  for (const item of allReviewItems) {
    report += `### Q${item.quizNum} — Near Duplicate\n\n`;
    report += `**Sources**: ${item.sources.map(s => `\`${s}\``).join(', ')}\n\n`;
    for (const text of item.texts) {
      report += `> ${text}...\n`;
    }
    report += `\n---\n\n`;
  }
} else {
  report += `\n## Items Flagged for Review\n\nNo items required manual review. All merges were high-confidence.\n`;
}

// Parse errors
const allParseErrors = allStats.flatMap(s => s.parseErrors);
if (allParseErrors.length > 0) {
  report += `\n## Parse Errors\n\n`;
  for (const err of allParseErrors) {
    report += `- \`${err.file}\`: ${err.error}\n`;
  }
} else {
  report += `\n## Parse Errors\n\nNo parse errors. All files were valid JSON.\n`;
}

report += `\n## Output Files\n\n`;
for (const quiz of indexQuizzes) {
  report += `- \`public/data/quizzes/${quiz.fileName}\` — **${quiz.questionCount}** questions\n`;
}
report += `- \`public/data/index.json\` — updated with ${indexQuizzes.length} merged quizzes\n`;

writeFileSync(REPORT_PATH, report, 'utf-8');
console.log(`✓ Wrote ${REPORT_PATH}`);
console.log(`\n=== Done! ===`);
console.log(`Total: ${totalRaw} raw questions → ${totalFinal} unique questions`);
