import { COUPLE_QUESTIONS } from '../src/data/truthDare';

const ORPHAN = ['confession','taboo','third','dirtytalk','slutwife','cuckold','swing','exposure','home'];
const pool = COUPLE_QUESTIONS.filter(q => ORPHAN.includes(q.theme));

const patterns: [string, RegExp][] = [
  ['老婆', /老婆/g], ['老公', /老公/g], ['妻子', /妻子/g], ['丈夫', /丈夫/g],
  ['她', /她/g], ['他', /他/g], ['我', /我/g], ['你', /你/g], ['自己', /自己/g],
  ['咱', /咱/g], ['我们', /我们/g], ['伴侣', /伴侣/g], ['另一半', /另一半/g],
];
console.log('════════ 孤儿 1131 题的代词分布 ════════');
for (const [name, re] of patterns) {
  let n = 0, withQ = 0;
  for (const q of pool) { const c = (q.text.match(re) || []).length; n += c; if (c && q.type==='truth') withQ++; }
  console.log(`${name.padEnd(6)} 出现 ${String(n).padStart(4)} 次   其中落在 truth 题 ${String(withQ).padStart(4)} 条`);
}

console.log('\n════════ 含「我」且需防误伤的词 ════════');
const risky = ['自我','我们','忘我','忘乎所以','忘我地','自我安慰','自我暗示','忘我境界'];
for (const w of risky) {
  const n = pool.filter(q => q.text.includes(w)).length;
  if (n) console.log(`  ${w}: ${n} 条`);
}
console.log('\n「我们」出现条数:', pool.filter(q=>q.text.includes('我们')).length);
console.log('「自我」出现条数:', pool.filter(q=>q.text.includes('自我')).length);

console.log('\n════════ truth 题样例（含代词的）════════');
const samples = pool.filter(q=>q.type==='truth' && /[我她他老婆老公]/.test(q.text)).slice(0,10);
for (const q of samples) console.log(`  [${q.target}] ${q.text}`);

console.log('\n════════ dare 题样例（含代词的）════════');
const dsamples = pool.filter(q=>q.type==='dare' && /[我她他老婆老公]/.test(q.text)).slice(0,10);
for (const q of dsamples) console.log(`  [${q.target}] ${q.text}`);
