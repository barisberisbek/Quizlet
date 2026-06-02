/**
 * merge-all.mjs — Tek Yetkili Quiz Merge Script
 *
 * Her quiz grubu için hangi kaynak dosyaların kullanılacağı
 * açıkça GROUPS konfigürasyonunda tanımlıdır.
 *
 * Kullanım:
 *   node scripts/merge-all.mjs
 *
 * Çıktı:
 *   public/data/quizzes/dwp/*.json   (DWP quiz dosyaları)
 *   public/data/quizzes/irs/*.json   (IRS quiz dosyaları)
 *   public/data/index.json            (güncel index)
 *   reports/merge-all-report.md       (istatistik raporu)
 *   public/data/_backups/backup-{ts}/ (otomatik backup)
 */

import {
  readFileSync, writeFileSync, mkdirSync,
  readdirSync, existsSync, copyFileSync,
} from 'fs';
import { join, dirname } from 'path';

const CWD          = process.cwd();
const OUTPUT_DIR   = join(CWD, 'public', 'data', 'quizzes');
const INDEX_PATH   = join(CWD, 'public', 'data', 'index.json');
const BACKUP_BASE  = join(CWD, 'public', 'data', '_backups');
const REPORT_DIR   = join(CWD, 'reports');

mkdirSync(OUTPUT_DIR,  { recursive: true });
mkdirSync(BACKUP_BASE, { recursive: true });
mkdirSync(REPORT_DIR,  { recursive: true });

