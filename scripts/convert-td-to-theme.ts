/**
 * TD 题库 → 飞行棋主题包 转换器
 *
 * 复用飞行棋既有的「[标签] 前缀」约定，不改动 Theme 的数据结构：
 *   [M]/[F]/[both]  执行方（沿用 TD 的 target 语义，已抽样验证完全同构）
 *   [Q]             提问型（真问题）；没有 [Q] 一律视为动作型
 *   [R]             奖励向（温和档）
 *   [H]             硬核向（极限档）
 *
 * 转换出来的文件是**静态提交**的，运行期不依赖 TD 题库。
 *
 * 运行：npx vite-node scripts/convert-td-to-theme.ts [--report]
 */
import { writeFileSync } from 'node:fs';
import { COUPLE_QUESTIONS } from '../src/data/truthDare';
import { TDQuestion, TDTheme } from '../src/types';

// ─────────────────────────── 目标主题包 ───────────────────────────

interface PackSpec {
  id: string;
  name: string;
  desc: string;
  tdTheme: TDTheme;
  actionStates: string[];
  conditionStates: string[];
}

const PACKS: PackSpec[] = [
  {
    id: 'public-eyes',
    name: '众目之下',
    desc: '公共场合的暴露与窥视',
    tdTheme: 'exposure',
    actionStates: [
      '[M] 每次掷骰前，把手放在对方大腿外侧停 3 秒',
      '[F] 每次掷骰前，把外套拉链往下拉一点点又拉回去',
      '[both] 每次掷骰前，互相看一眼然后同时移开视线'
    ],
    conditionStates: [
      '[M] 整局保持「在公共场合」的设定，不许说破',
      '[F] 必须一直有身体接触，不许松开',
      '[both] 两人扮演互不相识的陌生人，直到本局结束'
    ]
  },
  {
    id: 'living-room',
    name: '客厅禁区',
    desc: '客厅沙发 · 日常里的越界',
    tdTheme: 'home',
    actionStates: [
      '[M] 每次掷骰前，把对方按在沙发靠背上亲一下',
      '[F] 每次掷骰前，跨坐到对方腿上再下来',
      '[both] 每次掷骰前，十指相扣放在茶几上 5 秒'
    ],
    conditionStates: [
      '[M] 全程用「我们家」称呼对方',
      '[F] 必须保持「在客厅看电视」的设定',
      '[both] 不许离开沙发范围'
    ]
  },
  {
    id: 'deep-confession',
    name: '深夜坦白',
    desc: '深层对话 · 灵魂拷问',
    tdTheme: 'confession',
    actionStates: [
      '[M] 每次掷骰前，说出一句一直没敢说的心里话',
      '[F] 每次掷骰前，讲一件对方不知道的小事',
      '[both] 每次掷骰前，额头抵着额头安静 5 秒'
    ],
    conditionStates: [
      '[M] 本局不许开玩笑，认真回答每一题',
      '[F] 必须如实回答，不许敷衍',
      '[both] 所有问题都要正面回答，不许用「随便」搪塞'
    ]
  }
];

// ─────────────────────────── 人称归一化 ───────────────────────────

/** 引号保护区：引号内的「我/你/他/她」指代会随台词翻转，不能动 */
const QUOTE_RE = /(「[^」]*」|"[^"]*"|“[^”]*”)/g;

/**
 * 手动覆写：自动转换后仍读不通的句子。
 *
 * 原文里出现「女生 … 男生 …」这种「一方主动、一方被动」的双人结构时，
 * 统一改写成「主动方隐含给执行者、被动方一律写成『对方』」，
 * 这样无论男/女执行都读得通。
 */
