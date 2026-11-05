import { COUPLE_QUESTIONS } from '../src/data/truthDare';
const PKGS = ['exposure', 'home', 'slutwife'];
const pool = COUPLE_QUESTIONS.filter(q => PKGS.includes(q.theme));

console.log('════════ 三个待转主题的 target 分布 ════════');
for (const p of PKGS) {
  const sub = pool.filter(q => q.theme === p);
  const both = sub.filter(q => q.target === 'both').length;
  const male = sub.filter(q => q.target === 'male').length;
  const female = sub.filter(q => q.target === 'female').length;
  console.log(`${p.padEnd(12)} 总${String(sub.length).padStart(4)}  both:${String(both).padStart(4)} male:${String(male).padStart(3)} female:${String(female).padStart(3)}`);
}

console.log('\n════════ 歧义样本：both 目标且同时出现「她」和「他」════════');
const amb = pool.filter(q => q.target === 'both' && /她/.test(q.text) && /他/.test(q.text));
console.log(`共 ${amb.length} 条：`);
for (const q of amb) console.log(`  [${q.theme}/${q.difficulty}] ${q.text}`);

console.log('\n════════ both 目标且只出现「她」或只出现「他」════════');
const onlyShe = pool.filter(q => q.target === 'both' && /她/.test(q.text) && !/他/.test(q.text));
const onlyHe = pool.filter(q => q.target === 'both' && /他/.test(q.text) && !/她/.test(q.text));
console.log(`只含「她」${onlyShe.length} 条，样例:`); onlyShe.slice(0,6).forEach(q=>console.log(`   ${q.text}`));
console.log(`只含「他」${onlyHe.length} 条，样例:`); onlyHe.slice(0,6).forEach(q=>console.log(`   ${q.text}`));