// ── GROUPS CONFIGURATION ──────────────────────────────────────────────────────
const GROUPS = [

  // ── Dynamic Web Programming ───────────────────────────────────────────────

  {
    id:          'q1-merged',
    outputFile:  'dwp/q1-merged.json',
    idPrefix:    'q1',
    title:       'Quiz 1 — Web Fundamentals & JavaScript Basics',
    description: 'Web history, HTML, HTTP, networking, CSS basics, and JavaScript fundamentals.',
    course:      'Dynamic Web Programming',
    source:      'DWP Past Exams (Merged)',
    topic:       'Web Fundamentals',
    tags:        ['q1', 'merged', 'past-exam'],
    difficulty:  'medium',
    sources: [
      { file: 'incomingv2-json/dwp_quiz1_merged.json',                       priority: 'v2' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 1.json',          priority: 'v1' },
      { file: 'incoming-json/Q1-Berhudan.json',                               priority: 'v1' },
    ],
  },

  {
    id:          'q2-merged',
    outputFile:  'dwp/q2-merged.json',
    idPrefix:    'q2',
    title:       'Quiz 2 — DOM, Events & Async JavaScript',
    description: 'DOM manipulation, event handling, async/await, promises, and browser APIs.',
    course:      'Dynamic Web Programming',
    source:      'DWP Past Exams (Merged)',
    topic:       'DOM & Events',
    tags:        ['q2', 'merged', 'past-exam'],
    difficulty:  'medium',
    sources: [
      { file: 'incomingv2-json/dwp_quiz2_merged.json',                        priority: 'v2' },
      { file: 'incoming-json/Dynamic Web Programming - Emir Quiz 2.json',     priority: 'v1' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 2 Sema.json',     priority: 'v1' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 2.json',          priority: 'v1' },
      { file: 'incoming-json/Q2-Berhudan.json',                               priority: 'v1' },
      { file: 'incoming-json/Q2-Web2.json',                                   priority: 'v1' },
    ],
  },

  {
    id:          'q3-merged',
    outputFile:  'dwp/q3-merged.json',
    idPrefix:    'q3',
    title:       'Quiz 3 — Node.js, Express & Server-Side',
    description: 'Node.js runtime, Express middleware, routing, templating, and server-side concepts.',
    course:      'Dynamic Web Programming',
    source:      'DWP Past Exams (Merged)',
    topic:       'Node.js & Express',
    tags:        ['q3', 'merged', 'past-exam'],
    difficulty:  'medium',
    sources: [
      { file: 'incomingv2-json/dwp_quiz3_merged.json',                        priority: 'v2' },
      { file: 'incoming-json/Dynamic Web Programming - Emir Quiz 3.json',     priority: 'v1' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 3 Sema.json',     priority: 'v1' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 3.json',          priority: 'v1' },
      { file: 'incoming-json/Q3-Berhudan.json',                               priority: 'v1' },
      { file: 'incoming-json/Q3-Web2.json',                                   priority: 'v1' },
    ],
  },

  {
    id:          'q4-merged',
    outputFile:  'dwp/q4-merged.json',
    idPrefix:    'q4',
    title:       'Quiz 4 — REST, Databases & Security',
    description: 'REST API design, database concepts, authentication, cookies, sessions, and security.',
    course:      'Dynamic Web Programming',
    source:      'DWP Past Exams (Merged)',
    topic:       'REST & Security',
    tags:        ['q4', 'merged', 'past-exam'],
    difficulty:  'hard',
    sources: [
      { file: 'incomingv2-json/dwp_quiz4_merged.json',                        priority: 'v2' },
      { file: 'incoming-json/Dynamic Web Programming - Emir Quiz 4.json',     priority: 'v1' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 4 Sema.json',     priority: 'v1' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 4.json',          priority: 'v1' },
      { file: 'incoming-json/Q4-Berhudan.json',                               priority: 'v1' },
      { file: 'incoming-json/Q4-Web2.json',                                   priority: 'v1' },
    ],
  },

  {
    id:          'q5-merged',
    outputFile:  'dwp/q5-merged.json',
    idPrefix:    'q5',
    title:       'Quiz 5 — Fetch API, REST & Async Patterns',
    description: 'RESTful APIs, Fetch API, async/await, arrow functions, timers, and query parameters.',
    course:      'Dynamic Web Programming',
    source:      'DWP Past Exams (Merged)',
    topic:       'Web APIs',
    tags:        ['q5', 'merged', 'past-exam'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-json/DWP-Quiz-5-v2.json',                             priority: 'v2' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 5.json',          priority: 'v1' },
    ],
  },

  {
    id:          'q6-merged',
    outputFile:  'dwp/q6-merged.json',
    idPrefix:    'q6',
    title:       'Quiz 6 — Node.js & Server-Side Fundamentals',
    description: 'Node.js runtime, npm, HTTP servers, sockets, modules, Express, and server-side programming.',
    course:      'Dynamic Web Programming',
    source:      'DWP Past Exams (Merged)',
    topic:       'Node.js',
    tags:        ['q6', 'merged', 'past-exam'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-json/DWP-Quiz-6-extended.json',                       priority: 'v2' },
      { file: 'incoming-json/Dynamic Web Programming - Quiz 6.json',          priority: 'v1' },
    ],
  },

  {
    id:          'midterm-merged',
    outputFile:  'dwp/midterm-merged.json',
    idPrefix:    'midterm',
    title:       'DWP Midterm — 60 Unique Questions',
    description: 'Comprehensive midterm practice set covering Fetch API, REST, Node.js, browser architecture, and async JavaScript.',
    course:      'Dynamic Web Programming',
    source:      'DWP Midterm (2025-2026 Spring)',
    topic:       'Mixed',
    tags:        ['midterm', 'merged', 'past-exam'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-json/Dynamic Web Programming - Midterm.json',          priority: 'v2' },
      { file: 'incoming-json/DWP-Midterm-v2.json',                             priority: 'v1' },
    ],
  },

  {
    id:          'old-merged',
    outputFile:  'dwp/old-merged.json',
    idPrefix:    'old',
    title:       'Old Exam Examples',
    description: 'Mixed questions from past DWP exams including true/false, Express, Fetch API, and more.',
    course:      'Dynamic Web Programming',
    source:      'DWP Past Exams (Merged)',
    topic:       'Mixed',
    tags:        ['old', 'merged', 'past-exam'],
    difficulty:  'medium',
    sources: [
      { file: 'incomingv2-json/dwp_old_examples.json',                        priority: 'v2' },
    ],
  },

  // ── Information Retrieval Systems ─────────────────────────────────────────

  {
    id:          'irs-q1-merged',
    outputFile:  'irs/irs-q1-merged.json',
    idPrefix:    'irs-q1',
    title:       '[IRS] Quiz 1 — IR Fundamentals',
    description: 'Vocabulary mismatch, Term Frequency, basic IR queries.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Architecture',
    tags:        ['irs', 'q1', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Q1-v2.json',  priority: 'v2' },
      { file: 'incoming-retrieval-json/Q1.json',     priority: 'v1' },
    ],
  },

  {
    id:          'irs-q2-merged',
    outputFile:  'irs/irs-q2-merged.json',
    idPrefix:    'irs-q2',
    title:       '[IRS] Quiz 2 — Text Processing & Indexing',
    description: 'Stemming, lemmatization, index compression, and text preprocessing.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Index Compression',
    tags:        ['irs', 'q2', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Q2-v2.json',  priority: 'v2' },
      { file: 'incoming-retrieval-json/Q2.json',     priority: 'v1' },
    ],
  },

  {
    id:          'irs-q3-merged',
    outputFile:  'irs/irs-q3-merged.json',
    idPrefix:    'irs-q3',
    title:       '[IRS] Quiz 3 — Boolean & Phrase Queries',
    description: 'Boolean retrieval, phrase queries, wildcard queries, spelling correction.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Boolean Retrieval',
    tags:        ['irs', 'q3', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Q3-v2.json',  priority: 'v2' },
      { file: 'incoming-retrieval-json/Q3.json',     priority: 'v1' },
    ],
  },

  {
    id:          'irs-q4-merged',
    outputFile:  'irs/irs-q4-merged.json',
    idPrefix:    'irs-q4',
    title:       '[IRS] Quiz 4 — Crawling & Architecture',
    description: 'Web scraping protocols, online vs offline processing, indexing architecture.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Fundamentals',
    tags:        ['irs', 'q4', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Q4-v2.json',  priority: 'v2' },
      { file: 'incoming-retrieval-json/Q4.json',     priority: 'v1' },
    ],
  },

  {
    id:          'irs-q5-merged',
    outputFile:  'irs/irs-q5-merged.json',
    idPrefix:    'irs-q5',
    title:       '[IRS] Quiz 5 — Evaluation Campaigns',
    description: 'Evaluation metrics, significance testing, and retrieval evaluation campaigns.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Evaluation Campaigns',
    tags:        ['irs', 'q5', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Q5-v2.json',  priority: 'v2' },
      { file: 'incoming-retrieval-json/Q5.json',     priority: 'v1' },
    ],
  },

  {
    id:          'irs-q6-merged',
    outputFile:  'irs/irs-q6-merged.json',
    idPrefix:    'irs-q6',
    title:       '[IRS] Quiz 6 — OpenSearch & Distributed Retrieval',
    description: 'PageRank, HITS, OpenSearch, Lucene, distributed retrieval.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Distributed Retrieval',
    tags:        ['irs', 'q6', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Q6-v2.json',  priority: 'v2' },
      { file: 'incoming-retrieval-json/Q6.json',     priority: 'v1' },
    ],
  },

  {
    id:          'irs-q7-merged',
    outputFile:  'irs/irs-q7-merged.json',
    idPrefix:    'irs-q7',
    title:       '[IRS] Quiz 7 — Language Models & Query Expansion',
    description: 'Dirichlet/JM smoothing, PRF, RM3, WordNet expansion, vocabulary mismatch.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Language Models',
    tags:        ['irs', 'q7', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Q7.json',     priority: 'v2' },
    ],
  },

  {
    id:          'irs-midterm-merged',
    outputFile:  'irs/irs-midterm-merged.json',
    idPrefix:    'irs-midterm',
    title:       '[IRS] Midterm — 60 Unique Questions',
    description: 'Comprehensive midterm set covering evaluation, retrieval models, index compression, text processing, and OpenSearch.',
    course:      'Information Retrieval Systems',
    source:      'IRS Midterm (2025-2026 Spring)',
    topic:       'Evaluation',
    tags:        ['irs', 'midterm', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Midterm-Unique-60.json',  priority: 'v2' },
      { file: 'incoming-retrieval-json/IRS-Midterm-beg.json',    priority: 'v1' },
      { file: 'incoming-retrieval-json/IRS-Midterm-berho.json',  priority: 'v1' },
      { file: 'incoming-retrieval-json/IRS-Midterm-fa.json',     priority: 'v1' },
      { file: 'incoming-retrieval-json/IRS-Midterm-infomid.json',priority: 'v1' },
      { file: 'incoming-retrieval-json/IRS-Midterm-ibo.json',    priority: 'v1' },
      { file: 'incoming-retrieval-json/IRS-Midterm-merve.json',  priority: 'v1' },
    ],
  },

  {
    id:          'irs-new-mix-merged',
    outputFile:  'irs/irs-new-mix-merged.json',
    idPrefix:    'irs-new-mix',
    title:       '[IRS] New Mix Questions',
    description: 'A collection of Information Retrieval Systems exam questions.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'BM25',
    tags:        ['irs', 'new-mix', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/new-mix.json', priority: 'v2' },
    ],
  },

  {
    id:          'irs-old-final-merged',
    outputFile:  'irs/irs-old-final-merged.json',
    idPrefix:    'irs-old-final',
    title:       '[IRS] Old Final Questions',
    description: 'A collection of Information Retrieval Systems exam questions from past finals.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Evaluation',
    tags:        ['irs', 'old-final', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Old-Final.json', priority: 'v2' },
    ],
  },

  {
    id:          'irs-old-midterm-merged',
    outputFile:  'irs/irs-old-midterm-merged.json',
    idPrefix:    'irs-old-midterm',
    title:       '[IRS] Old Midterm Questions',
    description: 'A collection of Information Retrieval Systems exam questions from past midterms.',
    course:      'Information Retrieval Systems',
    source:      'IRS Past Exams',
    topic:       'Boolean Retrieval',
    tags:        ['irs', 'old-midterm', 'merged'],
    difficulty:  'medium',
    sources: [
      { file: 'incoming-retrieval-json/Old-Midterm.json', priority: 'v2' },
    ],
  },
];

