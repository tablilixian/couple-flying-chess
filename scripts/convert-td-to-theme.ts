/**
 * TD 题库 → 飞行棋主题包 转换器
 *
 * 复用飞行棋既有的「[标签] 前缀」约定，不改动 Theme 的数据结构：
 *   [M]/[F]/[both]  执行方（沿用 TD 的 target 语义，已抽样验证完全同构）
 *   [Q]             提问型（真问题）；没有 [Q] 一律视为动作型
 *   [R]/[H]         奖励向 / 惩罚向（**仅手写包使用**；语义来自「奖惩卡池」）
 *
 * 转换包不带 [R]/[H]：TD 的 difficulty 是「推进程度」不是「正反极性」，
 * 映射过去会把难度梯度误当成温和/极端塞进包，既稀释包又把格子分流打歪。
 * 转换包的格子分流由题型承担（动作型 / 提问型）。
 *
 * 转换出来的文件是**静态提交**的，运行期不依赖 TD 题库。
 *
 * 运行：npx vite-node scripts/convert-td-to-theme.ts [--report]
 */
import { writeFileSync } from 'node:fs';
import { COUPLE_QUESTIONS } from '../src/data/truthDare';
import { TDQuestion } from '../src/types';

import { PACKS, type PackSpec } from './td-pack-specs';

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
  ['你有没有偷偷羡慕过别人的老公更浪漫？', '你有没有偷偷羡慕过别人伴侣更浪漫？'],

  // ── 原文里「他」和「她」同时出现 = 指的是**两个人**，抹平成「对方」后会读不通 ──
  // 一律改成「一方…另一方…」的写法，角色中性，男女执行都读得通
  ['如果她同意，你会想尝试跟她和她闺蜜同时暧昧吗？', '如果对方同意，你会想尝试跟对方和对方的闺蜜同时暧昧吗？'],
  ['如果他同意，你会想尝试跟他和他最好的朋友一起暧昧吗？', '如果对方同意，你会想尝试跟对方和对方最好的朋友一起暧昧吗？'],
  [
    '如果我说我可以原谅你一次逢场作戏的身体出轨，但我要知道每个细节，你会利用这个许可吗？',
    '如果对方说可以原谅你一次逢场作戏的身体出轨，但要知道每个细节，你会利用这个许可吗？'
  ],
  [
    '把对方的双手按在墙上，凑近嘴唇说："如果你现在在和我老婆/老公偷情，你会怎么求我别停？"',
    '把对方的双手按在墙上，凑近嘴唇说："如果你现在在和我对象偷情，你会怎么求我别停？"'
  ],
  [
    '用他的手机给他的一个好兄弟发一条"我女朋友今天说想看你……"，发送前让他决定撤不撤回。',
    '用对方的手机给对方的好兄弟发一条"我女朋友今天说想看你……"，发送前让对方决定撤不撤回。'
  ],
  [
    '角色扮演：一方是丈夫，一方是妻子，妻子坦白刚刚和修水管的小哥调情了，丈夫的反应必须即兴。',
    '角色扮演：一人演"在外有别人"，一人演"被瞒着的那位"；前者坦白刚刚和修水管的小哥调情了，后者的反应必须即兴。'
  ],
  [
    '一起拍一张照片，她负责摆出"有秘密"的表情，他负责"假装不知道"',
    '一起拍一张照片，一方摆出"有秘密"的表情，另一方负责"假装不知道"'
  ],
  [
    '面对面坐着，她扮演"刚和别人约会回来"，他扮演"在家等着的丈夫"，即兴对话2分钟',
    '面对面坐着，一方扮演"刚和别人约会回来"，另一方扮演"在家等着的人"，即兴对话2分钟'
  ],
  [
    '模拟一次"单男面试"：她做面试官问问题，他扮演单男回答，要尽量进入角色',
    '模拟一次"单男面试"：一方做面试官问问题，另一方扮演单男回答，要尽量进入角色'
  ],
  [
    '互相协助，给对方穿戴整齐，然后她出门在走廊站一分钟（确保安全），他通过猫眼偷看',
    '互相协助给对方穿戴整齐，然后对方出门在走廊站一分钟（确保安全），另一人通过猫眼偷看'
  ],
  [
    '对他说一句："如果你是别人的老婆，我现在就会……"并补完这句话',
    '对对方说一句："如果你是别人的伴侣，我现在就会……"并补完这句话'
  ],
  [
    '你愿不愿意让他把你的照片发到某个成人社区，标明"共享妻子"？',
    '你愿不愿意让对方把你的照片发到某个成人社区，标明"共享伴侣"？'
  ],
  [
    '让她假装是别人的妻子，你第一次见到她，开始搭讪',
    '让对方假装是别人的伴侣，你第一次见到对方，开始搭讪'
  ],
  [
    '让他假装是别人的丈夫，你第一次见到他，展现你的魅力',
    '让对方假装是别人的伴侣，你第一次见到对方，展现你的魅力'
  ],
  [
    '用第三人称讲述一个故事：你的妻子在别人怀里，而你在一旁看着',
    '用第三人称讲述一个故事：你的伴侣在别人怀里，而你在一旁看着'
  ],
  [
    '用第三人称讲述一个故事：你的丈夫在别人身上，而你在一旁观看',
    '用第三人称讲述一个故事：你的伴侣在别人身上，而你在一旁观看'
  ],
  [
    '让你妻子给你戴上一顶"绿帽子"（可以是实物或指代），然后她赞美你',
    '让对方给你戴上一顶"绿帽子"（可以是实物或指代），然后对方赞美你'
  ],

  // ── 拆成烈度包后新暴露的读不通句子 ──
  // 「他」和「老公」各自会被替换成「对方」，两个「对方」撞在一起就成了病句
  [
    '他让你喊他大鸡巴老公，你喊的时候是什么心理？兴奋还是羞耻？',
    '对方让你喊对方大鸡巴时，你喊的时候是什么心理？兴奋还是羞耻？'
  ],
  [
    '你想让我叫你爸爸/主人还是老公/老婆？',
    '你想让我叫你爸爸/主人，还是用平时的称呼？'
  ],
  [
    '你最想让我穿上什么制服然后操我/被我操？',
    '你最想让我穿上什么制服，然后操对方，或者反过来让对方操？'
  ],
  // 引号里的「他/她」不会被归一化，情侣包里没有第三人，留着就是歧义
  [
    '给对方点外卖，备注里写暗语"多放辣，辣到他/她受不了为止"暗示今晚火热',
    '给对方点外卖，备注里写暗语"多放辣，辣到对方受不了为止"暗示今晚火热'
  ]
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
  //  - 「他/她」连写 = 指的是同一个人，整体收敛成一个「对方」
  //  - 「其他/其它/其中」的「他」不是指人
  //  - 「他们/她们」是第三方群体
  s = s.replace(/他\/她/g, '对方');
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
 * ⚠️ 这条映射**已被停用**。
 *
 * `[R]`/`[H]` 的原始语义来自手写包「奖惩卡池」：
 *   `[R]` = 奖励向   `[H]` = 惩罚向
 * 抽题逻辑（幸运格优先 R、陷阱格优先 H）一直是按这个语义写的。
 *
 * 而 TD 的 difficulty 标的是**题目的推进程度**，不是「奖励/惩罚」：
 * 同一个场景里 soft 是入门层、extreme 是推进层，二者都不是「正反两面」。
 * 举例（禁忌主题）：
 *   hard    「你有过的最疯狂的一次性幻想是什么？」
 *   extreme 「你幻想过的多人场景是什么样的？」   ← 并不比 hard 更露骨，只是更禁忌
 * 若把 difficulty 映射成 R/H，会造成两个后果：
 *   1. 把难度梯度当成「温和/极端」塞进包 —— 正是要避免的稀释
 *   2. 格子分流被打歪：口无遮拦的幸运格只剩 5 条、易主之夜只剩 6 条
 *
 * 所以转换包**不标 R/H**，格子分流改由题型（动作型 / 提问型）承担。
 */
