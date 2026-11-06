/**
 * 普通模式烈度包 · 规格表
 *
 * 由 `scripts/convert-normal-td-to-theme.ts` 读取并生成包文件，
 * 也被 `scripts/emit-page-data.ts` 用来判断一个包是不是「普通库烈度包」。
 */
import { TDQuestion } from '../src/types';

export interface NormalPackSpec {
  id: string;
  name: string;
  desc: string;
  tier: TDQuestion['difficulty'];
  tierNote: string;
  actionStates: string[];
  conditionStates: string[];
}

export const NORMAL_PACKS: NormalPackSpec[] = [
  {
    id: 'warm-up',
    name: '温热开场',
    desc: '甜心话题与轻松的真心话',
    tier: 'soft',
    tierNote: '烈度构成：soft 89 条 —— 破冰与暖场，问题都能笑着答完。',
    actionStates: [
      '[both] 这一轮先热身，谁先答谁开',
      '[both] 答不上来就换成对方的真心话',
      '[both] 说出来的答案不许反悔'
    ],
    conditionStates: [
      '[both] 有人不想答就跳过，不追问',
      '[both] 答案只在这个桌上说',
      '[both] 玩到哪儿算哪儿，别较劲'
    ]
  },
  {
    id: 'heat-up',
    name: '热场时刻',
    desc: '暧昧开始，话题开始擦边',
    tier: 'hot',
    tierNote: '烈度构成：hot 56 条 —— 有点上头，玩笑开始带上暗示。',
    actionStates: [
      '[both] 这一轮的尺度比上一轮高一点点',
      '[both] 谁先脸红谁就先停一下',
      '[both] 说完这句才能往下走'
    ],
    conditionStates: [
      '[both] 任何一方喊停立刻结束这一轮',
      '[both] 不许拿在工作里的关系开玩笑',
      '[both] 不想接的话就换个轻松的'
    ]
  },
  {
    id: 'go-serious',
    name: '认真摊牌',
    desc: '坦白心事与更深的挑战',
    tier: 'hard',
    tierNote: '烈度构成：hard 52 条 —— 开始说真话，答完要想一下才敢答。',
    actionStates: [
      '[both] 这一轮不许敷衍，要说实话',
      '[both] 说完之后给对方三十秒不说话',
      '[both] 答完可以反悔，但要先说出口'
    ],
    conditionStates: [
      '[both] 不许追问对方不想讲的事',
      '[both] 有人不想答就说「跳过」，立刻跳',
      '[both] 听完别评价，先接住'
    ]
  },
  {
    id: 'all-in',
    name: '豁出去一点',
    desc: '尺度打开，角色扮演与硬核挑战',
    tier: 'extreme',
    tierNote: '烈度构成：extreme 52 条 —— 尺度拉满，角色扮演和硬核挑战都在这里。',
    actionStates: [
      '[both] 进了这一轮就别装客气',
      '[both] 角色定下来了就不许中途换',
      '[both] 对方接得住才继续往下走'
    ],
    conditionStates: [
      '[both] 有人喊停立刻停，没有例外',
      '[both] 不许偷拍、不许外传',
      '[both] 结束之后先问一句「还好吗」'
    ]
  }
];

/** 普通库烈度包的 id 集合 */
export const NORMAL_TIER_PACK_IDS = new Set(NORMAL_PACKS.map(p => p.id));