// ── TEXT NORMALIZATION ────────────────────────────────────────────────────────
function normalizeText(t) {
  if (!t) return '';
  return t
    .toLowerCase().trim()
    .replace(/\r\n/g, '\n').replace(/\s+/g, ' ')
    .replace(/^(soru\s*\d+[\.\)\:]\s*)/i, '')
    .replace(/^(question\s*\d+[\.\)\:]\s*)/i, '')
    .replace(/^(\d+[\.\)\:]\s*)/, '')
    .replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[–—]/g, '-')
    .replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u').replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o').replace(/Ç/g, 'c').replace(/ç/g, 'c');
}

// ── FINGERPRINT HELPERS ───────────────────────────────────────────────────────
function optsFP(opts) {
  if (!opts || !opts.length) return '';
  return opts.map(o => normalizeText(o.text || '')).sort().join('|||');
}

function ansFP(ans) {
  if (!ans) return '';
  return (Array.isArray(ans) ? ans : [ans])
    .map(a => String(a).toLowerCase()).sort().join(',');
}

function exactFP(q) {
  return `${(q.questionMd || '').trim()}|||${optsFP(q.options)}|||${ansFP(q.correctAnswer)}`;
}

function normFP(q) {
  return `${normalizeText(q.questionMd || '')}|||${optsFP(q.options)}|||${ansFP(q.correctAnswer)}`;
}

