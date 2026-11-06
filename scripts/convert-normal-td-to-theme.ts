/**
 * 普通题库 → 飞行棋普通模式主题包 转换器
 *
 * 素材来源：`src/data/normalQuestions.ts` 的 NORMAL_QUESTIONS（249 条）。
 * 这批题此前**一条都没进过任何主题包** —— 它们只被真心话大冒险视图使用。
 *
 * 切包方式：**按烈度切，不按主题切**。
 *   一个包 = 一个烈度档（包内 100% 同一档），主题（甜心 / 坦白 / 角色扮演）
 *   作为包内的混合维度。这样每个包都够分量（一局抽 8.6 题，池 ≥ 35 够四局），
 *   而按主题×烈度切会碎成 12 个包、最小的只有 12 条。
 *
 * 人称映射（和 `convert-td-to-theme.ts` 同源，但**方向不同**）：
 *   truth（提问型）：原文是「你问我答」，「我」= 提问的人 = 伴侣 → 「我」→「对方」
 *   dare（动作型）：原文是「你去做」，「我」= 执行者本人 → 保留
 *
 * 标签：
 *   [both][Q] 提问型    [both] 动作型
 *   普通模式没有男女角色分工，所以不标 [M]/[F]；也不标 [R]/[H]
 *   （那两个标签的语义是奖励向 / 惩罚向，只属于手写包「奖惩卡池」）
 *
 * 转换出来的文件是**静态提交**的，运行期不依赖题库。
 *
 * 运行：npx vite-node scripts/convert-normal-td-to-theme.ts [--report]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { NORMAL_QUESTIONS } from '../src/data/normalQuestions';
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { TDQuestion } from '../src/types';

import { NORMAL_PACKS, type NormalPackSpec } from './normal-pack-specs';

const PACKS: NormalPackSpec[] = NORMAL_PACKS;

// ─────────────────────────── 人称归一化 ───────────────────────────

/** 引号保护区：引号内是「台词原文」，代词随说话人翻转，不能动 */
const QUOTE_RE = /(「[^」]*」|"[^"]*"|“[^”]*”)/g;

/**
 * 手动覆写：自动转换后仍读不通或不该出现在这一档的句子。
 *
 * 6 条原本带性别指向的题（target 是 male/female，正文写「她」「他」）
 * 在这里改成中性 —— 普通模式没有男女角色分工，问的是「对方」。
 */
const OVERRIDES = new Map<string, string>([
  ['你觉得她穿什么颜色最好看？', '你觉得对方穿什么颜色最好看？'],
  ['你觉得他做什么表情最可爱？', '你觉得对方做什么表情最可爱？'],
  ['她哭的时候你第一反应是什么？', '对方哭的时候你第一反应是什么？'],
  ['他累的时候你一般怎么做？', '对方累的时候你一般怎么做？'],
  ['她什么时候看起来最美？素颜还是化妆？', '对方什么时候看起来最美？素颜还是化妆？'],
  ['他穿什么衣服你觉得最帅？', '对方穿什么衣服你觉得最帅？']
]);

function normalizeText(text: string, isTruth: boolean): string {
  const parts = text.split(QUOTE_RE);
  const out = parts.map(part => {
    const quoted = part.startsWith('「') || part.startsWith('"') || part.startsWith('“');
    if (quoted) return part;
    if (!isTruth) return part;
    // truth：提问者是我 → 换成对方（飞行棋里提问者是另一方）
    // 「我们」「自我」里的「我」不是指代，先保护
    let s = part.replace(/我们/g, '@@WE@@').replace(/自我/g, '@@SELF@@');
    s = s.replace(/我/g, '对方');
    return s.replace(/@@WE@@/g, '我们').replace(/@@SELF@@/g, '自我');
  });
  return out
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTask(q: TDQuestion): string {
  const override = OVERRIDES.get(q.text);
  const body = override !== undefined ? override : normalizeText(q.text, q.type === 'truth');
  return q.type === 'truth' ? `[both][Q] ${body}` : `[both] ${body}`;
}

// ─────────────────────────── 生成 ───────────────────────────

/**
 * 跨包去重：同一条题面不能同时出现在两个包里。
 *
 * **先和情侣模式的包去重**：普通题库的 soft 段（甜心话题）当初是从情侣题库
 * 拷过来又扩写的，两边有 44 条逐字相同。转成飞行棋题面后它们会一字不差地
 * 同时出现在情侣包和普通包里 —— 同一个 App 里同一句话出现两次，没有意义。
 * 这 44 条在情侣包里已经存在，所以这里直接剔除，普通包只留真正独立的内容。
 *
 * 剔除后各档题量：soft 89→54、hot 56→48、hard 52→51、extreme 52→52，
 * 都远高于「四局不重复」所需的 35。
 */
const usedBodies = new Set<string>();

for (const pack of COUPLE_DEFAULT_THEMES) {
  for (const task of pack.tasks) usedBodies.add(bodyOf(task));
}

function bodyOf(task: string): string {
  return task.replace(/^(\[[^\]]+\]\s*)+/, '');
}

