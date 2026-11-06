/**
 * 「沉浸剧场 + 调教节奏」→ 飞行棋主题包 转换器
 *
 * 复用飞行棋既有的「[标签] 前缀」约定，不改动 Theme 的数据结构：
 *   [M]/[F]/[both]  执行方
 *   [Q]             提问型（要回答一个问题）；没有 [Q] 一律视为动作型
 *   [R]/[H]         奖励向 / 惩罚向（**仅手写包使用**，转换包一律不标）
 *
 * ── 转换的核心难点：台词是「谁对谁说的」 ──
 *
 * 飞行棋的任务卡上，**「你」= 执行者，「对方」= 伴侣**。
 * 运行期 personalizeTask 会把「你」替换成执行者姓名、把「对方」替换成伴侣姓名，
 * 而且**不区分引号内外**。所以每一条原始台词都必须先回答一个问题：
 *
 *   1. 说话的人是谁？   —— 决定「我」指谁
 *   2. 听话的人是谁？   —— 决定「你」指谁
 *   3. 有没有第三方？   —— 两人局里放不下第三方
 *
 * 三类台词的处理方式：
 *
 *   A 类（无前缀的节拍指令）
 *     台词是「控制者对执行者」说的，控制者 = 伴侣。
 *     → 「我」改成「对方」，「你」保持不变。
 *        "我没让你动，你就不许动" → "对方没让你动，你就不许动"
 *
 *   B 类（角色台词：护士/老师/空乘员/教练/总经理/陌生男人）
 *     执行者扮演角色，对方扮演被照顾的那位。
 *     → 台词里的「你」「他」「她」「{name}」全指对方，统一改成「对方」。
 *        "躺到那张床上去" → 以「护士」的身份对对方说：躺到那张床上去
 *
 *   C 类（伴侣台词：「你老婆：」「她：」）
 *     伴侣在说话，对象是执行者。
 *     → 包成「让对方对你说：…」，台词里的「你」正好指执行者，不需要改写；
 *        台词里以第三人称说执行者的地方（「他就在隔壁呢」）改成「你」。
 *
 * 两人局里放不下的内容（第三方角色「甜甜」、场景旁白、需要剧情背景的问题）
 * **不做勉强转换**，全部进「待重写清单」，交给人工改写。
 *
 * 转换出来的文件是**静态提交**的，运行期不依赖沉浸剧场/调教数据。
 *
 * 运行：
 *   npx vite-node scripts/convert-immersive-to-theme.ts            生成 5 个包
 *   npx vite-node scripts/convert-immersive-to-theme.ts --report   诊断
 *   npx vite-node scripts/convert-immersive-to-theme.ts --backlog  生成待重写清单
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PRESET_EDGING_FLOWS } from '../src/data/edgingFlows';
import { ALL_SCENARIOS } from '../src/data/scenarios';
import { ISStep } from '../src/types';

import { IMMERSIVE_PACKS, type ImmersivePackSpec } from './immersive-pack-specs';

// ─────────────────────────── 分类 ───────────────────────────

/** 角色台词：执行者扮演这个角色，对方扮演被照顾的那位 */
const ROLE_MAP: Record<string, string> = {
  护士: '护士',
  老师: '老师',
  空乘员: '空乘员',
  空乘: '空乘员',
  教练: '健身教练',
  总经理: '总经理',
  那个男人: '陌生男人'
};

/** 伴侣台词：说话的是伴侣，对象是执行者 */
const PARTNER_PREFIX = new Set(['你老婆', '她']);

/** 第三方旁白角色：两人局里放不下 */
const NARRATOR_PREFIX = '甜甜';

const PREFIX_RE = /^([^：:]{1,14}[：:])/;

type LineClass = 'A' | 'B' | 'C' | 'D';

function classify(text: string, kind: string): LineClass {
  const m = PREFIX_RE.exec(text);
  if (!m) return kind === 'story' ? 'D' : 'A';
  const prefix = m[1].replace(/[：:]$/, '');
  if (ROLE_MAP[prefix]) return 'B';
  if (PARTNER_PREFIX.has(prefix)) return 'C';
  if (prefix === NARRATOR_PREFIX) return 'D';
  return 'A';
}

// ─────────────────────────── 归一化 ───────────────────────────