function jaccard(a, b) {
  const wa = new Set(normalizeText(a).split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(normalizeText(b).split(/\s+/).filter(w => w.length > 2));
  if (!wa.size && !wb.size) return 1;
  if (!wa.size || !wb.size) return 0;
  const inter = [...wa].filter(w => wb.has(w)).length;
  return inter / new Set([...wa, ...wb]).size;
}

// ── SCORING ───────────────────────────────────────────────────────────────────
function score(q, priority) {
  let s = priority === 'v2' ? 100 : 0;
  const exp = q.explanationMd || '';
  if (exp.length > 30)  s += 3;
  if (exp.length > 150) s += 2;
  if (q.codeBlock && q.codeBlock.trim()) s += 2;
  if (q.tags && q.tags.length)           s += 1;
  if (q.topic)                           s += 0.5;
  if (q.subtopic)                        s += 0.5;
  if (q.difficulty)                      s += 0.5;
  return s;
}

// ── SOURCE LOADER ─────────────────────────────────────────────────────────────
function readSource(relPath, priority) {
  const fullPath = join(CWD, relPath);
  if (!existsSync(fullPath)) {
    console.warn(`  ⚠ Not found (skipped): ${relPath}`);
    return [];
  }
  try {
    const raw = readFileSync(fullPath, 'utf-8').replace(/^﻿/, '');
    const data = JSON.parse(raw);
    const questions = data.questions || [];
    console.log(`  ✓ [${priority}] ${relPath}: ${questions.length} soru`);
    return questions.map(q => ({ question: q, priority, sourceFile: relPath }));
  } catch (err) {
    console.warn(`  ✗ Parse hatası (${relPath}): ${err.message}`);
    return [];
  }
}

// ── PER-GROUP DEDUP (3 pass) ──────────────────────────────────────────────────
function dedupGroup(rawEntries) {
  let exactRemoved = 0, normRemoved = 0, nearRemoved = 0;

  // Pass 1: Exact
  const exactMap = new Map();
  for (const e of rawEntries) {
    const fp = exactFP(e.question);
    if (!exactMap.has(fp)) exactMap.set(fp, []);
    exactMap.get(fp).push(e);
  }
  const afterExact = [];
  for (const cluster of exactMap.values()) {
    exactRemoved += cluster.length - 1;
    cluster.sort((a, b) => score(b.question, b.priority) - score(a.question, a.priority));
    const best = cluster[0];
    const refs = [...new Set(cluster.map(e => e.sourceFile))];
    afterExact.push({ ...best, question: { ...best.question, _sourceRefs: refs, _mergedFromCount: refs.length } });
  }

  // Pass 2: Normalized
  const normMap = new Map();
  for (const e of afterExact) {
    const fp = normFP(e.question);
    if (!normMap.has(fp)) normMap.set(fp, []);
    normMap.get(fp).push(e);
  }
  const afterNorm = [];
  for (const cluster of normMap.values()) {
    normRemoved += cluster.length - 1;
    cluster.sort((a, b) => score(b.question, b.priority) - score(a.question, a.priority));
    const best = cluster[0];
    const refs = [...new Set(cluster.flatMap(e => e.question._sourceRefs || [e.sourceFile]))];
    afterNorm.push({ ...best, question: { ...best.question, _sourceRefs: refs, _mergedFromCount: refs.length } });
  }

  // Pass 3: Near (Jaccard > 0.85)
  const used = new Set();
  const afterNear = [];
  for (let i = 0; i < afterNorm.length; i++) {
    if (used.has(i)) continue;
    const cluster = [afterNorm[i]];
    for (let j = i + 1; j < afterNorm.length; j++) {
      if (used.has(j)) continue;
      if (jaccard(afterNorm[i].question.questionMd || '', afterNorm[j].question.questionMd || '') > 0.85) {
        cluster.push(afterNorm[j]);
        used.add(j);
        nearRemoved++;
      }
    }
    used.add(i);
    cluster.sort((a, b) => score(b.question, b.priority) - score(a.question, a.priority));
    const best = cluster[0];
    const refs = [...new Set(cluster.flatMap(e => e.question._sourceRefs || [e.sourceFile]))];
    afterNear.push({
      ...best,
      question: { ...best.question, _sourceRefs: refs, _mergedFromCount: refs.length, _needsReview: cluster.length > 1 },
    });
  }

  return { unique: afterNear, exactRemoved, normRemoved, nearRemoved };
}

// ── SCHEMA ADAPTER ────────────────────────────────────────────────────────────
function adaptQuestion(entry, idPrefix, idx) {
  const q = entry.question;

  const options = (q.options || []).map((o, i) => ({
    id:    (o.id || String.fromCharCode(97 + i)).toLowerCase(),
    label: o.label || (o.id ? o.id.toUpperCase() : String.fromCharCode(65 + i)),
    text:  o.text || '',
  }));

  const correctAnswer = (Array.isArray(q.correctAnswer)
    ? q.correctAnswer
    : [q.correctAnswer || '']
  ).map(a => String(a).toLowerCase());

  return {
    id:            `${idPrefix}-${String(idx + 1).padStart(3, '0')}`,
    type:          q.type || 'single_choice',
    topic:         q.topic || 'General',
    subtopic:      q.subtopic || undefined,
    difficulty:    q.difficulty || 'medium',
    questionMd:    q.questionMd || '',
    codeBlock:     (q.codeBlock  && q.codeBlock.trim())      ? q.codeBlock  : undefined,
    codeLanguage:  (q.codeLanguage && q.codeLanguage.trim()) ? q.codeLanguage : undefined,
    options,
    correctAnswer,
    explanationMd: q.explanationMd || 'No explanation provided.',
    tags:          q.tags || [],
    sourceRefs:    q._sourceRefs || [],
    mergedFromCount: q._mergedFromCount || 1,
    needs_review:  q._needsReview || false,
  };
}

// ── BACKUP ────────────────────────────────────────────────────────────────────
function createBackup() {
  const ts = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = join(BACKUP_BASE, `backup-${ts}`);
  mkdirSync(backupDir, { recursive: true });

  if (existsSync(INDEX_PATH)) {
    copyFileSync(INDEX_PATH, join(backupDir, 'index.json'));
  }

  // Backup alt klasörler dahil tüm quiz dosyaları
  function backupDir2(srcDir, destDir) {
    if (!existsSync(srcDir)) return;
    mkdirSync(destDir, { recursive: true });
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        backupDir2(join(srcDir, entry.name), join(destDir, entry.name));
      } else if (entry.name.endsWith('.json')) {
        copyFileSync(join(srcDir, entry.name), join(destDir, entry.name));
      }
    }
  }
  backupDir2(OUTPUT_DIR, join(backupDir, 'quizzes'));

  return backupDir;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════════════╗');
