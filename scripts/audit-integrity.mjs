import fs from 'fs';
import path from 'path';

const INCOMING_DIR = path.join(process.cwd(), 'incoming-json');
const MERGED_DIR = path.join(process.cwd(), 'public', 'data', 'quizzes');
const REPORT_DIR = path.join(process.cwd(), 'reports');

const mergedFiles = ['q1-merged.json', 'q2-merged.json', 'q3-merged.json', 'q4-merged.json'];

let integrityReport = `# Parse Integrity Audit Report\n\n`;

for (const mergedFile of mergedFiles) {
  const mergedPath = path.join(MERGED_DIR, mergedFile);
  if (!fs.existsSync(mergedPath)) continue;
  
  const mergedData = JSON.parse(fs.readFileSync(mergedPath, 'utf8'));
  
  integrityReport += `## Quiz: ${mergedFile}\n\n`;
  integrityReport += `| Question ID | Exact Preservation | Discrepancy Type | Source File |\n`;
  integrityReport += `| ----------- | ------------------ | ---------------- | ----------- |\n`;

  for (const q of mergedData.questions) {
    let exactPreserved = true;
    let discrepancyType = 'none';
    const sourceRefs = q.sourceRefs || [];
    
    // We try to find the question in the original source
    let sourceQuestion = null;
    let matchedSourceText = '';
    
    for (const ref of sourceRefs) {
      const sourcePath = path.join(INCOMING_DIR, ref);
      if (fs.existsSync(sourcePath)) {
        const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, ''));
        const sourceQs = Array.isArray(sourceData) ? sourceData : sourceData.questions;
        
        // Match by similar text
        const qTextNorm = (q.questionMd || '').replace(/\s+/g, ' ').trim().toLowerCase();
        for (const sq of sourceQs) {
          const sqTextNorm = (sq.questionMd || sq.question || sq.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
          if (sqTextNorm.includes(qTextNorm) || qTextNorm.includes(sqTextNorm)) {
            sourceQuestion = sq;
            matchedSourceText = sq.questionMd || sq.question || sq.text || '';
            break;
          }
        }
      }
      if (sourceQuestion) break;
    }
    
    if (sourceQuestion) {
      if (matchedSourceText !== q.questionMd) {
        exactPreserved = false;
        discrepancyType = 'formatting_difference'; // mostly numbers stripped
      }
    } else {
       exactPreserved = false;
       discrepancyType = 'text_changed (or match failed)';
    }

    integrityReport += `| \`${q.id}\` | ${exactPreserved ? '✅ Preseved' : '⚠️ Changed'} | ${exactPreserved ? '-' : discrepancyType} | ${sourceRefs.join(', ')} |\n`;
  }
  
  integrityReport += `\n`;
}

fs.writeFileSync(path.join(REPORT_DIR, 'parse-integrity-audit.md'), integrityReport);
console.log('Integrity audit generated.');