const OVERRIDES = new Map<string, string>([
  ['在夜晚的公园长椅上，女生坐男生腿上假装盖着外套', '在夜晚的公园长椅上，坐到对方腿上假装盖着外套'],
  ['在深夜的马路边，男生把女生压在广告牌上接吻抚摸', '在深夜的马路边，把对方压在广告牌上接吻抚摸'],
  ['在公共场合，女生用男生的外套盖住腿，底下偷偷给他手淫', '在公共场合，用对方的外套盖住自己的腿，底下偷偷给对方手淫'],
  ['在夜晚的公交后排，女生背对男生坐上去，用大衣盖住', '在夜晚的公交后排，背对对方坐上去，用大衣盖住'],
  ['在电影院最后一排，女生替男生口交至少1分钟', '在电影院最后一排，替对方口交至少1分钟'],
  ['在夜晚的篮球场，女生挂在男生身上，双腿夹腰', '在夜晚的篮球场，挂在对方身上，双腿夹腰'],
  ['在天桥上，她真空穿着短裙，他站在身后环抱抚摸', '在天桥上，真空穿着短裙，让对方站在身后环抱抚摸'],
  ['在桥上的人行道上，她趴在栏杆上，他从后面贴着', '在桥上的人行道上，趴在栏杆上，让对方从后面贴着'],
  ['在夜晚的过街天桥上，她弯腰假装系鞋带，他从后面贴近', '在夜晚的过街天桥上，弯腰假装系鞋带，让对方从后面贴近'],
  // TD 原文本身的两处读不通，顺手修掉
  ['打开你的手机浏览器无痕模式给对看', '打开你的手机浏览器无痕模式给对方看'],
  ['你有没有偷偷羡慕过别人的老婆身材更好？', '你有没有偷偷羡慕过别人伴侣的身材更好？'],
  ['你有没有偷偷羡慕过别人的老公更浪漫？', '你有没有偷偷羡慕过别人伴侣更浪漫？']
]);

/**
 * 保护占位符：把不该替换的片段整段圈起来，替换完再原样还原。
 * 用 @@KEEP:xxx@@ 而不是 $1 / $& —— 后两者在 replace 链里会引用到错误的分组。
 */
const KEEP_RE = /@@KEEP:([^@]+)@@/g;
const keep = (m: string) => `@@KEEP:${m}@@`;

function normalizeSegment(seg: string, opts: { quoted: boolean; isTruth: boolean }): string {
  let s = seg;

  // R1：伴侣称谓 —— 在所有语境下都是"我的另一半"，即飞行棋里的「对方」
  s = s.replace(/老婆|老公|妻子|丈夫/g, '对方');
  // 「你老婆」→「你对方」读不通，收敛成「对方」
  s = s.replace(/你(?:的)?对方/g, '对方');

  if (opts.quoted) {
    // 引号内只做 R1，其余代词保持原样（引号里「我/你/他/她」会随台词翻转）
    return s;
  }

  // R2：他/她 → 对方
  //  - 「其他/其它/其中」的「他」不是指人
  //  - 「他们/她们」是第三方群体
  s = s.replace(/([其])(他|她)/g, keep);
  s = s.replace(/(他|她)(们)/g, keep);
  s = s.replace(/他|她/g, '对方');

  // R3：男生/女生 → 对方（执行方由任务卡上的一方担任，第三人称一律指伴侣）
  s = s.replace(/男生|女生/g, '对方');

  // R4：「我」
  //  - truth：提问者是我 → 换成对方（飞行棋里提问者是另一方）
  //  - dare：说话人就是执行者本人 → 保留「我」
  if (opts.isTruth) {
    // 占位符里绝不能出现「我」字，否则会被下面这条 replace 再改一遍
    s = s.replace(/我们/g, '@@WE@@');
    s = s.replace(/自我/g, '@@SELF@@');
    s = s.replace(/我/g, '对方');
  }

  return s;
}