console.log('║         merge-all.mjs  —  Quiz Data Merge        ║');
console.log('╚══════════════════════════════════════════════════╝\n');

const backupPath = createBackup();
console.log(`✓ Backup alındı → ${backupPath}\n`);

const indexQuizzes = [];
const reportRows   = [];
let totalRaw = 0, totalUnique = 0;

for (const group of GROUPS) {
  console.log(`\n── ${group.id} ──`);

  const rawEntries = [];
  for (const src of group.sources) {
    rawEntries.push(...readSource(src.file, src.priority));
  }
  const rawCount = rawEntries.length;

  if (rawCount === 0) {
    console.warn(`  ⚠ Hiç soru yüklenemedi, grup atlandı.`);
    continue;
  }

  const { unique, exactRemoved, normRemoved, nearRemoved } = dedupGroup(rawEntries);
  const dupesTotal = exactRemoved + normRemoved + nearRemoved;

  const questions = unique.map((e, i) => adaptQuestion(e, group.idPrefix, i));
  const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))].sort();

  const diffCount = { easy: 0, medium: 0, hard: 0 };
  for (const q of questions) diffCount[q.difficulty] = (diffCount[q.difficulty] || 0) + 1;
  const dominantDiff = (Object.entries(diffCount).sort((a, b) => b[1] - a[1])[0]?.[0]) || group.difficulty;

  const quizJson = {
    meta: {
      id:               group.id,
      title:            group.title,
      description:      group.description,
      source:           group.source,
      course:           group.course,
      topic:            group.topic,
      topics,
      questionCount:    questions.length,
      difficulty:       dominantDiff,
      estimatedMinutes: Math.round(questions.length * 1.5),
      tags:             group.tags,
      fileName:         group.outputFile,
    },
    questions,
  };

  // Alt klasörü oluştur (dwp/ veya irs/)
  const outPath = join(OUTPUT_DIR, group.outputFile);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(quizJson, null, 2), 'utf-8');

  indexQuizzes.push(quizJson.meta);
  reportRows.push({
    id: group.id, srcCount: group.sources.length,
    raw: rawCount, unique: questions.length,
    dupes: dupesTotal, exact: exactRemoved, norm: normRemoved, near: nearRemoved,
  });

  totalRaw    += rawCount;
  totalUnique += questions.length;

  console.log(
    `  → ${rawCount} ham → ${questions.length} benzersiz` +
    ` (${dupesTotal} kaldırıldı: ${exactRemoved} exact, ${normRemoved} norm, ${nearRemoved} yakın)`,
  );
}

