/**
 * 全站内容资产盘点。
 *
 * 把所有「内容来源」一次性统计出来，方便判断内容扩充的进度与缺口：
 *   1. 飞行棋主题包（题目 + 标签 + 执行方池 + 状态池）
 *   2. 真心话大冒险题库（类型 × 难度 × 主题 × 目标）
 *   3. 惩罚库
 *   4. 剧本杀（章节 × 步骤）
 *   5. 沉浸剧场（幕 × 步骤）
 *   6. 调教节奏（阶段 × 台词）
 *   7. 状态效果池
 *   8. 小说
 *   9. 广播剧
 *
 * 用法：npx vite-node scripts/audit-content-inventory.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../src/data/themes';
import { COUPLE_QUESTIONS, COUPLE_PENALTIES } from '../src/data/truthDare';
import { NORMAL_QUESTIONS } from '../src/data/normalQuestions';
import { NORMAL_PENALTIES } from '../src/data/normalPenalties';
import { parseTaskTags } from '../src/utils/personalizeTask';
import { BUILTIN_SCRIPTS } from '../src/data/scripts';
import { ALL_SCENARIOS } from '../src/data/scenarios';
import { PRESET_EDGING_FLOWS } from '../src/data/edgingFlows';
import {
  COUPLE_DEFAULT_ACTION_STATES,
  COUPLE_DEFAULT_CONDITION_STATES,
  COUPLE_OPENING_STATES,
} from '../src/data/statePools';
import { NOVELS } from '../src/data/novels';

// ---------- 通用工具 ----------
const line = (...args: unknown[]) => console.log(...args);
const hr = (c = '─', n = 92) => c.repeat(n);
/** 显示宽度：CJK 全角字符按 2 列算，中文表格才能对齐 */
const dispWidth = (s: string) => {
  let n = 0;
  for (const ch of s) {
    n += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1;
  }
  return n;
};
const pad = (s: string | number, n: number) => {
  const str = String(s);
  const gap = n - dispWidth(str);
  return gap > 0 ? str + ' '.repeat(gap) : str;
};

// ---------- 1. 飞行棋主题包 ----------
type PackRow = {
  name: string;
  id: string;
  mode: string;
  audience: string;
  total: number;
  unique: number;
  M: number;
  F: number;
  both: number;
  Q: number;
  R: number;
  H: number;
  ask: number;
  execPool: number;
  states: number;
};

function packRows(themes: typeof COUPLE_DEFAULT_THEMES): PackRow[] {
  return themes.map(p => {
    const bodies = new Set<string>();
    let M = 0, F = 0, both = 0, Q = 0, R = 0, H = 0;
    for (const t of p.tasks) {
      const { tags, text } = parseTaskTags(t);
      bodies.add(text.trim());
      if (tags.includes('F')) F++;
      else if (tags.includes('M')) M++;
      else if (tags.includes('both')) both++;
      if (tags.includes('Q')) Q++;
      if (tags.includes('R')) R++;
      if (tags.includes('H')) H++;
    }
    // 实际执行方池：谁选包，谁就执行对方包里的题
    const pool =
      p.audience === 'male' ? F + both : p.audience === 'female' ? M + both : Math.min(M, F) + both;
    return {
      name: p.name,
      id: p.id,
      mode: p.mode,
      audience: p.audience,
      total: p.tasks.length,
      unique: bodies.size,
      M,
      F,
      both,
      Q,
      R,
      H,
      ask: Q,
      execPool: pool,
      states: (p.actionStates?.length ?? 0) + (p.conditionStates?.length ?? 0),
    };
  });
}

const couplePacks = packRows(COUPLE_DEFAULT_THEMES);
const normalPacks = packRows(NORMAL_DEFAULT_THEMES);