/** 引号保护区：引号里的代词属于台词里的人，规则不同 */
const QUOTE_RE = /(「[^」]*」|"[^"]*"|“[^”]*”)/g;

/**
 * 保护占位符：把不该替换的片段整段圈起来，替换完再原样还原。
 *
 * ⚠️ 标记里**不能带原文**：像「其他」这种被保护的片段本身就含「他」，
 * 后面的替换轮次会把标记里的字也改掉（曾把「其他男人」改成「其对方男人」）。
 * 所以用序号占位 @@K0@@ / @@K1@@，标记本身不含任何原文字符。
 */
function makeKeeper() {
  const kept: string[] = [];
  return {
    keep: (m: string) => {
      kept.push(m);
      return `@@K${kept.length - 1}@@`;
    },
    restore: (s: string) => s.replace(/@@K(\d+)@@/g, (_, i: string) => kept[Number(i)] ?? '')
  };
}

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * 伴侣称谓 → 对方。
 * 飞行棋里双方是对称的：「你老婆」和「你老公」都是「我的另一半」，也就是对方。
 */
function normSpouse(s: string): string {
  let out = s.replace(/老婆|老公|妻子|丈夫/g, '对方');
  out = out.replace(/你的对方/g, '对方');
  out = out.replace(/你对方/g, '对方');
  return out;
}

/**
 * 「其他」「其中」的「他」不是指人，不能抹成「对方」。
 * （「被其他男人注视」抹完就成了「被其对方男人注视」）
 */
function protectNonPeople(s: string, keep: (m: string) => string): string {
  return s.replace(/其(他|她)/g, keep);
}

/**
 * A 类归一化：控制者对执行者说话。
 *   「我」= 控制者 = 伴侣 → 对方
 *   「你」= 执行者 → 保持
 */
function normA(text: string): string {
  const { keep, restore } = makeKeeper();
  const parts = text.split(QUOTE_RE);
  const out = parts.map(part => {
    const quoted = part.startsWith('「') || part.startsWith('"') || part.startsWith('“');
    let s = part;
    s = s.replace(/\{name\}/g, '你');
    s = s.replace(/我们/g, '@@WE@@');
    s = s.replace(/我/g, '对方');
    s = s.replace(/@@WE@@/g, '对方');
    s = normSpouse(s);
    if (!quoted) {
      s = protectNonPeople(s, keep);
      s = s.replace(/他\/她/g, '对方');
      s = s.replace(/(他|她)(们)/g, keep);
      s = s.replace(/他|她/g, '对方');
      s = s.replace(/男生|女生/g, '对方');
    }
    return s;
  });
  return collapse(restore(out.join('')));
}

/**
 * B 类归一化：角色对执行者说话，执行者扮演角色。
 *   台词里的「你」「他」「她」「{name}」都指被照顾的那位 = 对方
 */
function normB(text: string): string {
  const { keep, restore } = makeKeeper();
  const parts = text.split(QUOTE_RE);
  const out = parts.map(part => {
    const quoted = part.startsWith('「') || part.startsWith('"') || part.startsWith('“');
    let s = part;
    s = s.replace(/\{name\}/g, '对方');
    s = s.replace(/您/g, '对方');
    s = s.replace(/你/g, '对方');
    if (!quoted) {
      s = protectNonPeople(s, keep);
      s = s.replace(/他\/她/g, '对方');
      s = s.replace(/(他|她)(们)/g, keep);
      s = s.replace(/他|她/g, '对方');
    }
    s = normSpouse(s);
    return s;
  });
  return collapse(restore(out.join('')));
}

/**
 * C 类归一化：伴侣对执行者说话。
 *   「你」= 执行者 → 保持
 *   「他」「她」= 以第三人称说执行者 → 改成「你」
 */
function normC(text: string): string {
  const { keep, restore } = makeKeeper();
  const parts = text.split(QUOTE_RE);
  const out = parts.map(part => {
    const quoted = part.startsWith('「') || part.startsWith('"') || part.startsWith('“');
    let s = part;
    s = s.replace(/\{name\}/g, '你');
    s = normSpouse(s);
    if (!quoted) {
      s = protectNonPeople(s, keep);
      s = s.replace(/他\/她/g, '你');
      s = s.replace(/(他|她)(们)/g, keep);
      s = s.replace(/他|她/g, '你');
    }
    return s;
  });
  return collapse(restore(out.join('')));
}