// index.json yaz
const indexJson = {
  version:     '3.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  quizzes:     indexQuizzes,
};
writeFileSync(INDEX_PATH, JSON.stringify(indexJson, null, 2), 'utf-8');
console.log(`\n✓ index.json yazıldı (${indexQuizzes.length} quiz)`);

// Rapor yaz
const totalDupes = totalRaw - totalUnique;
let report = `# Merge-All Raporu\n\n`;
report += `**Tarih**: ${new Date().toISOString()}\n\n`;
report += `| Quiz | Kaynak | Ham | Benzersiz | Kaldırılan | Exact | Norm | Yakın |\n`;
report += `|------|--------|-----|-----------|-----------|-------|------|-------|\n`;
for (const r of reportRows) {
  report += `| ${r.id} | ${r.srcCount} | ${r.raw} | ${r.unique} | ${r.dupes} | ${r.exact} | ${r.norm} | ${r.near} |\n`;
}
report += `| **Toplam** | — | **${totalRaw}** | **${totalUnique}** | **${totalDupes}** | — | — | — |\n`;
report += `\n## Backup\n\n\`${backupPath}\`\n`;
writeFileSync(join(REPORT_DIR, 'merge-all-report.md'), report, 'utf-8');
console.log(`✓ Rapor: reports/merge-all-report.md`);

console.log('\n╔══════════════════════════════════════════════════╗');
console.log(`║  Toplam: ${String(totalRaw).padStart(4)} ham → ${String(totalUnique).padStart(4)} benzersiz soru    ║`);
console.log(`║  ${String(totalDupes).padStart(4)} yinelenen kaldırıldı                      ║`);
console.log(`║  ${String(indexQuizzes.length).padStart(4)} quiz dosyası üretildi                     ║`);
console.log('╚══════════════════════════════════════════════════╝');