function intensityTag(_difficulty: TDQuestion['difficulty']): string {
  return '';
}

function toTask(q: TDQuestion): string {
  const override = OVERRIDES.get(q.text);
  const body = override !== undefined ? override : normalizeText(q.text, q.type === 'truth');
  const qTag = q.type === 'truth' ? '[Q]' : '';
  return `${roleTag(q.target)}${qTag}${intensityTag(q.difficulty)} ${body}`;
}

// ─────────────────────────── 生成 ───────────────────────────

/**
 * 跨包去重：同一条题面不能同时出现在两个包里。
 *
 * TD 原库里有跨主题的重复（例如「你最大胆的一次性经历是什么？」既在 taboo 又在 spicy），
 * 拆包后就会变成两个包里各有一份，玩起来像撞题。
 *
 * PACKS 的顺序即优先级：前面的包先占位，后面的包遇到同文就让位。
 */
const usedBodies = new Set<string>();

function buildPack(spec: PackSpec) {
  const questions = COUPLE_QUESTIONS.filter(
    q => q.theme === spec.tdTheme && (!spec.tiers || spec.tiers.includes(q.difficulty))
  );
  // TD 原库自身有重复文案（同一句出现两次）；转换后同文更是没有意义，直接去重
  const seen = new Set<string>();
  const items: { task: string; raw: string }[] = [];
  const dropped: string[] = [];
  for (const q of questions) {
    const task = toTask(q);
    const body = bodyOf(task);
    if (seen.has(body)) { dropped.push(body); continue; }
    if (usedBodies.has(body)) { dropped.push(`[跨包重复] ${body}`); continue; }
    seen.add(body);
    usedBodies.add(body);
    items.push({ task, raw: q.text });
  }
  return { spec, questions, items, tasks: items.map(i => i.task), dropped };
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
  lines.push('//');
  lines.push('// 本包是「场景包」：包内题目的烈度是这个场景的推进梯度（入门 → 极限），');
  lines.push('// 不是混入的温和题，所以整体保留；格子分流由「动作型 / 提问型」承担，');
  lines.push('// 不使用 [R]/[H]（那两个标签的语义是奖励向 / 惩罚向，来自「奖惩卡池」）。');
  if (spec.tierNote) {
    lines.push('//');
    lines.push(`// ${spec.tierNote}`);
  }
  lines.push('//');
  lines.push('');
  lines.push(`const ${spec.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}: Omit<Theme, 'mode'> = {`);
  lines.push(`  id: '${spec.id}',`);
  lines.push(`  name: '${spec.name}',`);
  lines.push(`  desc: '${esc(spec.desc)}',`);
  lines.push(`  audience: '${spec.audience}',`);
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

/** 剥掉所有开头标签，只留正文 */
function bodyOf(task: string): string {
  return task.replace(/^(\[[^\]]+\]\s*)+/, '');
}

