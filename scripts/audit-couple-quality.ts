/**
 * 情侣飞行棋 · 内容质量与机制冲突审计（只读）
 */
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { parseTaskTags } from '../src/utils/personalizeTask';

console.log('════════ 状态池覆盖与体量 ════════');
console.log('主题'.padEnd(12), 'action'.padEnd(8), 'condition'.padEnd(11), '合计');
const noState: string[] = [];
for (const t of COUPLE_DEFAULT_THEMES) {
  const a = t.actionStates?.length ?? 0;
  const c = t.conditionStates?.length ?? 0;
  if (a + c === 0) noState.push(t.name);
  console.log(t.name.padEnd(12), String(a).padEnd(8), String(c).padEnd(11), a + c);
}
console.log('无状态池主题:', noState.join('、') || '（无）');

console.log('\n════════ 状态池实际文案（抽查 2 个主题）════════');
for (const name of ['心动序章', '主控调教']) {
  const t = COUPLE_DEFAULT_THEMES.find(x => x.name === name)!;
  console.log(`\n【${name}】`);
  (t.actionStates ?? []).forEach(s => console.log('   行动: ' + s.text));
  (t.conditionStates ?? []).forEach(s => console.log('   状态: ' + s.text));
}

console.log('\n════════ 叙事型主题 vs 随机抽题的冲突 ════════');
for (const t of COUPLE_DEFAULT_THEMES) {
  const seq = /顺序|按序|连续|剧情|章节|递进/.test(t.desc + t.tasks.slice(0, 5).join(''));
  if (seq) {
    console.log(`⚠️  ${t.name}：描述「${t.desc}」`);
    console.log('    该包内容是叙事型，但飞行棋是随机抽题 —— 顺序会被打乱。');
  }
}

console.log('\n════════ 契约情侣：编号是否连续、抽题是否会跳序 ════════');
const contract = COUPLE_DEFAULT_THEMES.find(x => x.name === '契约情侣')!;
const numbered = contract.tasks.map(t => {
  const { text } = parseTaskTags(t);
  const m = text.match(/^(\d+)[.、：:）)]/);
  return { text, num: m ? Number(m[1]) : null };
});
console.log('带编号的题:', numbered.filter(n => n.num !== null).length, '/', numbered.length);
console.log('样例:');
numbered.slice(0, 6).forEach(n => console.log('   ' + (n.num !== null ? `#${n.num} ` : '    ') + n.text.slice(0, 40)));

console.log('\n════════ 句式模板化检测（同构开头）════════');
const all = COUPLE_DEFAULT_THEMES.flatMap(t => t.tasks.map(x => parseTaskTags(x).text));
const prefixes = new Map<string, number>();
for (const s of all) {
  const p = s.slice(0, 4);
  prefixes.set(p, (prefixes.get(p) ?? 0) + 1);
}
const top = [...prefixes.entries()].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log('出现 ≥4 次的前 4 字:');
top.forEach(([p, n]) => console.log(`   "${p}" × ${n}`));

console.log('\n════════ 动词/指令类型分布（粗判题目类型单一度）════════');
const buckets: Record<string, number> = {
  '触碰/抚摸': 0, '口述/说/讲': 0, '指令/要求': 0, '姿势/体位': 0,
  '自慰/手': 0, '时长型(含秒/分钟)': 0, '观察/回忆': 0, '角色扮演设定': 0,
};
for (const s of all) {
  if (/摸|抚|碰|揉|捏|舔|含|咬|亲/.test(s)) buckets['触碰/抚摸']++;
  if (/说|讲|告诉|问|喊|念|复述/.test(s)) buckets['口述/说/讲']++;
  if (/让|要求|必须|不准|命令/.test(s)) buckets['指令/要求']++;
  if (/体位|姿势|躺|跪|趴|骑/.test(s)) buckets['姿势/体位']++;
  if (/自慰|手|撸|玩弄/.test(s)) buckets['自慰/手']++;
  if (/\d+\s*(秒|分钟|分)/.test(s)) buckets['时长型(含秒/分钟)']++;
  if (/看着|观察|回忆|想象|回想/.test(s)) buckets['观察/回忆']++;
  if (/扮演|假装|想象自己是|角色/.test(s)) buckets['角色扮演设定']++;
}
for (const [k, v] of Object.entries(buckets)) {
  console.log(`   ${k.padEnd(16)} ${String(v).padEnd(5)} ${Math.round(v / all.length * 100)}%`);
}

console.log('\n════════ 纯通用题主题 vs 混合主题 ════════');
for (const t of COUPLE_DEFAULT_THEMES) {
  const hasM = t.tasks.some(x => parseTaskTags(x).tags.includes('M'));
  const hasF = t.tasks.some(x => parseTaskTags(x).tags.includes('F'));
  const both = t.tasks.filter(x => {
    const g = parseTaskTags(x).tags;
    return !g.includes('M') && !g.includes('F');
  }).length;
  const ratio = both / t.tasks.length;
  const mark = ratio > 0.9 ? '❌ 纯通用，双方题库完全重合' : ratio > 0.6 ? '⚠️ 通用偏多' : '✅ 角色区分较好';
  console.log(`   ${t.name.padEnd(12)} 通用 ${String(both).padEnd(4)}/${String(t.tasks.length).padEnd(4)} (${Math.round(ratio * 100)}%)  M:${hasM ? '有' : '无'} F:${hasF ? '有' : '无'}  ${mark}`);
}
