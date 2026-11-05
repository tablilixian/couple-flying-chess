/**
 * 情侣飞行棋 · 内容与机制匹配度审计（只读）
 */
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { parseTaskTags } from '../src/utils/personalizeTask';

const TILES = 49;
const STATUS = 6, LUCKY = 13, TRAP = 13;
const BLANK = TILES - 2 - STATUS - LUCKY - TRAP; // 去掉起点 0 与终点 48

console.log('════════ 一局游戏的任务消耗量 ════════');
const stepsPerPlayer = 24;
const landings = stepsPerPlayer * 2;
const luckyHits = Math.round(landings * (LUCKY / (TILES - 1)));
const trapHits = Math.round(landings * (TRAP / (TILES - 1)));
const blankHits = Math.round(landings * (BLANK / (TILES - 1)));
console.log(`棋盘 ${TILES} 格：status ${STATUS} / lucky ${LUCKY} / trap ${TRAP} / blank ${BLANK}`);
console.log(`每局落点 ≈ ${landings} 次 → lucky 任务 ≈ ${luckyHits} 个，trap 任务 ≈ ${trapHits} 个，空白无任务 ≈ ${blankHits} 次`);
console.log(`collision（追尾）随进程增多，后期几乎每回合都撞 → 估算 8~14 个`);
const PER_GAME = luckyHits + trapHits + 11;
console.log(`\n⇒ 单局任务量估算：约 ${PER_GAME} 个（只多不少）`);
console.log(`⇒ 最近任务去重窗口只有 10 条，跨局完全不记忆`);

console.log('\n════════ 各主题「撑不撑得住一局」════════');
console.log('主题'.padEnd(12), '题量'.padEnd(6), '去重后'.padEnd(8), '单局消耗'.padEnd(10), '结论');
const rows: { name: string; total: number; uniq: number; verdict: string }[] = [];
for (const t of COUPLE_DEFAULT_THEMES) {
  const stripped = t.tasks.map(x => x.replace(/^\[(M|F|both|H|R)\]\s*/, '').trim());
  const uniq = new Set(stripped).size;
  const verdict = uniq < PER_GAME ? '❌ 一局内必重复' : uniq < PER_GAME * 2 ? '⚠️ 1~2 局见底' : '✅ 2 局以上';
  rows.push({ name: t.name, total: t.tasks.length, uniq, verdict });
  console.log(t.name.padEnd(12), String(t.tasks.length).padEnd(6), String(uniq).padEnd(8), String(PER_GAME).padEnd(10), verdict);
}
const fragile = rows.filter(r => r.verdict.startsWith('❌')).map(r => r.name);
const thin = rows.filter(r => r.verdict.startsWith('⚠️')).map(r => r.name);
console.log(`\n❌ 一局内必重复: ${fragile.join('、')}`);
console.log(`⚠️ 1~2 局见底: ${thin.join('、')}`);

console.log('\n════════ 标签维度：H / R 的实际使用率 ════════');
console.log('主题'.padEnd(12), 'H(硬核/惩罚)'.padEnd(14), 'R(奖励)'.padEnd(10), 'lucky专属池'.padEnd(14), 'trap专属池'.padEnd(12), 'collision专属池');
for (const t of COUPLE_DEFAULT_THEMES) {
  const H = t.tasks.filter(x => parseTaskTags(x).tags.includes('H')).length;
  const R = t.tasks.filter(x => parseTaskTags(x).tags.includes('R')).length;
  // 事件专属池：有 H/R 时才会收窄，否则退化到全池
  const luckyPool = R > 0 ? R : t.tasks.length;
  const trapPool = H > 0 ? H : t.tasks.length;
  const colPool = t.tasks.length - H - R;
  console.log(
    t.name.padEnd(12),
    String(H).padEnd(14),
    String(R).padEnd(10),
    String(luckyPool).padEnd(14),
    String(trapPool).padEnd(12),
    String(colPool),
    H === 0 && R === 0 ? '  ← 三事件无区分' : ''
  );
}

console.log('\n════════ 角色专属比例（M / F / both）════════');
let M = 0, F = 0, B = 0;
for (const t of COUPLE_DEFAULT_THEMES) {
  for (const x of t.tasks) {
    const tags = parseTaskTags(x).tags;
    if (tags.includes('M')) M++;
    else if (tags.includes('F')) F++;
    else B++;
  }
}
console.log(`男专属 ${M} (${Math.round(M / (M + F + B) * 100)}%) / 女专属 ${F} (${Math.round(F / (M + F + B) * 100)}%) / 通用 ${B} (${Math.round(B / (M + F + B) * 100)}%)`);
console.log('通用题会被 personalizeTask 按执行者替换称呼 → 同一题对两人是两种表述，但仍是同一条内容');

console.log('\n════════ 重复题性质判定（灵肉合一）════════');
const union = COUPLE_DEFAULT_THEMES.find(t => t.name === '灵肉合一')!;
const groups = new Map<string, string[]>();
for (const x of union.tasks) {
  const { tags, text } = parseTaskTags(x);
  const key = text.trim();
  const arr = groups.get(key) ?? [];
  arr.push(tags.join('') || 'none');
  groups.set(key, arr);
}
const dups = [...groups.entries()].filter(([, v]) => v.length > 1);
let mfPair = 0, realDup = 0;
for (const [, v] of dups) {
  const hasM = v.some(t => t.includes('M'));
  const hasF = v.some(t => t.includes('F'));
  if (hasM && hasF && v.length === 2) mfPair++;
  else realDup++;
}
console.log(`重复组 ${dups.length}：M/F 双份 ${mfPair} 组，真正同文重复 ${realDup} 组`);
console.log('→ M/F 双份不是错误（男女各写一遍），但意味着实际可玩内容只有 ' +
  (union.tasks.length - mfPair) + ' 条');

console.log('\n════════ 主题分级 Level 是否被机制使用 ════════');
console.log('主题描述里的 Level 0~5 只是文案，代码里没有任何按 Level 的过滤/递进。');
console.log('玩家在 UI 上只能选「一个主题包」，选完所有题等权随机抽取。');
for (const t of COUPLE_DEFAULT_THEMES) {
  const lv = t.desc.match(/Level\s*(\d+)/);
  console.log(`  ${t.name.padEnd(12)} ${lv ? 'Level ' + lv[1] : '无分级'.padEnd(9)}  题量 ${String(t.tasks.length).padEnd(4)}  ${t.desc.slice(0, 30)}`);
}

console.log('\n════════ 内容与主题定位抽检 ════════');
for (const name of ['心动序章', '情境扮演']) {
  const t = COUPLE_DEFAULT_THEMES.find(x => x.name === name)!;
  console.log(`\n【${name}】(${t.desc})`);
  t.tasks.slice(0, 6).forEach(x => console.log('   ' + parseTaskTags(x).text.slice(0, 46)));
}
