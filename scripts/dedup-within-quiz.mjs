/**
 * dedup-within-quiz.mjs
 *
 * Her quiz dosyası içinde tekrar eden soruları temizler.
 * Kriter: normalize(questionMd) EŞİT VE correctAnswer EŞİT olan çiftler.
 *
 * Strateji:
 *   - İlk geçen soru korunur, sonrakiler silinir.
 *   - Silinen sorunun explanationMd'si tutulandan daha uzunsa, tutulan soruya
 *     merge edilir (içerik kaybı olmaz).
 *   - ID'ler sıfırdan yeniden numaralandırılır (prefix-001 formatı).
 *   - Çalışmadan önce public/data/_backups/ altına backup alınır.
 *   - reports/dedup-within-quiz-report.md üretilir.
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';

const CWD         = process.cwd();
const QUIZ_ROOT   = join(CWD, 'public', 'data', 'quizzes');
const BACKUP_BASE = join(CWD, 'public', 'data', '_backups');
const REPORT_DIR  = join(CWD, 'reports');

mkdirSync(BACKUP_BASE, { recursive: true });
mkdirSync(REPORT_DIR,  { recursive: true });

// ── helpers ──────────────────────────────────────────────────────────────────

function normalize(text = '') {
  return text
    .toLowerCase()
    .replace(/[çÇ]/g, 'c').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[ıİ]/g, 'i')
    .replace(/`/g, '')          // backtick formatting
    .replace(/\*+/g, '')        // bold/italic markdown
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCorrectAnswerText(q) {
  const key = String(q.correctAnswer || '').trim().toLowerCase();
  const opt = (q.options || []).find(o =>
    String(o.id    || '').toLowerCase() === key ||
    String(o.label || '').toLowerCase() === key
  );
  // fall back to the raw key if options aren't structured as expected
  return normalize(opt?.text || key);
}

function fingerprint(q) {
  return normalize(q.questionMd || '') + '|||' + getCorrectAnswerText(q);
}

/** Pad number to 3 digits: 1 → "001" */
function pad(n) { return String(n).padStart(3, '0'); }

/** Collect all .json files recursively under a dir */
function collectJsonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectJsonFiles(full));
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('_')) results.push(full);
  }
  return results;
}

/** Deep-copy a directory for backup */
function backupDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) backupDir(s, d);
    else copyFileSync(s, d);
  }
}

// ── backup ───────────────────────────────────────────────────────────────────

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupDest = join(BACKUP_BASE, `dedup-backup-${ts}`);
console.log(`Backing up → ${backupDest}`);
backupDir(QUIZ_ROOT, backupDest);
console.log('Backup complete.\n');

// ── process files ─────────────────────────────────────────────────────────────

const files = collectJsonFiles(QUIZ_ROOT);
const reportLines = [
  '# Dedup Within-Quiz Report',
  `Generated: ${new Date().toISOString()}`,
  '',
];

let grandTotalRemoved = 0;
let grandTotalKept    = 0;

for (const filePath of files.sort()) {
  const label = filePath.replace(QUIZ_ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  const raw   = JSON.parse(readFileSync(filePath, 'utf8'));

  if (!Array.isArray(raw.questions) || raw.questions.length === 0) continue;

  const original = raw.questions;
  const seen     = new Map();   // fingerprint → winning question object
  const removed  = [];          // { idx, id, questionSnippet, reason }
  const kept     = [];

  for (let i = 0; i < original.length; i++) {
    const q  = original[i];
    const fp = fingerprint(q);

    if (seen.has(fp)) {
      // Duplicate detected
      const winner = seen.get(fp);

      // Merge: keep longer explanationMd
      const expA = (winner.explanationMd || '').trim();
      const expB = (q.explanationMd || '').trim();
      if (expB.length > expA.length) {
        winner.explanationMd = expB;
      }

      // Merge sourceRefs
      if (Array.isArray(q.sourceRefs)) {
        winner.sourceRefs = winner.sourceRefs || [];
        for (const ref of q.sourceRefs) {
          if (!winner.sourceRefs.includes(ref)) winner.sourceRefs.push(ref);
        }
      }

      // Track mergedFromCount
      winner.mergedFromCount = (winner.mergedFromCount || 1) + 1;

      removed.push({
        originalIdx: i + 1,
        id:          q.id,
        snippet:     (q.questionMd || '').slice(0, 90),
        keptId:      winner.id,
      });
    } else {
      seen.set(fp, q);
      kept.push(q);
    }
  }

  const removedCount = removed.length;
  grandTotalRemoved += removedCount;
  grandTotalKept    += kept.length;

  if (removedCount === 0) {
    reportLines.push(`## ${label} — ✓ Already clean (${original.length} questions)`);
    reportLines.push('');
    console.log(`[CLEAN]   ${label} (${original.length} q)`);
    continue;
  }

  // Re-number IDs sequentially using the file's idPrefix from meta
  const idPrefix = (raw.meta?.id || basename(filePath, '.json')).replace('-merged', '');
  for (let i = 0; i < kept.length; i++) {
    kept[i].id = `${idPrefix}-${pad(i + 1)}`;
  }

  raw.questions = kept;
  writeFileSync(filePath, JSON.stringify(raw, null, 2), 'utf8');

  reportLines.push(`## ${label}`);
  reportLines.push(`- Before: **${original.length}** questions`);
  reportLines.push(`- After:  **${kept.length}** questions`);
  reportLines.push(`- Removed: **${removedCount}** duplicates`);
  reportLines.push('');
  reportLines.push('| Removed ID | Snippet | Kept As |');
  reportLines.push('|------------|---------|---------|');
  for (const r of removed) {
    reportLines.push(`| \`${r.id}\` | ${r.snippet.replace(/\|/g, '\\|')}... | \`${r.keptId}\` |`);
  }
  reportLines.push('');

  console.log(`[CLEANED] ${label}: ${original.length} → ${kept.length} (-${removedCount})`);
  for (const r of removed) {
    console.log(`          removed ${r.id} (kept as ${r.keptId}): ${r.snippet.slice(0, 60)}...`);
  }
}

// ── summary ──────────────────────────────────────────────────────────────────

reportLines.unshift(
  '',
  `**Total removed:** ${grandTotalRemoved} duplicate questions`,
  `**Total kept:**    ${grandTotalKept} unique questions`,
  '',
);

const reportPath = join(REPORT_DIR, 'dedup-within-quiz-report.md');
writeFileSync(reportPath, reportLines.join('\n'), 'utf8');

console.log(`\n✓ Done. Removed ${grandTotalRemoved} duplicates, kept ${grandTotalKept} unique questions.`);
console.log(`✓ Report → ${reportPath}`);
