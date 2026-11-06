/**
 * 「沉浸剧场 + 调教节奏」→ 飞行棋主题包的**规格表**。
 *
 * 单独抽成模块，让转换器（scripts/convert-immersive-to-theme.ts）和
 * 页面数据生成器（scripts/emit-page-data.ts）共用同一份定义。
 *
 * 分包依据是**素材性质**，不是原流程的叙事顺序：
 *   - 节奏掌控：三条纯「节拍 + 寸止」的流程，没有角色、没有第三方
 *   - 角色扮演：有明确角色身份的流程（护士/老师/空乘/教练…），两人对演
 *   - 场景暗线：有完整叙事场景的流程，含「伴侣台词」（对方说话）
 *   - 幻想构建：剧本「淫妻启蒙 V2」，按 actor 分派给男方/女方/双方
 *   - 信任试探：剧本「信任探索」，普通模式
 */
export interface ImmersivePackSpec {
  id: string;
  name: string;
  desc: string;
  mode: 'couple' | 'normal';
  /**
   * 谁可以选这个包。
   *
   * 飞行棋里「包的执行方永远是对方」：男方选 → 女方执行，女方选 → 男方执行。
   * 所以受众要按内容里角色极不平衡的程度来定。
   */
  audience: 'common' | 'male' | 'female';
  /** 取材自哪些调教流程（PRESET_EDGING_FLOWS 的 id） */
  flows?: string[];
  /** 取材自哪个剧本（ALL_SCENARIOS 的 id） */
  scenario?: string;
  /** 生成文件里写一句构成说明（纯注释，不进 UI） */
  note: string;
  actionStates: string[];
  conditionStates: string[];
}

export const IMMERSIVE_PACKS: ImmersivePackSpec[] = [
  {
    id: 'rhythm-control',
    name: '节奏掌控',
    desc: '节拍与寸止 · 由慢到快的控制',
    mode: 'couple',
    audience: 'common',
    flows: ['flow-warmup', 'flow-edge', 'flow-extreme'],
    note:
      '取材于三条纯节拍流程（慢热渐入 / 寸止挑战 / 极限控制）。\n' +
      '// 没有角色、没有第三方，全部是「控制者对执行者」的指令，转换时只需把\n' +
      '// 控制者的「我」换成「对方」，执行者的「你」保持不变。',
    actionStates: [
      '[M] 每次掷骰前，用节拍数到 3 拍再开口',
      '[F] 每次掷骰前，先把呼吸节奏调到和对方一样',
      '[both] 每次掷骰前，一起数一个倒计时'
    ],
    conditionStates: [
      '[M] 今晚的节奏由对方定，不许抢拍',
      '[F] 每一轮寸止都要坚持到对方点头',
      '[both] 任何时候喊停就立刻停，不问原因'
    ]
  },
  {
    id: 'role-lines',
    name: '角色台词',
    desc: '换个身份说话 · 护士、老师与机舱',
    mode: 'couple',
    audience: 'common',
    flows: ['flow-nurse', 'flow-teacher', 'flow-flight', 'flow-office', 'flow-gym', 'flow-reunion'],
    note:
      '取材于六个带角色身份的流程（夜班护士 / 课后辅导 / 头等舱 / 办公室特训 /\n' +
      '// 健身私教 / 同学会）。这些台词是「角色对执行者」说的，因此转换时\n' +
      '// 角色台词里的「你」要换成「对方」——执行者扮演角色，对方扮演被照顾的那位。',
    actionStates: [
      '[M] 每次掷骰前，报出一个今晚要扮演的角色',
      '[F] 每次掷骰前，用角色的语气说一句话',
      '[both] 每次掷骰前，交换一次角色'
    ],
    conditionStates: [
      '[M] 今晚你演的角色不许中途出戏',
      '[F] 用对方的台词说完再停，不许改词',
      '[both] 角色设定由掷骰决定，两人都不许赖账'
    ]
  },
  {
    id: 'scene-undercurrent',
    name: '场景暗线',
    desc: '有故事的夜晚 · 委托、交换与隔墙',
    mode: 'couple',
    audience: 'common',
    flows: [
      'flow-commission',
      'flow-swap-night',
      'flow-trip',
      'flow-wedding',
      'flow-carpool',
      'flow-wall',
      'flow-masterlist',
      'flow-precum'
    ],
    note:
      '取材于八个带完整叙事的流程（委托之夜 / 交换之夜 / 出差之夜 / 婚礼重放 /\n' +
      '// 驾驶座 / 隔墙之夜 / 主人名单 / 先走液诊所）。\n' +
      '// 「你老婆：」开头的台词是伴侣在说话，转换时包成「让对方对你说」，\n' +
      '// 台词里的「你」正好指执行者，不需要改写。',
    actionStates: [
      '[M] 每次掷骰前，说出一个今晚的场景设定',
      '[F] 每次掷骰前，用一句话把场景往前推一步',
      '[both] 每次掷骰前，一起确认一次还在这个场景里'
    ],
    conditionStates: [
      '[M] 今晚的设定由对方开口，你只负责接',
      '[F] 场景里出现过的每一句台词都要演到',
      '[both] 任何一方不想继续，敲三下就停'
    ]
  },
  {
    id: 'fantasy-build',
    name: '幻想构建',
    desc: '把幻想说清楚 · 边界与共识',
    mode: 'couple',
    audience: 'common',
    scenario: 'hotwife-journey',
    note:
      '取材于剧本「淫妻启蒙 V2」。\n' +
      '// 剧本用 actor 区分由谁执行（0=男方 / 1=女方 / both=双方），\n' +
      '// 转换时按 actor 打 [M]/[F]/[both] 标签，{actor}→「你」、{partner}→「对方」。',
    actionStates: [
      '[M] 每次掷骰前，说出一个你愿意被对方知道的想法',
      '[F] 每次掷骰前，把一条底线写下来交给对方',
      '[both] 每次掷骰前，先确认一遍「还能停下来」'
    ],
    conditionStates: [
      '[M] 今晚任何问题都要正面回答，不许敷衍',
      '[F] 对方写下的底线必须被认真对待',
      '[both] 安全词先约定好，全程有效'
    ]
  },
  {
    id: 'trust-probe',
    name: '信任试探',
    desc: '把后背交给对方 · 默契与安全感',
    mode: 'normal',
    audience: 'common',
    scenario: 'trust-journey',
    note:
      '取材于剧本「信任探索」（普通模式）。\n' +
      '// 全程只有两个人，没有第三方角色，台词里的「{partner}」直接换成「对方」。',
    actionStates: [
      '[M] 每次掷骰前，说出一件你愿意交给对方的事',
      '[F] 每次掷骰前，用一个动作表示「我接住你了」',
      '[both] 每次掷骰前，先确认彼此都准备好了'
    ],
    conditionStates: [
      '[M] 做不到的动作直接说，不用硬撑',
      '[F] 任何时候都要能立刻叫停',
      '[both] 不许嘲笑对方做不到的那一次'
    ]
  }
];