// ─────────────────────────── 逐条覆写 ───────────────────────────

/**
 * 自动转换后读不通的句子，逐条手改。
 *
 * 键是**原始台词**（含前缀），值是最终任务正文（不含标签）。
 */
const OVERRIDES = new Map<string, string>([
  // ── A 类：控制者「我」是宾语而不是主语，抹成「对方」会读不通 ──
  [
    '手给我离开。忍住，把那股冲动咽回去。',
    '手离开。忍住，把那股冲动咽回去。'
  ],
  [
    '忍住，{name}。这是今晚第一次，不许给我交代。',
    '忍住，你。这是今晚第一次，不许交出去。'
  ],
  [
    '现在，可以了。{name}，我允许你了。',
    '现在，可以了。对方允许你了。'
  ],
  [
    '停。先说清楚，{name}，你今晚一肚子的火，想往哪儿发？',
    '停。先说清楚，你今晚一肚子的火，想往哪儿发？'
  ],

  // ── A 类：控制者「我」与伴侣称谓撞成两个「对方」──
  [
    '这句，给我听好了。你老婆，白天是你老婆，夜里是别人的骚货。',
    '这句，给对方听好了。白天是对方，夜里是别人的骚货。'
  ],
  [
    '车停在你家楼下。你老婆被扶着上楼，回头看了你一眼："{name}，我头晕，今晚你睡沙发吧。"',
    '车停在你家楼下。对方被扶着上楼，回头看了你一眼："我头晕，今晚你睡沙发吧。"'
  ],
  [
    '忍住。今晚你老婆累了，你也别闹。让我先跟你说几句话。',
    '忍住。今晚对方累了，你也别闹。先说几句话。'
  ],
  [
    '想清楚再说。我可不像你老婆那么好说话。你要碰我，得先说明白。',
    '想清楚再说。对方可没那么好说话。你要碰对方，得先说明白。'
  ],

  // ── B 类：角色称谓里带性别，改成中性称呼 ──
  [
    '教练：（回头看见你，笑了笑）来接人？行，她正好练完。嫂子，你老公来接你了。',
    '以「健身教练」的身份对对方说：来接人？行，对方正好练完。'
  ],
  [
    '那个男人：（扶着她）我送嫂子回去。{name}，你坐后面，我开车稳。',
    '以「陌生男人」的身份对对方说：我送对方回去。对方，坐后面，我开车稳。'
  ],
  [
    '那个男人：（举杯）嫂子还是这么漂亮。当年要不是你先下手，我可就……哈哈，开玩笑，敬你一杯。',
    '以「陌生男人」的身份对对方说：还是这么漂亮。当年要不是对方先下手，我可就……哈哈，开玩笑，敬一杯。'
  ],
  [
    '老师：对。就这样站着。我让你动，你才能动。',
    '以「老师」的身份对对方说：对。就这样站着。没有我的允许，不许动。'
  ],
  [
    '老师：（走到你面前，语气松了些）看在你态度还算端正，这道题，给你过了。',
    '以「老师」的身份对对方说：态度还算端正，这道题，给过了。'
  ],
  [
    '总经理：别让他看了，看得我烦。把他弄到隔壁档案室去，等我忙完再说。',
    '以「总经理」的身份对对方说：别看了，看得我烦。弄到隔壁档案室去，等我忙完再说。'
  ],
  [
    '空乘员：（半跪在座位旁，仰头看你）先生，夜航请放松。我来帮您……平复一下身体状态。',
    '以「空乘员」的身份对对方说：夜航请放松。我来帮您……平复一下身体状态。'
  ],

  [
    '你老婆：（轻声）对，就这样。{name}，你伺候甜甜，我伺候你——今晚，你是我俩的。',
    '让对方对你说：「对，就这样。你伺候我，我伺候你——今晚，你是我俩的。」'
  ],
  [
    '你老婆：{name}，明天下班早点回来。甜甜说，她那边还有几段"没给你看过的"录像。',
    '让对方对你说：「明天下班早点回来。我那边还有几段"没给你看过的"录像。」'
  ],

  [
    '你老婆：（从门口进来，看见你手里的纸，脚步顿住）{name}……你、你看见了？',
    '让对方对你说：「……你、你看见了？」'
  ],

  [
    '你老婆：（睁开眼，低头看你）{name}，你还欠我们一个。今晚，你伺候完她，还得伺候我。',
    '让对方对你说：「你还欠我一笔。今晚，你伺候完另一个人，还得伺候我。」'
  ],
  [
    '你老婆：（拍拍身边的沙发）过来，跪在这儿。今晚我们三个，一起把录像看完。',
    '让对方对你说：「过来，跪在这儿。今晚，把录像看完。」'
  ],
  [
    '你老婆：（在隔壁，忽然提高音量，像故意说给你听）你轻点！他就在隔壁呢！',
    '让对方对你说：「轻点！我就睡在隔壁呢。」'
  ],

  // ── C 类：以第三人称说执行者的地方 ──
  [
    '她：（轻声）把镜头对准你自己。我想看看你，{name}。别挂电话。',
    '让对方对你说：「把镜头对准你自己。我想看看你。别挂电话。」'
  ],
  [
    '你老婆：（脸红了红，声音发软）别闹……他一个人在外面怪可怜的。',
    '让对方对你说：「别闹……你一个人在外面怪可怜的。」'
  ],
  [
    '你老婆：（在隔壁，声音透过墙，模模糊糊）……电话？……嗯，在啊。他睡隔壁了。',
    '让对方对你说：「……电话？……嗯，在啊。你睡隔壁了。」'
  ],
  [
    '你老婆：（轻笑）怕什么，他不敢敲门。他要是敢，我明早就离婚。',
    '让对方对你说：「怕什么，你不敢敲门。你要是敢，我明早就离婚。」'
  ],
  [
    '你老婆：（在隔壁，声音越来越软）嗯……别……他还在隔壁呢……',
    '让对方对你说：「嗯……别……你还在隔壁呢……」'
  ],
  [
    '你老婆：（忽然一声闷哼，又憋回去）……你别弄出声来，让他听见……',
    '让对方对你说：「……你别弄出声来，让你听见……」'
  ],
  [
    '你老婆：（看着屏幕，声音很轻）他那天问我，舞跳得好不好。我说，比我们新郎强。',
    '让对方对你说：「那天班长问我，舞跳得好不好。我说，比你强。」'
  ],
  [
    '你老婆：那天他跟我说，新娘真漂亮。还问我——"要是先认识他，会选他吗。"',
    '让对方对你说：「那天班长跟我说，新娘真漂亮。还问我——"要是先认识他，会选他吗。"」'
  ]
]);

