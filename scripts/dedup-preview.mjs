import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const base = process.cwd();
const v1 = join(base, 'incoming-json');
const v2 = join(base, 'incomingv2-json');
const irs = join(base, 'incoming-retrieval-json');

function norm(t) {
  return (t || '').toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'");
}

function fp(q) {
  const qText = norm(q.questionMd || '');
  const ans = (q.correctAnswer || []).map(a => a.toUpperCase()).sort().join(',');
  return `${qText} ||| ${ans}`;
}

function readQ(dir, file) {
  try {
    const raw = readFileSync(join(dir, file), 'utf-8').replace(/^\uFEFF/, '');
    const d = JSON.parse(raw);
    return d.questions || [];
  } catch (e) { return []; }
}

function mergeAndDedup(sources) {
  // sources: [{dir, file}]
  const all = [];
  for (const s of sources) {
    const qs = readQ(s.dir, s.file);
    for (const q of qs) all.push({ ...q, _src: s.file });
  }
  const seen = new Map();
  for (const q of all) {
    const k = fp(q);
    if (!seen.has(k)) seen.set(k, q);
  }
  return { raw: all.length, unique: seen.size };
}

console.log('=== DWP DEDUP PREVIEW ===\n');

const dwpMap = {
  'Q1': {
    v1: ['Dynamic Web Programming - Quiz 1.json', 'Q1-Berhudan.json'],
    v2: ['dwp_quiz1_merged.json']
  },
  'Q2': {
    v1: ['Dynamic Web Programming - Emir Quiz 2.json', 'Dynamic Web Programming - Quiz 2 Sema.json', 'Dynamic Web Programming - Quiz 2.json', 'Q2-Berhudan.json', 'Q2-Web2.json'],
    v2: ['dwp_quiz2_merged.json']
  },
  'Q3': {
    v1: ['Dynamic Web Programming - Emir Quiz 3.json', 'Dynamic Web Programming - Quiz 3 Sema.json', 'Dynamic Web Programming - Quiz 3.json', 'Q3-Berhudan.json', 'Q3-Web2.json'],
    v2: ['dwp_quiz3_merged.json']
  },
  'Q4': {
    v1: ['Dynamic Web Programming - Emir Quiz 4.json', 'Dynamic Web Programming - Quiz 4 Sema.json', 'Dynamic Web Programming - Quiz 4.json', 'Q4-Berhudan.json', 'Q4-Web2.json'],
    v2: ['dwp_quiz4_merged.json']
  }
};

let dwpTotal = 0;
for (const [g, src] of Object.entries(dwpMap)) {
  const sources = [];
  for (const f of src.v1) sources.push({ dir: v1, file: f });
  for (const f of src.v2) sources.push({ dir: v2, file: f });
  const r = mergeAndDedup(sources);
  console.log(`  ${g}: ${r.raw} raw → ${r.unique} unique (${r.raw - r.unique} duplicate removed)`);
  dwpTotal += r.unique;
}

const oldQs = readQ(v2, 'dwp_old_examples.json');
console.log(`  Old-Exam: ${oldQs.length} (tek dosya, dedup gereksiz)`);
dwpTotal += oldQs.length;
console.log(`\n  DWP TOPLAM: ${dwpTotal} unique soru (5 dosya)\n`);

console.log('=== IRS DEDUP PREVIEW ===\n');

const irsMap = {
  'Q1': ['Q1.json', 'Q1-v2.json'],
  'Q2': ['Q2.json', 'Q2-v2.json'],
  'Q3': ['Q3.json', 'Q3-v2.json'],
  'Q4': ['Q4.json', 'Q4-v2.json'],
  'Q5': ['Q5.json', 'Q5-v2.json'],
  'Q6': ['Q6.json', 'Q6-v2.json'],
};

let irsTotal = 0;
for (const [g, files] of Object.entries(irsMap)) {
  const sources = files.map(f => ({ dir: irs, file: f }));
  const r = mergeAndDedup(sources);
  console.log(`  ${g}: ${r.raw} raw → ${r.unique} unique (${r.raw - r.unique} duplicate removed)`);
  irsTotal += r.unique;
}

const singles = {
  'Old-Midterm': 'Old-Midterm.json',
  'Old-Final': 'Old-Final.json',
  'New-Mix': 'new-mix.json',
};
for (const [g, f] of Object.entries(singles)) {
  const qs = readQ(irs, f);
  console.log(`  ${g}: ${qs.length} (tek dosya)`);
  irsTotal += qs.length;
}
console.log(`\n  IRS TOPLAM: ${irsTotal} unique soru (9 dosya)\n`);

console.log(`=== GENEL TOPLAM: ${dwpTotal + irsTotal} unique soru (14 dosya) ===`);
