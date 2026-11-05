/**
 * TD 题库 → 飞行棋主题包的**规格表**。
 *
 * 单独抽成模块，是为了让转换器（scripts/convert-td-to-theme.ts）和
 * 页面数据生成器（scripts/emit-page-data.ts）共用同一份定义 ——
 * 否则「哪些包是烈度包」在两处各写一遍，改一次就容易对不上。
 */
import { TDTheme, TDDifficulty } from '../src/types';

export interface PackSpec {
  id: string;
  name: string;
  desc: string;
  tdTheme: TDTheme;
  /**
   * 只取这几个烈度档。不填 = 该主题的全部档。
   *
   * 「烈度由包决定」：同一个幻想的不同烈度档拆成不同的包，
   * 玩家选包就等于选了烈度，包内不混档。
   */
  tiers?: TDDifficulty[];
  /** 生成文件里写一句烈度构成说明（纯注释，不进 UI） */
  tierNote?: string;
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

export const PACKS: PackSpec[] = [
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
  },

  // ────────────────────────────────────────────────────────────────
  // 「烈度包」：同一个幻想按烈度档拆成不同的包。
  //
  // 起因：TD 情侣库 1961 条里，只有 9 个主题被转换成包，
  // 剩下 5 个幻想（sweet / spicy / roleplay / kinky / bdsm）共 830 条
  // 从未进过任何包。抽样确认过它们内部本来就是「同一幻想的推进梯度」，
  // 没有跑题的温和题，零重复，与现有包仅 1 条同文。
  //
  // 拆法：按「幻想 × 烈度档」独立成包 —— 玩家选包就等于选了烈度，
  // 包内不混档。只有两档题量太薄（sweet-extreme 4 条、roleplay-hot 10 条），
  // 并入同幻想相邻档，其余 10 个包严格单一烈度。
  // ────────────────────────────────────────────────────────────────

