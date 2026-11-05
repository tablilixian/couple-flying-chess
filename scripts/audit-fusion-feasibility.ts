import { COUPLE_QUESTIONS } from '../src/data/truthDare';
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../src/data/themes/index';
import { TDTheme } from '../src/types';

const DIFF = ['soft', 'hot', 'hard', 'extreme'] as const;
const ORPHAN: TDTheme[] = ['confession','taboo','third','dirtytalk','slutwife','cuckold','swing','exposure','home'];

console.log('════════ TD 情侣库 truth/dare × difficulty ════════');
console.log('            soft  hot  hard extreme   合计');
for (const type of ['truth','dare'] as const) {
  const row = DIFF.map(d => COUPLE_QUESTIONS.filter(q => q.type===type && q.difficulty===d).length);
  const tot = row.reduce((a,b)=>a+b,0);
  console.log(`${type.padEnd(10)} ${row.map(n=>String(n).padStart(5)).join('')}   ${String(tot).padStart(4)}`);
}
console.log(`\n孤儿9主题合计 ${COUPLE_QUESTIONS.filter(q=>ORPHAN.includes(q.theme)).length} 条`);

console.log('\n════════ 孤儿9主题 truth/dare × difficulty ════════');
for (const t of ORPHAN) {
  const sub = COUPLE_QUESTIONS.filter(q => q.theme === t);
  const cells = (type: string) => DIFF.map(d => sub.filter(q=>q.type===type&&q.difficulty===d).length);
  const tr = cells('truth'), dr = cells('dare');
  console.log(`${t.padEnd(12)} truth[${tr.map(n=>String(n).padStart(3)).join(',')}]  dare[${dr.map(n=>String(n).padStart(3)).join(',')}]`);
}

console.log('\n════════ 现有飞行棋 489 条的句式形态 ════════');
const fc = COUPLE_DEFAULT_THEMES.filter(t=>t.mode==='couple');
let imperative = 0, question = 0, other = 0;
const qSamples: string[] = [];
for (const th of fc) for (const t of th.tasks) {
  const s = t.replace(/^\[[^\]]+\]\s*/,'');
  if (/[？?]/.test(s) || /^(回答|说|告诉|聊|描述|复述|回忆|谈谈|说说)/.test(s)) {
    question++; if (qSamples.length<8) qSamples.push(`${th.name}: ${s.slice(0,40)}`);
  } else if (/^(把|让|用|亲|抱|互|一|双方|两人|女生|男生|双方|请|尝试|慢慢|闭|抬|跨|骑|坐|躺|趴|站|脱|摸|舔|含|咬|手指|舌尖|双手|两人)/.test(s)) imperative++;
  else other++;
}
console.log(`祈使/动作型 ${imperative} (${(imperative/489*100).toFixed(0)}%)   问答/描述型 ${question} (${(question/489*100).toFixed(0)}%)   其他 ${other}`);
console.log('问答型样例:'); qSamples.forEach(s=>console.log('   '+s));

console.log('\n════════ 普通模式侧现状 ════════');
const nm = NORMAL_DEFAULT_THEMES;
console.log(`普通主题包 ${nm.length} 个，题量合计 ${nm.reduce((a,t)=>a+t.tasks.length,0)}`);
for (const t of nm) {
  console.log(`  ${t.name.padEnd(12)} 题量${String(t.tasks.length).padStart(3)}  actionStates:${(t.actionStates||[]).length}  conditionStates:${(t.conditionStates||[]).length}`);
}
