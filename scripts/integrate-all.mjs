/**
 * Full Quiz Integration Script
 * 
 * Scans incomingv2-json (canonical) and incoming-json (secondary),
 * deduplicates globally across all sources in 3 passes,
 * adapts to platform schema, and writes final quiz files + index.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const V2_DIR = join(process.cwd(), 'incomingv2-json');
const V1_DIR = join(process.cwd(), 'incoming-json');
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

function stemFP(q) { return normalizeText(q.questionMd || ''); }

function wordSimilarity(a, b) {
  const wa = new Set(normalizeText(a).split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(normalizeText(b).split(/\s+/).filter(w => w.length > 2));
  if (!wa.size && !wb.size) return 1;
  if (!wa.size || !wb.size) return 0;
  const inter = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return inter / union;
}

function scorePriority(q, source) {
  let s = 0;
  if (source === 'v2') s += 100; // canonical always wins
  if (q.explanationMd && q.explanationMd.length > 30) s += 3;
  if (q.codeBlock && q.codeBlock.trim()) s += 2;
  if (q.tags && q.tags.length) s += 1;
  if (q.topic) s += 0.5;
  if (q.subtopic) s += 0.5;
  if (q.difficulty) s += 0.5;
  return s;
}

function detectQuizGroup(filename, quizId, title) {
  const fn = filename.toLowerCase();
  // old examples
  if (fn.includes('old_examples') || fn.includes('old examples') || fn.includes('çıkmış') || fn.includes('mert')) return 'old';
  const m1 = fn.match(/quiz\s*(\d)/i) || fn.match(/q(\d)/i);
  if (m1) return `q${m1[1]}`;
  if (quizId) {
    const m2 = String(quizId).match(/(\d)/);
    if (m2) return `q${m2[1]}`;
  }
  if (title) {
    const m3 = String(title).match(/quiz\s*(\d)/i);
    if (m3) return `q${m3[1]}`;
  }
  return 'other';
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
    id: `${quizTag}-${String(idx+1).padStart(3,'0')}`,
    type: q.type || 'single_choice',
    topic: q.topic || 'General',
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

function scanDir(dir, priority) {
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  const results = [];
  for (const f of files) {
    const fp = join(dir, f);
    const { ok, data, err } = readJson(fp);
    results.push({ file: f, dir, priority, ok, data, err, questions: ok ? (data.questions || []) : [] });
    console.log(`  ${ok ? '✓' : '✗'} [${priority}] ${f}: ${ok ? (data.questions||[]).length + ' questions' : 'PARSE ERROR: ' + err}`);
  }
  return results;
}

const v2Files = scanDir(V2_DIR, 'v2');
const v1Files = scanDir(V1_DIR, 'v1');
const allFiles = [...v2Files, ...v1Files];

console.log(`\nTotal files: ${allFiles.length} (${v2Files.length} v2, ${v1Files.length} v1)`);
const validFiles = allFiles.filter(f => f.ok);
const invalidFiles = allFiles.filter(f => !f.ok);

// ── Phase 2: Group ────────────────────────────────────────
console.log('\n=== Phase 2: Grouping ===\n');

const groups = {};  // tag -> [{ question, source, sourceFile }]

for (const f of validFiles) {
  const group = detectQuizGroup(f.file, f.data?.quizId, f.data?.title);
  if (!groups[group]) groups[group] = [];
  for (const q of f.questions) {
    groups[group].push({
      question: q,
      source: f.priority,
      sourceFile: f.file,
    });
  }
}

for (const [g, items] of Object.entries(groups)) {
  console.log(`  ${g}: ${items.length} raw questions`);
}

// ── Phase 3: Global Dedup ─────────────────────────────────
console.log('\n=== Phase 3: Global Deduplication ===\n');

// Collect ALL questions from ALL groups into one flat pool for global dedup
const globalPool = [];
for (const [g, items] of Object.entries(groups)) {
  for (const item of items) {
    globalPool.push({ ...item, group: g });
  }
}

const totalRawQuestions = globalPool.length;
console.log(`Total raw questions across all files: ${totalRawQuestions}`);

// Pass 1: Exact duplicates (global)
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
  // Pick best version (v2 wins)
  entries.sort((a, b) => scorePriority(b.question, b.source) - scorePriority(a.question, a.source));
  const best = entries[0];
  const allSources = [...new Set(entries.map(e => e.sourceFile))];
  afterExact.push({
    question: { ...best.question, _sourceRefs: allSources, _mergedFromCount: allSources.length },
    source: best.source,
    group: best.group,
  });
}
console.log(`After exact dedup: ${afterExact.length} (removed ${exactDups})`);

// Pass 2: Normalized duplicates (global)
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
  entries.sort((a, b) => scorePriority(b.question, b.source) - scorePriority(a.question, a.source));
  const best = entries[0];
  const allSources = [...new Set(entries.flatMap(e => e.question._sourceRefs || [e.sourceFile]))];
  afterNorm.push({
    question: { ...best.question, _sourceRefs: allSources, _mergedFromCount: allSources.length },
    source: best.source,
    group: best.group,
  });
}
console.log(`After normalized dedup: ${afterNorm.length} (removed ${normDups})`);

// Pass 3: Near duplicates (global, stem similarity > 0.85)
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
  cluster.sort((a, b) => scorePriority(b.question, b.source) - scorePriority(a.question, a.source));
  const best = cluster[0];
  const allSources = [...new Set(cluster.flatMap(e => e.question._sourceRefs || [e.sourceFile]))];
  const needsReview = cluster.length > 1;
  afterNear.push({
    question: { ...best.question, _sourceRefs: allSources, _mergedFromCount: allSources.length, _needsReview: needsReview },
    source: best.source,
    group: best.group,
  });
}
console.log(`After near dedup: ${afterNear.length} (removed ${nearDups})`);
console.log(`\nTotal duplicates removed: ${totalRawQuestions - afterNear.length}`);

// ── Phase 4: Re-group deduped questions ───────────────────
const finalGroups = {};
for (const entry of afterNear) {
  const g = entry.group;
  if (!finalGroups[g]) finalGroups[g] = [];
  finalGroups[g].push(entry);
}

// ── Phase 5: Build platform files ─────────────────────────
console.log('\n=== Phase 5: Building Platform Files ===\n');

const quizMeta = {
  q1: { title: 'Quiz 1 — Web Fundamentals & JavaScript Basics', desc: 'Web history, HTML, HTTP, networking, CSS basics, and JavaScript fundamentals.', topic: 'Web Fundamentals', diff: 'medium' },
  q2: { title: 'Quiz 2 — DOM, Events & Async JavaScript', desc: 'DOM manipulation, event handling, async/await, promises, and browser APIs.', topic: 'DOM & Events', diff: 'medium' },
  q3: { title: 'Quiz 3 — Node.js, Express & Server-Side', desc: 'Node.js runtime, Express middleware, routing, templating, and server-side concepts.', topic: 'Node.js & Express', diff: 'medium' },
  q4: { title: 'Quiz 4 — REST, Databases & Security', desc: 'REST API design, database concepts, authentication, cookies, sessions, and security.', topic: 'REST & Security', diff: 'hard' },
  old: { title: 'Old Exam Examples', desc: 'Mixed questions from past DWP exams including true/false, Express, Fetch API, and more.', topic: 'Mixed', diff: 'medium' },
  other: { title: 'Additional Questions', desc: 'Uncategorized additional questions.', topic: 'General', diff: 'medium' },
};

const indexQuizzes = [];

for (const [tag, entries] of Object.entries(finalGroups).sort(([a],[b]) => a.localeCompare(b))) {
  const meta = quizMeta[tag] || quizMeta.other;
  const quizId = `${tag}-merged`;
  const fileName = `${tag}-merged.json`;
  
  const questions = entries.map((e, i) => adaptToSchema(e.question, tag, i));
  const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))].sort();
  
  const quizJson = {
    meta: {
      id: quizId,
      title: meta.title,
      description: meta.desc,
      source: 'DWP Past Exams (Merged)',
      topic: meta.topic,
      topics,
      questionCount: questions.length,
      difficulty: meta.diff,
      estimatedMinutes: Math.ceil(questions.length * 1.5),
      tags: [tag, 'merged', 'past-exam'],
      fileName,
    },
    questions,
  };
  
  const outPath = join(OUTPUT_DIR, fileName);
  writeFileSync(outPath, JSON.stringify(quizJson, null, 2), 'utf-8');
  console.log(`  ✓ ${fileName}: ${questions.length} questions`);
  indexQuizzes.push(quizJson.meta);
}

// Write index
const indexJson = {
  version: '3.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  quizzes: indexQuizzes,
};
writeFileSync(INDEX_PATH, JSON.stringify(indexJson, null, 2), 'utf-8');
console.log(`\n✓ Wrote index.json with ${indexQuizzes.length} quizzes`);

// Clean up old merged files that are no longer referenced
const oldFiles = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
for (const f of oldFiles) {
  if (!indexQuizzes.find(q => q.fileName === f)) {
    console.log(`  Cleaning stale file: ${f}`);
    const { unlinkSync } = await import('fs');
    unlinkSync(join(OUTPUT_DIR, f));
  }
}

// ── Phase 6: Generate Reports ─────────────────────────────
console.log('\n=== Phase 6: Reports ===\n');

// Report 1: Integration Dedup Report
let r1 = `# Integration & Deduplication Report\n\n`;
r1 += `**Generated**: ${new Date().toISOString()}\n\n`;
r1 += `## Source Files Discovered\n\n`;
r1 += `### incomingv2-json (canonical, ${v2Files.length} files)\n\n`;
for (const f of v2Files) {
  r1 += `- \`${f.file}\`: ${f.ok ? f.questions.length + ' questions ✓' : 'INVALID: ' + f.err}\n`;
}
r1 += `\n### incoming-json (secondary, ${v1Files.length} files)\n\n`;
for (const f of v1Files) {
  r1 += `- \`${f.file}\`: ${f.ok ? f.questions.length + ' questions ✓' : 'INVALID: ' + f.err}\n`;
}

r1 += `\n## Grouping\n\n`;
r1 += `| Group | Raw Questions |\n|-------|---------------|\n`;
for (const [g, items] of Object.entries(groups).sort(([a],[b]) => a.localeCompare(b))) {
  r1 += `| ${g} | ${items.length} |\n`;
}

r1 += `\n## Deduplication Summary\n\n`;
r1 += `| Metric | Count |\n|--------|-------|\n`;
r1 += `| Total raw questions | ${totalRawQuestions} |\n`;
r1 += `| Exact duplicates removed | ${exactDups} |\n`;
r1 += `| Normalized duplicates removed | ${normDups} |\n`;
r1 += `| Near-duplicates merged | ${nearDups} |\n`;
r1 += `| **Total duplicates removed** | **${totalRawQuestions - afterNear.length}** |\n`;
r1 += `| **Final unique questions** | **${afterNear.length}** |\n`;

r1 += `\n## Final Platform Files\n\n`;
r1 += `| File | Questions |\n|------|-----------|\n`;
for (const q of indexQuizzes) {
  r1 += `| \`${q.fileName}\` | ${q.questionCount} |\n`;
}
const totalFinal = indexQuizzes.reduce((s, q) => s + q.questionCount, 0);
r1 += `| **Total** | **${totalFinal}** |\n`;

writeFileSync(join(REPORT_DIR, 'integration-dedup-report.md'), r1, 'utf-8');
console.log('  ✓ integration-dedup-report.md');

// Report 2: Question Accuracy Audit
let r2 = `# Question Accuracy Audit\n\n`;
r2 += `**Generated**: ${new Date().toISOString()}\n\n`;
r2 += `> This is an automated structural audit. Questions flagged as suspicious need manual review.\n\n`;

let suspiciousCount = 0;
let weakExplanations = 0;

for (const q of indexQuizzes) {
  const quizData = JSON.parse(readFileSync(join(OUTPUT_DIR, q.fileName), 'utf-8'));
  r2 += `## ${q.fileName}\n\n`;
  
  for (const question of quizData.questions) {
    let ansStatus = 'correct';
    let expStatus = 'accurate';
    let reasoning = '';
    let review = question.needs_review;
    
    // Check: no correct answer
    if (!question.correctAnswer || question.correctAnswer.length === 0) {
      ansStatus = 'incorrect';
      reasoning = 'No correct answer specified.';
      review = true;
    }
    // Check: correct answer not in options
    else if (question.correctAnswer.some(a => !question.options.find(o => o.id === a))) {
      ansStatus = 'likely_incorrect';
      reasoning = `Answer key "${question.correctAnswer.join(',')}" not found in option IDs: ${question.options.map(o=>o.id).join(',')}`;
      review = true;
    }
    
    // Check explanation quality
    if (!question.explanationMd || question.explanationMd === 'No explanation provided.') {
      expStatus = 'missing';
      weakExplanations++;
    } else if (question.explanationMd.startsWith('Correct answer according to')) {
      expStatus = 'incomplete';
      weakExplanations++;
    } else if (question.explanationMd.length < 20) {
      expStatus = 'incomplete';
      weakExplanations++;
    }
    
    if (question.needs_review) {
      ansStatus = ansStatus === 'correct' ? 'uncertain' : ansStatus;
    }
    
    if (review || ansStatus !== 'correct' || expStatus !== 'accurate') {
      suspiciousCount++;
      const snippet = (question.questionMd || '').substring(0, 60).replace(/\n/g, ' ');
      r2 += `### ${question.id}\n`;
      r2 += `- **Q**: ${snippet}...\n`;
      r2 += `- **Answer**: \`${question.correctAnswer.join(',')}\` → **${ansStatus}**\n`;
      r2 += `- **Explanation**: **${expStatus}**\n`;
      if (reasoning) r2 += `- **Issue**: ${reasoning}\n`;
      r2 += `- **Manual Review**: ${review ? 'YES' : 'no'}\n\n`;
    }
  }
}

writeFileSync(join(REPORT_DIR, 'question-accuracy-audit.md'), r2, 'utf-8');
console.log('  ✓ question-accuracy-audit.md');

// Report 3: Final Platform Summary
let r3 = `# Final Platform Summary\n\n`;
r3 += `**Generated**: ${new Date().toISOString()}\n\n`;
r3 += `## Quiz Files\n\n`;
r3 += `| File | Title | Questions |\n|------|-------|-----------|\n`;
for (const q of indexQuizzes) {
  r3 += `| \`${q.fileName}\` | ${q.title} | ${q.questionCount} |\n`;
}
r3 += `\n## Metrics\n\n`;
r3 += `- **Total unique questions in platform**: ${totalFinal}\n`;
r3 += `- **Total duplicates removed**: ${totalRawQuestions - afterNear.length}\n`;
r3 += `- **Items needing manual review**: ${suspiciousCount}\n`;
r3 += `- **Weak/missing explanations**: ${weakExplanations}\n`;
r3 += `\n## Source Stats\n\n`;
r3 += `- Files in \`incomingv2-json/\`: ${v2Files.length} (${v2Files.reduce((s,f) => s + f.questions.length, 0)} raw Qs)\n`;
r3 += `- Files in \`incoming-json/\`: ${v1Files.length} (${v1Files.reduce((s,f) => s + f.questions.length, 0)} raw Qs)\n`;
r3 += `- Total raw questions analyzed: ${totalRawQuestions}\n`;

writeFileSync(join(REPORT_DIR, 'final-platform-summary.md'), r3, 'utf-8');
console.log('  ✓ final-platform-summary.md');

console.log('\n=== Integration Complete ===');
console.log(`Total: ${totalRawQuestions} raw → ${totalFinal} unique questions`);