  {
    id: 'first-feelings',
    name: '青涩记事',
    desc: '恋爱起点 · 第一次的心动',
    tdTheme: 'sweet',
    tiers: ['soft'],
    tierNote: '烈度构成：soft（入门层）54 条 —— 这一档全是「第一次」：第一次心动、第一次牵手、第一次约会。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说出你们第一次见面的日期',
      '[F] 每次掷骰前，模仿对方第一次心动时的表情',
      '[both] 每次掷骰前，对视 3 秒然后同时笑出来'
    ],
    conditionStates: [
      '[M] 本局只准聊回忆，不许聊现在',
      '[F] 记得对方说过的第一句夸奖',
      '[both] 任何答案都要补一句「我记得」'
    ]
  },
  {
    id: 'slow-warmth',
    name: '细水长流',
    desc: '相处的温度 · 依赖与偏爱',
    tdTheme: 'sweet',
    tiers: ['hot'],
    tierNote: '烈度构成：hot 38 条 —— 从「第一次」推进到「离不开对方」：谁更主动、谁更依赖。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说一件对方最近让你觉得被宠着的小事',
      '[F] 每次掷骰前，模仿对方最黏人的一个动作',
      '[both] 每次掷骰前，肩膀靠在一起数到 5'
    ],
    conditionStates: [
      '[M] 今晚必须让对方先说需求',
      '[F] 回答问题时语气不许变冷',
      '[both] 每答完一题就十指相扣一次'
    ]
  },
  {
    id: 'hidden-heart',
    name: '隐秘心事',
    desc: '关系里的真话 · 失望与和解',
    tdTheme: 'sweet',
    tiers: ['hard', 'extreme'],
    tierNote:
      '烈度构成：hard 34 条 + extreme 4 条 —— 这一档是关系的暗面：失望、嫉妒、说不出口的在意。\n' +
      '// extreme 只有 4 条，单独成包太薄，并入相邻档；这是 12 个包里唯一混档的一个。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，讲一件自己一直没说出口的在意',
      '[F] 每次掷骰前，承认一个自己的缺点',
      '[both] 每次掷骰前，先沉默 3 秒再说实话'
    ],
    conditionStates: [
      '[M] 本局不许开玩笑',
      '[F] 对方答完必须给一个拥抱',
      '[both] 不许用「没什么」结束任何一题'
    ]
  },
  {
    id: 'flame-probe',
    name: '火辣试探',
    desc: '性话题的入口 · 还没说出口的那些',
    tdTheme: 'spicy',
    tiers: ['hot'],
    tierNote: '烈度构成：hot 126 条 —— 性话题的入门层：什么时候最性感、最想一起做什么。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说出一个你最想和对方试的动作',
      '[F] 每次掷骰前，用一句话形容对方最撩人的地方',
      '[both] 每次掷骰前，同时把一个禁区说出口'
    ],
    conditionStates: [
      '[M] 不许直接说要，只说暗示',
      '[F] 回答完必须凑近对方耳边重复一遍',
      '[both] 本局任何话题都不许提前结束'
    ]
  },
  {
    id: 'flame-daily',
    name: '烈焰日常',
    desc: '亲密的深处 · 幻想与前戏',
    tdTheme: 'spicy',
    tiers: ['hard'],
    tierNote: '烈度构成：hard 165 条 —— 亲密关系的核心层：内心最深处的幻想、最喜欢的前戏方式。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说一个你们从没试过的偏好',
      '[F] 每次掷骰前，用行动演示对方刚说的偏好',
      '[both] 每次掷骰前，互相调整一次呼吸节奏'
    ],
    conditionStates: [
      '[M] 今晚由对方决定节奏，你只负责配合',
      '[F] 不许敷衍，每个答案都要有一个具体例子',
      '[both] 任何动作都要先问一句「可以吗」'
    ]
  },
  {
    id: 'desire-abyss',
    name: '欲海深陷',
    desc: '最不设防的那一层',
    tdTheme: 'spicy',
    tiers: ['extreme'],
    tierNote: '烈度构成：extreme 148 条 —— 这一档是最不设防的幻想，说出来就得面对。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说出你最深处的那个幻想',
      '[F] 每次掷骰前，让对方从三个选项里选一个',
      '[both] 每次掷骰前，一起把一个幻想拆成三步'
    ],
    conditionStates: [
      '[M] 本局不许把幻想停在想象阶段',
      '[F] 安全词随时可用，用了就立刻停',
      '[both] 今晚任何幻想都要被认真对待'
    ]
  },
  {
    id: 'role-cast',
    name: '角色试镜',
    desc: '换个身份说话 · 主仆与反差',
    tdTheme: 'roleplay',
    tiers: ['hot', 'hard'],
    tierNote:
      '烈度构成：hot 10 条 + hard 38 条 —— 角色扮演从「选一个身份」推进到「想体验哪种关系」。\n' +
      '// hot 只有 10 条，单独成包太薄，并入相邻档；这是 12 个包里另一个混档的。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，报出一个你想演的角色名',
      '[F] 每次掷骰前，用角色的语气说一句话',
      '[both] 每次掷骰前，交换一次角色'
    ],
    conditionStates: [
      '[M] 今晚你演的角色不许中途出戏',
      '[F] 用对方选的语气一直演到下一个任务',
      '[both] 角色设定由掷骰决定，两人都不许赖账'
    ]
  },
  {
    id: 'role-lost',
    name: '戏中失控',
    desc: '进了戏就出不来',
    tdTheme: 'roleplay',
    tiers: ['extreme'],
    tierNote: '烈度构成：extreme 28 条 —— 角色扮演的失控档：设定一旦成立就不许中途退出。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，给对方加一条角色设定',
      '[F] 每次掷骰前，全程不许用真名',
      '[both] 每次掷骰前，一起演完一个三句的小片段'
    ],
    conditionStates: [
      '[M] 今晚的设定不许中途退出',
      '[F] 演到对方喊停为止',
      '[both] 任何一句台词都不能敷衍跳过'
    ]
  },
  {
    id: 'kink-list',
    name: '癖好清单',
    desc: '主导与顺从 · 那些奇怪偏好',
    tdTheme: 'kinky',
    tiers: ['hard'],
    tierNote: '烈度构成：hard 48 条 —— 癖好的入口层：主导还是顺从、想被怎么称呼。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，说出一个你想试试的小癖好',
      '[F] 每次掷骰前，问对方最想被怎么称呼',
      '[both] 每次掷骰前，各自说一个不能碰的红线'
    ],
    conditionStates: [
      '[M] 今晚可以随时提议新的玩法',
      '[F] 红线之外随便试',
      '[both] 任何癖好都要双方点头才算数'
    ]
  },
  {
    id: 'kink-beyond',
    name: '越界癖好',
    desc: '说出口的癖好 · 试探边界',
    tdTheme: 'kinky',
    tiers: ['extreme'],
    tierNote: '烈度构成：extreme 58 条 —— 癖好的越界档：把画面说清楚，不再停在暗示。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，描述一个你想看对方做的画面',
      '[F] 每次掷骰前，让对方重复一次刚才的回答',
      '[both] 每次掷骰前，互相解锁一个新癖好'
    ],
    conditionStates: [
      '[M] 今晚没有「差不多就行」',
      '[F] 对方说可以的时候要当真',
      '[both] 越界之前先问一次边界'
    ]
  },
  {
    id: 'bond-first',
    name: '束缚试探',
    desc: '蒙眼与绑手 · 第一次交出控制',
    tdTheme: 'bdsm',
    tiers: ['hard'],
    tierNote: '烈度构成：hard 28 条 —— 束缚的入门层：蒙眼、绑手、对轻度疼痛的态度。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，先问对方能不能碰',
      '[F] 每次掷骰前，用一个动作试探对方的底线',
      '[both] 每次掷骰前，把节奏交回给对方'
    ],
    conditionStates: [
      '[M] 今晚只做对方明确点头的事',
      '[F] 任何时候都要能立刻叫停',
      '[both] 安全词必须先约定好再开始'
    ]
  },
  {
    id: 'bond-deep',
    name: '枷锁深处',
    desc: '痛与服从 · 把边界交给对方',
    tdTheme: 'bdsm',
    tiers: ['extreme'],
    tierNote: '烈度构成：extreme 51 条 —— 束缚的深处：把控制权和边界一起交出去。',
    audience: 'common',
    actionStates: [
      '[M] 每次掷骰前，把控制权完全交出去',
      '[F] 每次掷骰前，说清这一次的边界在哪',
      '[both] 每次掷骰前，一起确认一次「还能继续吗」'
    ],
    conditionStates: [
      '[M] 今晚由对方决定什么时候停',
      '[F] 不许因为心软而放松要求',
      '[both] 任何时候停就是停，不需要理由'
    ]
  }
];
