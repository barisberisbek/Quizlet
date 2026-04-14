/**
 * IRS Integration Script
 * 
 * Scans incoming-retrieval-json,
 * deduplicates Q1 & Q1-v2 etc.,
 * adapts to platform schema, and appends to index.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const IRS_DIR = join(process.cwd(), 'incoming-retrieval-json');
const OUTPUT_DIR = join(process.cwd(), 'public', 'data', 'quizzes');
const INDEX_PATH = join(process.cwd(), 'public', 'data', 'index.json');
const REPORT_DIR = join(process.cwd(), 'reports');
mkdirSync(REPORT_DIR, { recursive: true });

// ── Helpers ───────────────────────────────────────────────
function readJson(filepath) {
  try {
    const raw = readFileSync(filepath, 'utf-8').replace(/^\uFEFF/, '');
    return { ok: true, data: JSON.parse(raw), err: null };
  } catch (e) { return { ok: false, data: null, err: e.message }; }
}

function normalizeText(t) {
  if (!t) return '';
  return t.toLowerCase().trim()
    .replace(/\r\n/g, '\n').replace(/\s+/g, ' ')
    .replace(/^(soru\s*\d+[\.\)\:]?\s*)/i, '')
    .replace(/^(question\s*\d+[\.\)\:]?\s*)/i, '')
    .replace(/^(\d+[\.\)\:]?\s*)/, '')
    .replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[–—]/g, '-')
    .replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u').replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o').replace(/Ç/g, 'c').replace(/ç/g, 'c');
}

function optionsFingerprint(opts) {
  if (!opts) return '';
  return opts.map(o => normalizeText(o.text || '')).sort().join('|||');
}

function answerFingerprint(ans) {
  if (!ans) return '';
  return (Array.isArray(ans) ? ans : [ans]).map(a => String(a).toLowerCase()).sort().join(',');
}

function exactFP(q) {
  return `${(q.questionMd||'').trim()}|||${optionsFingerprint(q.options)}|||${answerFingerprint(q.correctAnswer)}`;
}

function normFP(q) {
  return `${normalizeText(q.questionMd||'')}|||${optionsFingerprint(q.options)}|||${answerFingerprint(q.correctAnswer)}`;
}

function wordSimilarity(a, b) {
  const wa = new Set(normalizeText(a).split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(normalizeText(b).split(/\s+/).filter(w => w.length > 2));
  if (!wa.size && !wb.size) return 1;
  if (!wa.size || !wb.size) return 0;
  const inter = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return inter / union;
}

function scorePriority(q, sourceLabel) {
  let s = 0;
  if (sourceLabel.includes('-v2')) s += 100; // v2 files win
  if (q.explanationMd && q.explanationMd.length > 30) s += 3;
  if (q.codeBlock && q.codeBlock.trim()) s += 2;
  if (q.tags && q.tags.length) s += 1;
  if (q.topic) s += 0.5;
  if (q.subtopic) s += 0.5;
  if (q.difficulty) s += 0.5;
  return s;
}

function detectQuizGroup(filename) {
  const fn = filename.toLowerCase();
  if (fn.includes('new-mix')) return 'New-Mix';
  if (fn.includes('old-midterm')) return 'Old-Midterm';
  if (fn.includes('old-final')) return 'Old-Final';
  
  const m = fn.match(/q(\d)/);
  if (m) return `Q${m[1]}`;
  
  return 'Other';
}

function adaptToSchema(q, quizTag, idx) {
  const options = (q.options || []).map((o, i) => ({
    id: (o.id || String.fromCharCode(97 + i)).toLowerCase(),
    label: o.label || o.id || String.fromCharCode(65 + i),
    text: o.text || '',
  }));
  const correctAnswer = (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer || ''])
    .map(a => a.toLowerCase());
  return {
    id: `${quizTag.toLowerCase()}-irs-${String(idx+1).padStart(3,'0')}`,
    type: q.type || 'single_choice',
    topic: q.topic || 'IRS General',
    subtopic: q.subtopic || undefined,
    difficulty: q.difficulty || 'medium',
    questionMd: q.questionMd || '',
    codeBlock: (q.codeBlock && q.codeBlock.trim()) ? q.codeBlock : undefined,
    codeLanguage: (q.codeLanguage && q.codeLanguage.trim()) ? q.codeLanguage : undefined,
    options,
    correctAnswer,
    explanationMd: q.explanationMd || 'No explanation provided.',
    tags: q.tags || [],
    sourceRefs: q._sourceRefs || [],
    mergedFromCount: q._mergedFromCount || 1,
    needs_review: q._needsReview || false,
  };
}

// ── Phase 1: Discover & Parse ─────────────────────────────
console.log('=== Phase 1: Discovery ===\n');

const files = readdirSync(IRS_DIR).filter(f => f.endsWith('.json'));
const validFiles = [];
for (const f of files) {
  const fp = join(IRS_DIR, f);
  const { ok, data, err } = readJson(fp);
  if (ok) {
    validFiles.push({ file: f, data, questions: data.questions || [] });
    console.log(`  ✓ ${f}: ${data.questions?.length || 0} questions`);
  } else {
    console.log(`  ✗ ${f}: PARSE ERROR: ${err}`);
  }
}

// ── Phase 2: Group ────────────────────────────────────────
console.log('\n=== Phase 2: Grouping ===\n');

const groups = {};  // tag -> [{ question, priorityLabel, file }]

for (const f of validFiles) {
  const group = detectQuizGroup(f.file);
  if (!groups[group]) groups[group] = [];
  for (const q of f.questions) {
    groups[group].push({
      question: q,
      priorityLabel: f.file, // pass filename for v2 scoring
      file: f.file,
    });
  }
}

for (const [g, items] of Object.entries(groups)) {
  console.log(`  ${g}: ${items.length} raw questions`);
}

// ── Phase 3: Global Dedup ─────────────────────────────────
console.log('\n=== Phase 3: Global Deduplication ===\n');

const globalPool = [];
for (const [g, items] of Object.entries(groups)) {
  for (const item of items) {
    globalPool.push({ ...item, group: g });
  }
}

const totalRawQuestions = globalPool.length;

// Pass 1: Exact duplicates
const exactMap = new Map();
for (const entry of globalPool) {
  const fp = exactFP(entry.question);
  if (!exactMap.has(fp)) exactMap.set(fp, []);
  exactMap.get(fp).push(entry);
}

let exactDups = 0;
const afterExact = [];
for (const [, entries] of exactMap) {
  if (entries.length > 1) exactDups += entries.length - 1;
  entries.sort((a, b) => scorePriority(b.question, b.priorityLabel) - scorePriority(a.question, a.priorityLabel));
  const best = entries[0];
  const allSources = [...new Set(entries.map(e => e.file))];
  afterExact.push({
    question: { ...best.question, _sourceRefs: allSources, _mergedFromCount: allSources.length },
    priorityLabel: best.priorityLabel,
    group: best.group,
  });
}
console.log(`After exact dedup: ${afterExact.length} (removed ${exactDups})`);

// Pass 2: Normalized duplicates
const normMap = new Map();
for (const entry of afterExact) {
  const fp = normFP(entry.question);
  if (!normMap.has(fp)) normMap.set(fp, []);
  normMap.get(fp).push(entry);
}

let normDups = 0;
const afterNorm = [];
for (const [, entries] of normMap) {
  if (entries.length > 1) normDups += entries.length - 1;
  entries.sort((a, b) => scorePriority(b.question, b.priorityLabel) - scorePriority(a.question, a.priorityLabel));
  const best = entries[0];
  const allSources = [...new Set(entries.flatMap(e => e.question._sourceRefs || [e.file]))];
  afterNorm.push({
    question: { ...best.question, _sourceRefs: allSources, _mergedFromCount: allSources.length },
    priorityLabel: best.priorityLabel,
    group: best.group,
  });
}
console.log(`After normalized dedup: ${afterNorm.length} (removed ${normDups})`);

// Pass 3: Near duplicates
let nearDups = 0;
const used = new Set();
const afterNear = [];

for (let i = 0; i < afterNorm.length; i++) {
  if (used.has(i)) continue;
  const cluster = [afterNorm[i]];
  for (let j = i + 1; j < afterNorm.length; j++) {
    if (used.has(j)) continue;
    const sim = wordSimilarity(
      afterNorm[i].question.questionMd || '',
      afterNorm[j].question.questionMd || ''
    );
    if (sim > 0.85) {
      cluster.push(afterNorm[j]);
      used.add(j);
      nearDups++;
    }
  }
  used.add(i);
  cluster.sort((a, b) => scorePriority(b.question, b.priorityLabel) - scorePriority(a.question, a.priorityLabel));
  const best = cluster[0];
  const allSources = [...new Set(cluster.flatMap(e => e.question._sourceRefs || [e.file]))];
  const needsReview = cluster.length > 1;
  afterNear.push({
    question: { ...best.question, _sourceRefs: allSources, _mergedFromCount: allSources.length, _needsReview: needsReview },
    priorityLabel: best.priorityLabel,
    group: best.group,
  });
}
console.log(`After near dedup: ${afterNear.length} (removed ${nearDups})`);

// ── Phase 4: Re-group & Build Platform Files ──────────────
const finalGroups = {};
for (const entry of afterNear) {
  const g = entry.group;
  if (!finalGroups[g]) finalGroups[g] = [];
  finalGroups[g].push(entry);
}

console.log('\n=== Phase 4: Building Platform Files ===\n');

const newQuizzesMeta = [];

for (const [tag, entries] of Object.entries(finalGroups).sort(([a],[b]) => a.localeCompare(b))) {
  // E.g. tag = "Q1" or "New-Mix"
  const fileName = `irs-${tag.toLowerCase()}-merged.json`;
  
  const questions = entries.map((e, i) => adaptToSchema(e.question, tag, i));
  const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))].sort();
  
  const titleMap = {
    'Q1': 'Quiz 1 — IR Fundamentals',
    'Q2': 'Quiz 2 — Retrieval Models',
    'Q3': 'Quiz 3 — Evaluation',
    'Q4': 'Quiz 4 — Crawling & Architecture',
    'Q5': 'Quiz 5 — Indexing',
    'Q6': 'Quiz 6 — Web Search',
    'New-Mix': 'New Mix Questions',
    'Old-Midterm': 'Old Midterm Questions',
    'Old-Final': 'Old Final Questions',
  };
  
  const descMap = {
    'Q1': 'Vocabulary mismatch, Term Frequency, basic IR queries.',
    'Q2': 'Vector space model, BM25, probabilistic models.',
    'Q3': 'Precision, recall, MAP, NDCG, and Cranfield evaluation model.',
    'Q4': 'Web scraping protocols, online vs offline processing, indexing architecture.',
    'Q5': 'Inverted indices, skip pointers, compression algorithms.',
    'Q6': 'PageRank, HITS, adversarial web IR.',
  };

  const quizTitle = `[IRS] ${titleMap[tag] || tag}`;
  const quizDesc = descMap[tag] || 'A collection of Information Retrieval Systems exam questions.';
  
  const quizJson = {
    meta: {
      id: `irs-${tag.toLowerCase()}-merged`,
      title: quizTitle,
      description: quizDesc,
      source: 'IRS Past Exams',
      course: 'Information Retrieval Systems',
      topic: topics[0] || 'General IRS',
      topics,
      questionCount: questions.length,
      difficulty: 'medium',
      estimatedMinutes: Math.ceil(questions.length * 1.5),
      tags: ['irs', tag.toLowerCase(), 'merged'],
      fileName,
    },
    questions,
  };
  
  const outPath = join(OUTPUT_DIR, fileName);
  writeFileSync(outPath, JSON.stringify(quizJson, null, 2), 'utf-8');
  console.log(`  ✓ ${fileName}: ${questions.length} questions`);
  newQuizzesMeta.push(quizJson.meta);
}

// Update index.json by appending if not present
let indexJson = { version: '3.0.0', lastUpdated: new Date().toISOString().split('T')[0], quizzes: [] };
if (existsSync(INDEX_PATH)) {
  try {
    indexJson = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  } catch (e) {}
}

const existingIds = new Set(indexJson.quizzes.map(q => q.id));

// Default course for older quizzes
for (let q of indexJson.quizzes) {
  if (!q.course) {
    q.course = 'Dynamic Web Programming';
  }
}

// Add new irs quizzes, replacing any existing ones with same ID
for (const meta of newQuizzesMeta) {
  const targetIdx = indexJson.quizzes.findIndex(q => q.id === meta.id);
  if (targetIdx !== -1) {
    indexJson.quizzes[targetIdx] = meta;
  } else {
    indexJson.quizzes.push(meta);
  }
}

writeFileSync(INDEX_PATH, JSON.stringify(indexJson, null, 2), 'utf-8');
console.log(`\n✓ Updated index.json with IRS quizzes (Total: ${indexJson.quizzes.length} global quizzes)`);

// Generate brief report
let r1 = `# IRS Information Retrieval Integration Report\n\n`;
r1 += `**Generated**: ${new Date().toISOString()}\n\n`;
r1 += `| Metric | Count |\n|--------|-------|\n`;
r1 += `| Total raw IRS questions | ${totalRawQuestions} |\n`;
r1 += `| Deduplicates removed | ${totalRawQuestions - afterNear.length} |\n`;
r1 += `| **Final unique IRS questions** | **${afterNear.length}** |\n\n`;

r1 += `## Resulting Files\n\n`;
for (const q of newQuizzesMeta) {
  r1 += `- \`${q.fileName}\`: ${q.questionCount} questions\n`;
}

writeFileSync(join(REPORT_DIR, 'irs-integration.md'), r1, 'utf-8');
console.log('  ✓ irs-integration.md');