/**
 * 两人局放不下的 A 类台词。
 *
 * 这些句子本身是干净的节拍指令，但里面有一个**第三方角色**
 * （甜甜 / 总经理的实习生 / 隔壁的邻居），需要第三个人才能成立。
 * 硬转的话「她」会被抹成「对方」，语义直接塌掉 —— 所以进待重写清单。
 */
const BLACKLIST = new Set<string>([
  // 第三方角色「甜甜」在场
  '听清楚。这些不是用来怀念的，是用来让你明白——她是怎么样，一步一步变成现在这样的。',
  '你记得那杯热水吗？她现在想起那晚，大概也在笑你傻。',
  '忍住。她碰你了，你反而不许。把手背到背后，咽回去。',
  '停住。一，二，停。她就在你面前，你反而不许动。',
  '停。松开她。',
  '忍住，想清楚再回答。你老婆在等你的答案，甜甜在等着看你的笑话。',
  '前面红灯。甜甜忽然侧过身，把手搭在你大腿上。"开了一天车，累了吧？"',
  '门开了，灯没开，只有窗外的城市灯光透进来。甜甜拉住你，反手把门带上。',
  '事后，甜甜打开灯，递给你一杯水。{name}，车技进步了。',
  '门铃响了。你惊了一下，隔壁的声音也忽然停了。你去开门——是甜甜，穿着睡衣，站在门口。',
  '隔壁的门开了。你老婆站在门口，睡衣松垮，脸红得不像话。她看了一眼墙这边的你，又看了一眼甜甜。',
  '甜甜的话还在你耳边：下一集《交换之夜》，我带你去见见那些"主人"。',
  // 第三方角色「总经理的实习生」在场
  '她抬头看见你，没有惊慌，只是对你笑了一下，像在看一件突然闯进来的旧家具。',
  '看清楚，{name}。她今晚不是你老婆，她是总经理的实习生。你，只是来送文件的。'
]);

// ─────────────────────────── 剧本侧 ───────────────────────────

