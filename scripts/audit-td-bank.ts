import * as COUPLE from '../src/data/couple/index';
import { TDQuestion } from '../src/types';

const entries = Object.entries(COUPLE) as [string, TDQuestion[]][];
let total = 0;
const rows: string[] = [];
for (const [name, arr] of entries) {
  if (!Array.isArray(arr)) continue;
  total += arr.length;
  const byType: Record<string, number> = {};
  const byDiff: Record<string, number> = {};
  const byTarget: Record<string, number> = {};
  for (const q of arr) {
    byType[q.type] = (byType[q.type] || 0) + 1;
    byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
    byTarget[q.target] = (byTarget[q.target] || 0) + 1;
  }
  rows.push(
    `${name.padEnd(34)} ${String(arr.length).padStart(4)}  ` +
    `truth/dare=${byType.truth || 0}/${byType.dare || 0}  ` +
    `diff=${Object.entries(byDiff).map(([k, v]) => `${k}:${v}`).join(',')}  ` +
    `target=${Object.entries(byTarget).map(([k, v]) => `${k}:${v}`).join(',')}`
  );
}
console.log('════════ 情侣原始 TD 题库 ════════');
console.log(rows.join('\n'));
console.log(`\n导出组数: ${entries.length}   题目总数: ${total}`);