function report(pack: ReturnType<typeof buildPack>) {
  const { spec, questions, tasks, dropped } = pack;
  console.log(`\n════════ ${spec.name} (${spec.tdTheme}) ${tasks.length} 条 · audience=${spec.audience} ════════`);
  if (dropped.length > 0) {
    console.log(`  去重 ${dropped.length} 条（原库重复）：${dropped.map(d => `「${d}」`).join('')}`);
  }

  let suspect = 0;
  let residual = 0;
  const multiRef: string[] = [];
  for (const item of pack.items) {
    const body = bodyOf(item.task);
    const raw = item.raw;
    const issues: string[] = [];
    // 原文里「他」和「她」同时出现 = 指的是**两个人**，抹平成「对方」后会读不通
    if (/他/.test(raw) && /她/.test(raw)) issues.push('双人人称');
    if ((body.match(/对方/g) || []).length >= 3) issues.push('多次指代');
    if (/男生|女生/.test(body)) issues.push('残留性别词');
    // 「他妈」是脏话不是指代，别当残留他她
    if (/[他她](?!们|妈)/.test(body)) issues.push('残留他她');
    if (/老婆|老公|妻子|丈夫/.test(body)) issues.push('残留伴侣称谓');
    if (/@@|\$1|__KEEP/.test(body)) issues.push('占位符残留');
    if (issues.length > 0) {
      residual++;
      if (issues.includes('残留性别词') || issues.includes('占位符残留')) suspect++;
      else multiRef.push(`  ⚠️ [${issues.join('/')}] ${body}`);
    }
  }
  multiRef.forEach(l => console.log(l));
  console.log(`  → 需人工复核 ${residual} 条（其中重点 ${suspect} 条，其余为「多次指代」待确认）`);

  const kinds = { act: 0, ask: 0 };
  const roles = { M: 0, F: 0, both: 0 };
  const ints: Record<string, number> = {};
  for (const q of questions) {
    if (q.type === 'truth') kinds.ask++; else kinds.act++;
    if (q.target === 'male') roles.M++; else if (q.target === 'female') roles.F++; else roles.both++;
    ints[q.difficulty] = (ints[q.difficulty] || 0) + 1;
  }
  // 包的执行方永远是对方：男方选 → 女方执行；女方选 → 男方执行
  const malePool = roles.M + roles.both;
  const femalePool = roles.F + roles.both;
  const executorPool = spec.audience === 'male' ? femalePool : spec.audience === 'female' ? malePool : Math.min(malePool, femalePool);
  console.log(`  题型 act:${kinds.act} / ask:${kinds.ask}`);
  console.log(`  角色 M:${roles.M} F:${roles.F} both:${roles.both}  → 男可执行池 ${malePool} / 女可执行池 ${femalePool}`);
  console.log(`  本包实际执行方池 = ${executorPool} ${executorPool >= 74 ? '✅ 够两局' : executorPool >= 37 ? '⚠️ 够一局' : '❌ 偏薄'}`);
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