/**
 * 剧本步骤的逐条覆写。
 *
 * 剧本里的「你」指代并不统一：有的步骤是「执行者被指示」，
 * 有的却是「执行者操作别人」（比如「{actor}帮你拍一张照片」）。
 * 这类句子必须逐条确认，不能套通则。
 */
const STEP_OVERRIDES = new Map<string, string>([
  // 淫妻启蒙 V2
  [
    '你觉得自己是哪种类型——"想看她享受"还是"想看她被占有"？这两个感觉完全不同，你偏向哪边？',
    '你觉得自己是哪种类型——"想看对方享受"还是"想看对方被占有"？这两个感觉完全不同，你偏向哪边？'
  ],
  [
    '关掉所有灯，两人并排躺下或靠在沙发上。握住{partner}的手。用你最有磁性的声音，慢慢描述这场幻想的开端——"想象你躺在一张很大的床上，窗帘半掩，房间很暗……" 详细描述她穿的什么、房间什么味道、谁在看着她。',
    '关掉所有灯，两人并排躺下或靠在沙发上。握住对方的手。用你最有磁性的声音，慢慢描述这场幻想的开端——"想象你躺在一张很大的床上，窗帘半掩，房间很暗……" 详细描述对方穿的什么、房间什么味道、还有谁在暗中看着对方。'
  ],
  [
    '听到她描述那个画面时，你身体哪里最有反应？和她想象中的那个"他"相比，你觉得自己的优势在哪？',
    '听到对方描述那个画面时，你身体哪里最有反应？和对方想象中的那个男人相比，你觉得自己的优势在哪？'
  ],
  [
    '看到别人给她发的私信，你什么感觉？有没有哪一条让你觉得"这个人比我更懂怎么夸她"？',
    '看到别人给对方发的私信，你什么感觉？有没有哪一条让你觉得"这个人比我更懂怎么夸对方"？'
  ],
  [
    '{actor}列出的条件里，有没有哪一条让你觉得"他对这件事是认真的"？或者有没有哪一条让你有点失望？',
    '你列出的条件里，有没有哪一条让你觉得"对方对这件事是认真的"？或者有没有哪一条让你有点失望？'
  ],
  [
    '你脑海里浮现了什么样的他？还是你根本没看清脸，更多是感受？',
    '你脑海里浮现的是个什么样的男人？还是你根本没看清脸，更多是感受？'
  ],
  [
    '现在轮到你。打开录音，用你最性感的声音描述——"如果你和另一个男人拥抱，他的手放在你的腰上，你会怎么呼吸？"描述你的身体反应，越细越好。录完发给{actor}。',
    '现在轮到你。打开录音，用你最性感的声音描述——"如果你和另一个男人拥抱，他的手放在你的腰上，你会怎么呼吸？"描述你的身体反应，越细越好。录完发给对方。'
  ],
  [
    '{actor}帮你拍一张照片——不能露脸，但要有足够的暗示（锁骨、腿、腰线、或者一件撩起的衬衫）。选一张你觉得"发出去会有人评论"的。',
    '你帮对方拍一张照片——不能露脸，但要有足够的暗示（锁骨、腿、腰线、或者一件撩起的衬衫）。选一张你觉得"发出去会有人评论"的。'
  ],
  [
    '一起去一家正规的按摩 SPA，选双人套餐。但要做一个特别的约定：她选的技师必须是异性，他选的技师也必须是异性。在同一个房间里，感受各自的陌生按摩师触碰{partner}的身体。',
    '一起去一家正规的按摩 SPA，选双人套餐。但要做一个特别的约定：两位技师都必须是异性。在同一个房间里，感受对方被陌生按摩师触碰时的反应。'
  ],
  [
    '当他的嘴唇经过你的那个部位时，你在想象什么？你希望另一个人的嘴唇也在同样的地方吗？还是你希望他永远不要停？',
    '当陌生人的嘴唇经过你的那个部位时，你在想象什么？你希望另一个人的嘴唇也在同样的地方吗？还是你希望对方永远不要停？'
  ]
]);

/**
 * 剧本步骤的代词归一。
 *
 * actor 决定谁执行，也决定台词里的「她」「他」默认指谁：
 *   actor=0（男方执行）→ 「她」是伴侣 → 对方；「他」通常是幻想里的第三方，保留
 *   actor=1（女方执行）→ 「他」是伴侣 → 对方；「她」通常是第三方，保留
 *   actor=both         → 「她」是伴侣 → 对方；「他」保留
 */