line(hr('═'));
line('【一】飞行棋 · 主题包');
line(hr('═'));
line(pad('包名', 13), pad('mode', 7), pad('受众', 7), pad('题量', 6), pad('唯一', 6), pad('M', 4), pad('F', 4), pad('both', 6), pad('Q', 5), pad('R', 4), pad('H', 4), pad('执行池', 7), '状态');
line(hr());
for (const r of [...couplePacks, ...normalPacks]) {
  line(
    pad(r.name, 13),
    pad(r.mode, 7),
    pad(r.audience, 7),
    pad(r.total, 6),
    pad(r.unique, 6),
    pad(r.M, 4),
    pad(r.F, 4),
    pad(r.both, 6),
    pad(r.Q, 5),
    pad(r.R, 4),
    pad(r.H, 4),
    pad(r.execPool, 7),
    String(r.states),
  );
}
const sum = (rs: PackRow[], k: keyof PackRow) => rs.reduce((n, r) => n + (r[k] as number), 0);
line(hr());
line(
  `合计：情侣 ${couplePacks.length} 包 / ${sum(couplePacks, 'total')} 题    普通 ${normalPacks.length} 包 / ${sum(normalPacks, 'total')} 题    总计 ${couplePacks.length + normalPacks.length} 包 / ${sum(couplePacks, 'total') + sum(normalPacks, 'total')} 题`,
);
line(
  `提问型 [Q]：${sum(couplePacks, 'Q') + sum(normalPacks, 'Q')} 条    温和档 [R]：${sum(couplePacks, 'R') + sum(normalPacks, 'R')} 条    硬核档 [H]：${sum(couplePacks, 'H') + sum(normalPacks, 'H')} 条`,
);
const dupPacks = [...couplePacks, ...normalPacks].filter(r => r.total !== r.unique);
line(
  `包内重复：${dupPacks.length} 个包共 ${dupPacks.reduce((n, r) => n + (r.total - r.unique), 0)} 条冗余` +
    (dupPacks.length ? ` → ${dupPacks.map(r => `${r.name}(${r.total - r.unique})`).join('、')}` : ''),
);

// 烈度覆盖率（只统计情侣包：普通包不用 M/F/R/H 语义）
const coupleOnly = couplePacks;
const noR = coupleOnly.filter(r => r.R === 0);
const noH = coupleOnly.filter(r => r.H === 0);
const neutral = coupleOnly.reduce((n, r) => n + (r.total - r.R - r.H), 0);
line(
  `烈度覆盖（情侣 ${coupleOnly.length} 包）：无 [R] ${noR.length} 包 / 无 [H] ${noH.length} 包 / 中性档（无 R 无 H）${neutral} 条`,
);
line(`  无 [R] 的包 → ${noR.map(r => r.name).join('、')}`);
line(`  无 [H] 的包 → ${noH.map(r => r.name).join('、')}`);
const smallPool = coupleOnly.filter(r => r.execPool < 37);
line(
  `执行方池 <37（不够两局不重复）：${smallPool.length} 个情侣包` +
    (smallPool.length ? ` → ${smallPool.map(r => `${r.name}(${r.execPool})`).join('、')}` : ''),
);
line();

// ---------- 2. 真心话大冒险 ----------
type Cell = { truth: number; dare: number };
function tdMatrix(rows: TDQuestion[]) {
  const themes = [...new Set(rows.map(r => r.theme))].sort();
  const diffs: TDQuestion['difficulty'][] = ['soft', 'hot', 'hard', 'extreme'];
  const m = new Map<string, Cell>();
  for (const r of rows) {
    const k = `${r.theme}|${r.difficulty}`;
    if (!m.has(k)) m.set(k, { truth: 0, dare: 0 });
    const c = m.get(k)!;
    if (r.type === 'truth') c.truth++;
    else c.dare++;
  }
  return { themes, diffs, m, rows };
}

const TD_LABEL: Record<string, string> = {
  sweet: '甜蜜', spicy: '火辣', confession: '坦白局', roleplay: '角色扮演', kinky: '调教',
  bdsm: '束缚', taboo: '禁忌', dirtytalk: '脏话', slutwife: '淫荡妻子', swing: '交换',
  exposure: '户外露出', cuckold: '绿帽', third: '第三者', home: '居家',
};

