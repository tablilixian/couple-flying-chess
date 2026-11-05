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
  /**
   * 谁可以选这个包。
   *
   * 飞行棋里 **包的执行方永远是对方**：
   *   男方选 → 女方执行（所以包要够 `[F]`/`[both]`）
   *   女方选 → 男方执行（所以包要够 `[M]`/`[both]`）
   *
   * 因此角色极不平衡的库要用 audience 把它钉给合适的一方：
   * `slutwife` 有 129 条 `[F]`、只有 12 条 `[M]`，正好只给男方选。
   */
  audience: 'common' | 'male' | 'female';
  actionStates: string[];
  conditionStates: string[];
}

const PACKS: PackSpec[] = [
  {
    id: 'public-eyes',
    name: '众目之下',
    desc: '公共场合的暴露与窥视',
    tdTheme: 'exposure',
    audience: 'common',
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
    audience: 'common',
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
    audience: 'common',
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
  },
  {
    id: 'beyond-the-line',
    name: '底线之后',
    desc: '大胆突破 · 解锁没试过的',
    tdTheme: 'taboo',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说出一个你们都没试过但都好奇的事',
      '[F] 每次掷骰前，用最轻的声音说一句你的底线',
      '[both] 每次掷骰前，十指相扣同时问一句「敢不敢」'
    ],
    conditionStates: [
      '[M] 今晚任何底线都可以重新商量',
      '[F] 谁先说不敢，这一局就听谁的',
      '[both] 答应对方的任何要求都不能反悔'
    ]
  },
  {
    id: 'three-way',
    name: '三人世界',
    desc: '旁观与被旁观 · 共享凝视',
    tdTheme: 'third',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，描述一次「如果第三个人在场会怎样」',
      '[F] 每次掷骰前，讲一个你们聊过的第三人话题',
      '[both] 每次掷骰前，同时说出对方最能接受的那个「第三个人」'
    ],
    conditionStates: [
      '[M] 今晚可以随时假设第三个人在场',
      '[F] 谈论第三个人时不许表现出排斥',
      '[both] 任何关于第三人的话题都要正面回答'
    ]
  },
  {
    id: 'loose-tongue',
    name: '口无遮拦',
    desc: '言语挑逗 · 粗口刺激',
    tdTheme: 'dirtytalk',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，用最直接的词夸对方一次',
      '[F] 每次掷骰前，说一句让对方脸红的台词',
      '[both] 每次掷骰前，比一次谁先绷不住'
    ],
    conditionStates: [
      '[M] 今晚说脏话不许收敛',
      '[F] 不许用手或别的东西代替说话',
      '[both] 嘴上的话必须和动作同步'
    ]
  },
  {
    id: 'changed-hands',
    name: '易主之夜',
    desc: '被夺走与看着被夺走',
    tdTheme: 'cuckold',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，讲一次「看着对方属于别人」的想象',
      '[F] 每次掷骰前，演一次「不再属于你」的样子',
      '[both] 每次掷骰前，换一个位置扮演主导方'
    ],
    conditionStates: [
      '[M] 今晚允许对方「不把你当回事」',
      '[F] 必须真的把对方当成「别人的」',
      '[both] 交换主导权后不许笑场'
    ]
  },
  {
    id: 'swapped-night',
    name: '互换之夜',
    desc: '伴侣共享 · 换偶幻想',
    tdTheme: 'swing',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说一个你想「让出去」的特权',
      '[F] 每次掷骰前，说一个你想「独占」的时刻',
      '[both] 每次掷骰前，一起数三个你们都能接受的原则'
    ],
    conditionStates: [
      '[M] 今晚不能表现出占有欲',
      '[F] 你提出的底线对方必须尊重',
      '[both] 任何决定都由两人共同做出'
    ]
  },
  {
    id: 'seductive-wife',
    name: '风情妻子',
    desc: '风情万种 · 属于对方的妻子',
    tdTheme: 'slutwife',
    // 129 条 [F] / 12 条 [M] —— 只给男方选，交给女方执行
    audience: 'male',
    actionStates: [
      '[M] 每次掷骰前，用一句话形容对方今天有多迷人',
      '[F] 每次掷骰前，诱惑对方一次（用声音或姿态）',
      '[both] 每次掷骰前，互相比一句「换我也会选你」'
    ],
    conditionStates: [
      '[M] 今晚由对方掌握节奏，你只负责配合',
      '[F] 保持「属于对方」的姿态，不许主动收回',
      '[both] 今晚所有的主导权都交给对方'
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
  // TD 原库自身有重复文案（同一句出现两次）；转换后同文更是没有意义，直接去重
  const seen = new Set<string>();
  const items: { task: string; raw: string }[] = [];
  const dropped: string[] = [];
  for (const q of questions) {
    const task = toTask(q);
    const body = bodyOf(task);
    if (seen.has(body)) { dropped.push(body); continue; }
    seen.add(body);
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
  lines.push('//   [R] 奖励向（温和档）    [H] 硬核向（极限档）');
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
    if (/[他她](?!们)/.test(body)) issues.push('残留他她');
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