function normStep(step: ISStep): string {
  const { keep, restore } = makeKeeper();
  const raw = STEP_OVERRIDES.get(step.text) ?? step.text;
  const parts = raw.split(QUOTE_RE);
  const out = parts.map(part => {
    const quoted = part.startsWith('「') || part.startsWith('"') || part.startsWith('“');
    let s = part;
    s = s.replace(/\{actor\}/g, '你');
    s = s.replace(/\{partner\}/g, '对方');
    s = normSpouse(s);
    if (!quoted) {
      s = protectNonPeople(s, keep);
      s = s.replace(/他\/她/g, keep);
      s = s.replace(/(他|她)(们)/g, keep);
      if (step.actor === 0) s = s.replace(/她/g, '对方');
      else if (step.actor === 1) s = s.replace(/他/g, '对方');
      else s = s.replace(/她/g, '对方');
    }
    return s;
  });
  return collapse(restore(out.join('')));
}

// ─────────────────────────── 生成 ───────────────────────────

interface Item {
  task: string;
  raw: string;
  source: string;
}

/** 跨包去重：同一条题面不能同时出现在两个包里 */
const usedBodies = new Set<string>();

function bodyOf(task: string): string {
  return task.replace(/^(\[[^\]]+\]\s*)+/, '');
}

function flowItems(spec: ImmersivePackSpec): { items: Item[]; backlog: { source: string; raw: string; reason: string }[] } {
  const items: Item[] = [];
  const backlog: { source: string; raw: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const flowId of spec.flows ?? []) {
    const flow = PRESET_EDGING_FLOWS.find(f => f.id === flowId);
    if (!flow) throw new Error(`未知流程：${flowId}`);
    for (const phase of flow.phases) {
      for (const line of phase.script ?? []) {
        const c = classify(line.text, line.kind);
        const source = `${flow.name}（${flowId}）· ${phase.title ?? phase.kind}`;

        if (c === 'D') {
          backlog.push({
            source,
            raw: line.text,
            reason: line.text.startsWith(`${NARRATOR_PREFIX}：`)
              ? '第三方角色台词：两人局里放不下「甜甜」这个角色'
              : '场景旁白：不是可执行的动作，需要改写成任务'
          });
          continue;
        }

        if (BLACKLIST.has(line.text)) {
          backlog.push({
            source,
            raw: line.text,
            reason: '依赖第三方角色在场：两人局里放不下'
          });
          continue;
        }

        let body: string;
        if (c === 'B') {
          const m = PREFIX_RE.exec(line.text)!;
          const role = ROLE_MAP[m[1].replace(/[：:]$/, '')];
          let inner = line.text.slice(m[0].length).replace(/^（[^）]*）\s*/, '');
          inner = normB(inner);
          body = `以「${role}」的身份对对方说：${inner}`;
        } else if (c === 'C') {
          const m = PREFIX_RE.exec(line.text)!;
          let inner = line.text.slice(m[0].length).replace(/^（[^）]*）\s*/, '');
          inner = normC(inner);
          body = `让对方对你说：「${inner}」`;
        } else {
          body = normA(line.text);
        }

        // 逐条覆写优先于通则：自动转换后读不通的句子在这里手改
        const override = OVERRIDES.get(line.text);
        if (override !== undefined) body = override;

        if (!body) {
          backlog.push({ source, raw: line.text, reason: '转换后为空' });
          continue;
        }

        const task = `[both] ${body}`;
        const b = bodyOf(task);
        if (seen.has(b) || usedBodies.has(b)) {
          backlog.push({ source, raw: line.text, reason: '与其它条目重复' });
          continue;
        }
        seen.add(b);
        usedBodies.add(b);
        items.push({ task, raw: line.text, source });
      }
    }
  }
  return { items, backlog };
}