for (const [label, rows] of [['情侣题库 COUPLE_QUESTIONS', COUPLE_QUESTIONS], ['普通题库 NORMAL_QUESTIONS', NORMAL_QUESTIONS]] as const) {
  const { themes, diffs, m } = tdMatrix(rows);
  line(hr('═'));
  line(`【二】真心话大冒险 · ${label}（${rows.length} 条）`);
  line(hr('═'));
  line(pad('主题', 12), pad('soft', 12), pad('hot', 12), pad('hard', 12), pad('extreme', 12), '合计');
  line(hr());
  for (const th of themes) {
    const cells = diffs.map(d => m.get(`${th}|${d}`) ?? { truth: 0, dare: 0 });
    const tot = cells.reduce((n, c) => n + c.truth + c.dare, 0);
    line(
      pad(TD_LABEL[th] ?? th, 12),
      ...cells.map(c => pad(`${c.truth}+${c.dare}`, 12)),
      String(tot),
    );
  }
  line(hr());
  const byDiff = diffs.map(d => ({
    d,
    truth: rows.filter(r => r.difficulty === d && r.type === 'truth').length,
    dare: rows.filter(r => r.difficulty === d && r.type === 'dare').length,
  }));
  line('难度分布：' + byDiff.map(x => `${x.d} ${x.truth}+${x.dare}=${x.truth + x.dare}`).join('   '));
  const byTarget = ['male', 'female', 'both'].map(t => `${t} ${rows.filter(r => r.target === t).length}`);
  line('目标分布：' + byTarget.join('   '));
  const dup = new Map<string, number>();
  for (const r of rows) dup.set(r.text, (dup.get(r.text) ?? 0) + 1);
  const dupN = [...dup.values()].filter(v => v > 1).length;
  line(`唯一题面：${dup.size}（重复组 ${dupN}）`);
  line();
}

// ---------- 3. 惩罚库 ----------
line(hr('═'));
line('【三】惩罚库');
line(hr('═'));
for (const [label, ps] of [['COUPLE_PENALTIES', COUPLE_PENALTIES], ['NORMAL_PENALTIES', NORMAL_PENALTIES]] as const) {
  const by = (['soft', 'hot', 'hard', 'extreme'] as const).map(d => `${d} ${ps.filter(p => p.difficulty === d).length}`);
  line(`${pad(label, 22)} 共 ${pad(ps.length, 5)} 条    ${by.join('   ')}`);
}
line();

// ---------- 4. 剧本杀 ----------
line(hr('═'));
line('【四】剧本杀 · BUILTIN_SCRIPTS');
line(hr('═'));
line(pad('剧本', 14), pad('mode', 7), pad('难度', 5), pad('章节', 5), pad('步骤', 5), pad('时长(min)', 9), '标签');
for (const s of BUILTIN_SCRIPTS) {
  const steps = s.chapters.reduce((n, c) => n + c.steps.length, 0);
  line(pad(s.title, 14), pad(s.mode, 7), pad(s.difficulty, 5), pad(s.chapters.length, 5), pad(steps, 5), pad(s.duration, 9), s.tags.join('/'));
}
line(hr());
line(
  `合计 ${BUILTIN_SCRIPTS.length} 本 / ${BUILTIN_SCRIPTS.reduce((n, s) => n + s.chapters.length, 0)} 章 / ${BUILTIN_SCRIPTS.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.steps.length, 0), 0)} 步`,
);
line();

// ---------- 5. 沉浸剧场 ----------
line(hr('═'));
line('【五】沉浸剧场 · ALL_SCENARIOS');
line(hr('═'));
line(pad('场景', 16), pad('mode', 7), pad('难度', 9), pad('幕', 4), pad('步骤', 5), pad('选项', 5), '估时');
for (const s of ALL_SCENARIOS) {
  const steps = s.acts.reduce((n, a) => n + a.steps.length, 0);
  const opts = s.acts.reduce((n, a) => n + a.steps.reduce((m, st) => m + (st.options?.length ?? 0), 0), 0);
  line(pad(s.title, 16), pad(s.mode, 7), pad(s.difficulty, 9), pad(s.acts.length, 4), pad(steps, 5), pad(opts, 5), `${s.estimatedMinutes}min`);
}
line(hr());
line(
  `合计 ${ALL_SCENARIOS.length} 个场景 / ${ALL_SCENARIOS.reduce((n, s) => n + s.acts.length, 0)} 幕 / ${ALL_SCENARIOS.reduce((n, s) => n + s.acts.reduce((m, a) => m + a.steps.length, 0), 0)} 步`,
);
line();