function buildPack(spec: PackSpec) {
  const questions = NORMAL_QUESTIONS.filter(q => q.difficulty === spec.tier);
  const seen = new Set<string>();
  const items: { task: string; raw: string; theme: string }[] = [];
  const dropped: string[] = [];
  for (const q of questions) {
    const task = toTask(q);
    const body = bodyOf(task);
    if (seen.has(body)) {
      dropped.push(body);
      continue;
    }
    if (usedBodies.has(body)) {
      dropped.push(`[跨包重复] ${body}`);
      continue;
    }
    seen.add(body);
    usedBodies.add(body);
    items.push({ task, raw: q.text, theme: q.theme });
  }
  return { spec, questions, items, tasks: items.map(i => i.task), dropped };
}

// ─────────────────────────── 写文件 ───────────────────────────

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 写文件前的护栏。
 *
 * macOS 的文件系统**默认不区分大小写**，`normalAllIn.ts` 和
 * `normalAllin.ts` 会指向同一个文件，曾经因此把既有包整个覆盖掉。
 */
function assertTargetFree(outPath: string, specId: string) {
  if (!existsSync(outPath)) return;
  const prev = readFileSync(outPath, 'utf8');
  if (!prev.includes(`id: '${specId}'`)) {
    throw new Error(
      `拒绝写入 ${outPath}：该路径上已经是另一个包。\n` +
        `  macOS 文件名不区分大小写，新包的文件名很可能与既有包撞车了 —— 请换一个文件名。`
    );
  }
}

function toSource(pack: ReturnType<typeof buildPack>): string {
  const { spec, tasks } = pack;
  const varName = spec.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const lines: string[] = [];
  lines.push('import { Theme } from \'../../types\';');
  lines.push('');
  lines.push('//');
  lines.push(`// ${spec.name} —— 由「普通题库」转换而来（scripts/convert-normal-td-to-theme.ts）。`);
  lines.push('//');
  lines.push('// 标签约定：');
  lines.push('//   [both] 双方都能执行   [Q] 提问型（要回答一个问题）');
  lines.push('//');
  lines.push('// 本包是「烈度包」：包内题目的烈度是同一档（' + spec.tier + '），不混档。');
  lines.push('// 不使用 [R]/[H]：那两个标签的语义是奖励向 / 惩罚向，来自手写包「奖惩卡池」。');
  lines.push('//');
  lines.push('// 任务卡上「你」= 执行者，「对方」= 伴侣（运行期 personalizeTask 会替换成真名）。');
  lines.push('//');
  lines.push(`// ${spec.tierNote}`);
  lines.push('//');
  lines.push('');
  lines.push(`const ${varName}: Omit<Theme, 'mode'> = {`);
  lines.push(`  id: '${spec.id}',`);
  lines.push(`  name: '${spec.name}',`);
  lines.push(`  desc: '${esc(spec.desc)}',`);
  lines.push(`  audience: 'common',`);
  lines.push('  tasks: [');
  for (const t of tasks) lines.push(`    "${esc(t)}",`);
  lines.push('  ],');
  lines.push('  actionStates: [');
  for (const s of spec.actionStates) lines.push(`    "${esc(s)}",`);
  lines.push('  ],');
  lines.push('  conditionStates: [');
  for (const s of spec.conditionStates) lines.push(`    "${esc(s)}",`);
  lines.push('  ]');
  lines.push('};');
  lines.push('');
  lines.push(`export default ${varName};`);
  lines.push('');
  return lines.join('\n');
}

// ─────────────────────────── 诊断 ───────────────────────────

function report(pack: ReturnType<typeof buildPack>) {
  const { spec, items, tasks, dropped } = pack;
  console.log(`\n════════ ${spec.name} (${spec.tier}) ${tasks.length} 条 ════════`);
  if (dropped.length > 0) {
    const shown = dropped.slice(0, 6).map(d => `「${d}」`).join('');
    console.log(
      `  去重 ${dropped.length} 条（与情侣包逐字相同 / 库内重复）：${shown}` +
        (dropped.length > 6 ? ' …' : '')
    );
  }
  let residual = 0;
  for (const item of pack.items) {
    const body = bodyOf(item.task);
    const issues: string[] = [];
    if (/他|她/.test(body)) issues.push('残留他她');
    if (/男生|女生/.test(body)) issues.push('残留性别词');
    if (/老公|老婆|妻子|丈夫/.test(body)) issues.push('残留伴侣称谓');
    if (/@@|\{name\}|\{partner\}/.test(body)) issues.push('占位符残留');
    if (issues.length > 0) {
      residual++;
      console.log(`  ⚠️ [${issues.join('/')}] ${body}`);
    }
  }
  console.log(`  → 需人工复核 ${residual} 条`);

  const kinds = { act: 0, ask: 0 };
  for (const item of items) {
    if (item.task.startsWith('[both][Q]')) kinds.ask++;
    else kinds.act++;
  }
  const themes: Record<string, number> = {};
  for (const item of items) {
    themes[item.theme] = (themes[item.theme] ?? 0) + 1;
  }
  console.log(`  题型 act:${kinds.act} / ask:${kinds.ask}`);
  console.log(`  主题 ${Object.entries(themes).map(([k, v]) => `${k}:${v}`).join(' ')}`);
}

// ─────────────────────────── 入口 ───────────────────────────

const isReport = process.argv.includes('--report');

for (const spec of PACKS) {
  const pack = buildPack(spec);
  if (isReport) {
    report(pack);
  } else {
    const fileName = `normal${spec.id.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}.ts`;
    const outPath = `src/data/themes/${fileName}`;
    assertTargetFree(outPath, spec.id);
    writeFileSync(outPath, toSource(pack), 'utf8');
    console.log(`✅ ${outPath}  ${pack.tasks.length} 条`);
  }
}