function scenarioItems(spec: ImmersivePackSpec): { items: Item[]; backlog: { source: string; raw: string; reason: string }[] } {
  const items: Item[] = [];
  const backlog: { source: string; raw: string; reason: string }[] = [];
  const scenario = ALL_SCENARIOS.find(s => s.id === spec.scenario);
  if (!scenario) throw new Error(`未知剧本：${spec.scenario}`);

  const seen = new Set<string>();
  for (const act of scenario.acts) {
    for (const step of act.steps) {
      const source = `${scenario.title} · ${act.title}`;
      if (step.type === 'narration' || step.type === 'choice') {
        backlog.push({ source, raw: step.text, reason: '剧本旁白/分支：不是可执行的任务' });
        continue;
      }
      const body = normStep(step);
      const roleTag = step.actor === 0 ? '[M]' : step.actor === 1 ? '[F]' : '[both]';
      const qTag = step.type === 'question' ? '[Q]' : '';
      const task = `${roleTag}${qTag} ${body}`;
      const b = bodyOf(task);
      if (seen.has(b) || usedBodies.has(b)) {
        backlog.push({ source, raw: step.text, reason: '与其它条目重复' });
        continue;
      }
      seen.add(b);
      usedBodies.add(b);
      items.push({ task, raw: step.text, source });
    }
  }
  return { items, backlog };
}

// ─────────────────────────── 输出 ───────────────────────────

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 写文件前的护栏。
 *
 * macOS 的文件系统**默认不区分大小写**，所以 `coupleRolePlay.ts` 和
 * `coupleRoleplay.ts` 是同一个文件 —— 手写包「情境扮演」曾被新包整个覆盖。
 * 这里检查目标路径上已有的内容是不是同一个包，不是就拒绝写入。
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

function pascal(id: string): string {
  return id.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
}

function toSource(spec: ImmersivePackSpec, tasks: string[]): string {
  const L: string[] = [];
  L.push("import { Theme } from '../../types';");
  L.push('');
  L.push('//');
  L.push(`// ${spec.name} —— 由「沉浸剧场 / 调教节奏」转换而来（scripts/convert-immersive-to-theme.ts）。`);
  L.push('//');
  L.push('// 标签约定：');
  L.push('//   [M]/[F]/[both] 执行方   [Q] 提问型（要回答一个问题）');
  L.push('//');
  L.push('// 任务卡上「你」= 执行者，「对方」= 伴侣（运行期 personalizeTask 会替换成真名）。');
  L.push('// 本包不带 [R]/[H]：那两个标签的语义是奖励向 / 惩罚向，来自「奖惩卡池」。');
  L.push('//');
  L.push(`// ${spec.note}`);
  L.push('//');
  L.push('');
  const v = pascal(spec.id);
  L.push(`const ${v}: Omit<Theme, 'mode'> = {`);
  L.push(`  id: '${spec.id}',`);
  L.push(`  name: '${spec.name}',`);
  L.push(`  desc: '${esc(spec.desc)}',`);
  L.push(`  audience: '${spec.audience}',`);
  L.push('  tasks: [');
  for (const t of tasks) L.push(`    "${esc(t)}",`);
  L.push('  ],');
  L.push('  actionStates: [');
  for (const s of spec.actionStates) L.push(`    "${esc(s)}",`);
  L.push('  ],');
  L.push('  conditionStates: [');
  for (const s of spec.conditionStates) L.push(`    "${esc(s)}",`);
  L.push('  ]');
  L.push('};');
  L.push('');
  L.push(`export default ${v};`);
  L.push('');
  return L.join('\n');
}

// ─────────────────────────── 诊断 ───────────────────────────