// ---------- 6. 调教节奏 ----------
line(hr('═'));
line('【六】调教节奏 · PRESET_EDGING_FLOWS');
line(hr('═'));
line(pad('流程', 16), pad('阶段', 5), pad('台词', 5), pad('总时长', 8), '阶段构成');
for (const f of PRESET_EDGING_FLOWS) {
  const lines = f.phases.reduce((n, p) => n + (p.script?.length ?? 0), 0);
  const secs = f.phases.reduce((n, p) => n + p.duration, 0);
  const kinds = f.phases.map(p => p.kind).join('→');
  line(pad(f.name, 16), pad(f.phases.length, 5), pad(lines, 5), pad(`${Math.round(secs / 60)}min`, 8), kinds);
}
line(hr());
line(
  `合计 ${PRESET_EDGING_FLOWS.length} 套 / ${PRESET_EDGING_FLOWS.reduce((n, f) => n + f.phases.length, 0)} 阶段 / ${PRESET_EDGING_FLOWS.reduce((n, f) => n + f.phases.reduce((m, p) => m + (p.script?.length ?? 0), 0), 0)} 句台词`,
);
line();

// ---------- 7. 状态池 ----------
line(hr('═'));
line('【七】状态效果池');
line(hr('═'));
line(`动作状态 ${COUPLE_DEFAULT_ACTION_STATES.length} 条   状态标签 ${COUPLE_DEFAULT_CONDITION_STATES.length} 条   开场状态 ${COUPLE_OPENING_STATES.length} 条`);
const themedStates = [...couplePacks, ...normalPacks].filter(r => r.states > 0);
line(`带专属状态池的主题包：${themedStates.length} 个（${themedStates.map(r => `${r.name}:${r.states}`).join('、')}）`);
line();

// ---------- 8. 小说 ----------
line(hr('═'));
line('【八】小说');
line(hr('═'));
for (const n of NOVELS) {
  // src 形如 ${BASE_URL}novels/xxx.md，实际文件在 public/novels/ 下
  const rel = n.src.split('/').slice(-2).join('/');
  const mdPath = resolve(process.cwd(), 'public', rel);
  let chapters = 0;
  let words = 0;
  if (existsSync(mdPath)) {
    const raw = readFileSync(mdPath, 'utf-8');
    chapters = (raw.match(/^\s*#{1,3}\s*第\s*\d+\s*章/gm) ?? []).length;
    words = raw.replace(/\s/g, '').length;
  }
  line(
    pad(n.title, 22),
    pad(`${n.author}`, 10),
    pad(`${chapters} 章`, 8),
    pad(`${Math.round(words / 1000)}k 字`, 9),
    `${n.tags.length} 标签 / ${n.characters?.length ?? 0} 人物 / ${n.relations?.length ?? 0} 关系`,
  );
}
line();

// ---------- 9. 广播剧 ----------
line(hr('═'));
line('【九】广播剧');
line(hr('═'));
const radioDir = resolve(process.cwd(), 'public/audio/radio');
for (const [label, file] of [
  ['manifest.json（默认）', 'manifest.json'],
  ['manifest-couple.json', 'manifest-couple.json'],
  ['manifest-normal.json', 'manifest-normal.json'],
] as const) {
  const p = resolve(radioDir, file);
  if (!existsSync(p)) {
    line(`${pad(label, 24)} 不存在`);
    continue;
  }
  const arr = JSON.parse(readFileSync(p, 'utf-8')) as { id?: string; title?: string; file?: string; duration?: number }[];
  const total = arr.reduce((n, c) => n + (c.duration ?? 0), 0);
  line(`${pad(label, 24)} ${pad(arr.length, 3)} 集   标注时长合计 ${pad(`${Math.round(total / 60)}min`, 7)}   ${arr.map(c => c.title ?? c.id).slice(0, 4).join('、')}…`);
}
const audioDir = resolve(radioDir);
if (existsSync(audioDir)) {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
  line(`实际音频文件：${files.length} 个 mp3`);
}
line();