function normalizeText(text: string, isTruth: boolean): string {
  const parts = text.split(QUOTE_RE);
  const out = parts.map(part => {
    const quoted = part.startsWith('「') || part.startsWith('"') || part.startsWith('“');
    return normalizeSegment(part, { quoted, isTruth });
  });
  return out
    .join('')
    .replace(/@@WE@@/g, '我们')
    .replace(/@@SELF@@/g, '自我')
    .replace(KEEP_RE, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────── 标签映射 ───────────────────────────

function roleTag(target: TDQuestion['target']): string {
  if (target === 'male') return '[M]';
  if (target === 'female') return '[F]';
  return '[both]';
}

/**
 * 难度 → H/R。
 *
 * soft（温和）→ [R]：幸运时刻优先抽它
 * extreme（极限）→ [H]：意外陷阱优先抽它
 * hot / hard 不加标签：两个事件都能抽到
 *
 * 这样三个事件天然分流：
 *   lucky     只出动作型，优先 R（温和）
 *   trap      动作型/提问型随机，优先 H（极限）
 *   collision 动作型/提问型随机，排除 H/R（中性档）
 */
function intensityTag(difficulty: TDQuestion['difficulty']): string {
  if (difficulty === 'soft') return '[R]';
  if (difficulty === 'extreme') return '[H]';
  return '';
}

function toTask(q: TDQuestion): string {
  const override = OVERRIDES.get(q.text);
  const body = override !== undefined ? override : normalizeText(q.text, q.type === 'truth');
  const qTag = q.type === 'truth' ? '[Q]' : '';
  return `${roleTag(q.target)}${qTag}${intensityTag(q.difficulty)} ${body}`;
}

// ─────────────────────────── 生成 ───────────────────────────

function buildPack(spec: PackSpec) {
  const questions = COUPLE_QUESTIONS.filter(q => q.theme === spec.tdTheme);
  const tasks = questions.map(toTask);
  return { spec, questions, tasks };
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function toSource(pack: ReturnType<typeof buildPack>): string {
  const { spec, tasks } = pack;
  const lines: string[] = [];
  lines.push('import { Theme } from \'../../types\';');
  lines.push('');
  lines.push('//');
  lines.push(`// ${spec.name} —— 由「真心话大冒险」题库转换而来（scripts/convert-td-to-theme.ts）。`);
  lines.push('//');
  lines.push('// 标签约定：');
  lines.push('//   [M]/[F]/[both] 执行方   [Q] 提问型（要回答一个问题）');
  lines.push('//   [R] 奖励向（温和档）    [H] 硬核向（极限档）');
  lines.push('//');
  lines.push('');
  lines.push(`const ${spec.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}: Omit<Theme, 'mode'> = {`);
  lines.push(`  id: '${spec.id}',`);
  lines.push(`  name: '${spec.name}',`);
  lines.push(`  desc: '${esc(spec.desc)}',`);
  lines.push("  audience: 'common',");
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
  lines.push(`export default ${spec.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())};`);
  lines.push('');
  return lines.join('\n');
}

// ─────────────────────────── 诊断 ───────────────────────────

const SUSPECT = /对方[^，。！？,!?]{0,4}对方|对方\s*面前|里的对方|给对方的对方/;

function report(pack: ReturnType<typeof buildPack>) {
  const { spec, questions, tasks } = pack;
  console.log(`\n════════ ${spec.name} (${spec.tdTheme}) ${tasks.length} 条 ════════`);

  let suspect = 0;
  let residual = 0;
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const body = t.replace(/^\[[^\]]+\]\s*/, '');
    const issues: string[] = [];
    if (SUSPECT.test(body)) issues.push('双重指代');
    if (/男生|女生/.test(body)) issues.push('残留性别词');
    if (/[他她](?!们)/.test(body)) issues.push('残留他她');
    if (/老婆|老公|妻子|丈夫/.test(body)) issues.push('残留伴侣称谓');
    if (/(^|[^你他她对方])我/.test(body)) issues.push('残留我');
    if (body.includes('对方对方')) issues.push('对方对方');
    if (issues.length > 0) {
      residual++;
      if (issues.includes('双重指代') || issues.includes('残留性别词')) suspect++;
      console.log(`  ⚠️ [${issues.join('/')}] ${body}`);
    }
  }
  console.log(`  → 需人工复核 ${residual} 条（其中重点 ${suspect} 条）`);

  const kinds = { act: 0, ask: 0 };
  const roles = { M: 0, F: 0, both: 0 };
  const ints: Record<string, number> = {};
  for (const q of questions) {
    if (q.type === 'truth') kinds.ask++; else kinds.act++;
    if (q.target === 'male') roles.M++; else if (q.target === 'female') roles.F++; else roles.both++;
    ints[q.difficulty] = (ints[q.difficulty] || 0) + 1;
  }
  const malePool = roles.M + roles.both;
  const femalePool = roles.F + roles.both;
  console.log(`  题型 act:${kinds.act} / ask:${kinds.ask}`);
  console.log(`  角色 M:${roles.M} F:${roles.F} both:${roles.both}  → 男可执行池 ${malePool} / 女可执行池 ${femalePool}`);
  console.log(`  难度 ${Object.entries(ints).map(([k, v]) => `${k}:${v}`).join(' ')}`);
}

// ─────────────────────────── 入口 ───────────────────────────

const isReport = process.argv.includes('--report');

for (const spec of PACKS) {
  const pack = buildPack(spec);
  if (isReport) {
    report(pack);
  } else {
    const fileName = `couple${spec.id.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}.ts`;
    const outPath = `src/data/themes/${fileName}`;
    writeFileSync(outPath, toSource(pack), 'utf8');
    console.log(`✅ ${outPath}  ${pack.tasks.length} 条`);
  }
}