function report(spec: ImmersivePackSpec, items: Item[], backlog: { source: string; raw: string; reason: string }[]) {
  console.log(`\n════════ ${spec.name} (${spec.id}) ${items.length} 条 · mode=${spec.mode} ════════`);
  const kinds = { act: 0, ask: 0 };
  const roles = { M: 0, F: 0, both: 0 };
  for (const it of items) {
    const tags = it.task.match(/^\[([^\]]+)\]/)?.[1] ?? 'both';
    if (it.task.includes('[Q]')) kinds.ask++; else kinds.act++;
    if (tags === 'M') roles.M++; else if (tags === 'F') roles.F++; else roles.both++;
  }
  const malePool = roles.M + roles.both;
  const femalePool = roles.F + roles.both;
  console.log(`  题型 act:${kinds.act} / ask:${kinds.ask}`);
  console.log(`  角色 M:${roles.M} F:${roles.F} both:${roles.both}  → 男可执行池 ${malePool} / 女可执行池 ${femalePool}`);
  console.log(`  转出待重写 ${backlog.length} 条`);

  let flagged = 0;
  for (const it of items) {
    const b = bodyOf(it.task);
    const issues: string[] = [];
    if (/[他她](?!们|妈)/.test(b) && !/那个男人|陌生|班长|别的男人|另一个男人|男人|第三/.test(b)) issues.push('残留他她');
    if (/男生|女生/.test(b)) issues.push('残留性别词');
    if (/老婆|老公|妻子|丈夫/.test(b)) issues.push('残留伴侣称谓');
    if (/甜甜|实习生|学长|班主任/.test(b)) issues.push('第三方人物');
    if (/@@|\{[^}]+\}/.test(b)) issues.push('占位符残留');
    if ((b.match(/对方/g) || []).length >= 4) issues.push('多次指代');
    if (/你的对方|你对方/.test(b)) issues.push('指代病句');
    if (issues.length > 0) {
      flagged++;
      console.log(`  ⚠️ [${issues.join('/')}] ${b}`);
    }
  }
  console.log(`  → 需人工复核 ${flagged} 条`);
}

// ─────────────────────────── 待重写清单 ───────────────────────────

function toBacklog(all: { source: string; raw: string; reason: string }[]): string {
  const L: string[] = [];
  L.push('# 内容素材 · 待人工重写清单');
  L.push('');
  L.push('> 由 `scripts/convert-immersive-to-theme.ts --backlog` 生成。');
  L.push('>');
  L.push('> 这些素材**结构上无法自动转成飞行棋任务**，不是被丢弃，而是排队等人工改写。');
  L.push('> 共同原因：任务卡上只有「执行者」和「伴侣」两个人，而原文要么依赖第三方角色，');
  L.push('> 要么依赖剧情背景，要么根本不是可执行的动作。');
  L.push('');
  L.push(`共 **${all.length} 条**。`);
  L.push('');
  const groups = new Map<string, typeof all>();
  for (const b of all) {
    const key = b.reason;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }
  let idx = 0;
  for (const [reason, list] of groups) {
    L.push(`## ${reason}（${list.length} 条）`);
    L.push('');
    for (const b of list) {
      idx++;
      L.push(`${idx}. **${b.source}**`);
      L.push(`   > ${b.raw.replace(/\n/g, '\n   > ')}`);
    }
    L.push('');
  }
  return L.join('\n');
}

// ─────────────────────────── 入口 ───────────────────────────

const isReport = process.argv.includes('--report');
const isBacklog = process.argv.includes('--backlog');

const allBacklog: { source: string; raw: string; reason: string }[] = [];

for (const spec of IMMERSIVE_PACKS) {
  const { items, backlog } = spec.scenario ? scenarioItems(spec) : flowItems(spec);
  allBacklog.push(...backlog);
  if (isReport) {
    report(spec, items, backlog);
  } else {
    const prefix = spec.mode === 'couple' ? 'couple' : 'normal';
    const outPath = `src/data/themes/${prefix}${pascal(spec.id)}.ts`;
    assertTargetFree(outPath, spec.id);
    writeFileSync(outPath, toSource(spec, items.map(i => i.task)), 'utf8');
    console.log(`✅ ${outPath}  ${items.length} 条`);
  }
}

/**
 * 「淫妻开发之路」整本剧本进待重写清单。
 *
 * 这本剧本有 1420 步，其中 235 个提问步、24 个指令步全部依赖剧情上下文
 * （「原文里…」「客服说…」「上一章…」），把第三方角色（杨琛、丁哥、许莹莹）
 * 和章节进度写进了题面。两人局里既没有第三方，也没有「上一章」。
 */
const NOVEL = ALL_SCENARIOS.find(s => s.id === 'hotwife-novel');
if (NOVEL) {
  for (const act of NOVEL.acts) {
    for (const step of act.steps) {
      if (step.type === 'narration') continue;
      allBacklog.push({
        source: `${NOVEL.title} · ${act.title}`,
        raw: step.text,
        reason: '依赖剧情背景与第三方角色：需要剥离「上一章/客服/原文」框架后重写'
      });
    }
  }
}

if (isBacklog) {
  const outPath = 'docs/内容素材待重写清单.md';
  writeFileSync(outPath, toBacklog(allBacklog), 'utf8');
  console.log(`✅ ${outPath}  ${allBacklog.length} 条`);
}
