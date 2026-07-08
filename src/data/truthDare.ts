import { TDQuestion, TDPenalty, TDDifficulty, TDTheme, GameMode } from '../types';
import { NORMAL_QUESTIONS } from './normalQuestions';
import { NORMAL_PENALTIES } from './normalPenalties';
import {
  SWEET_TRUTHS, SWEET_DARES,
  SPICY_TRUTHS, SPICY_DARES, SPICY_TRUTHS_DIRTY_TALK, SPICY_DARES_DIRTY_TALK,
  CONFESSION_TRUTHS, CONFESSION_DARES,
  ROLEPLAY_TRUTHS, ROLEPLAY_DARES,
  KINKY_TRUTHS, KINKY_DARES,
  BDSM_TRUTHS, BDSM_DARES,
  TABOO_TRUTHS, TABOO_DARES,
  THIRD_TRUTHS, THIRD_DARES,
  DIRTYTALK_TRUTHS, DIRTYTALK_DARES,
  SLUTWIFE_TRUTHS, SLUTWIFE_DARES,
  CUCKOLD_TRUTHS, CUCKOLD_DARES,
  SWING_TRUTHS, SWING_DARES,
  EXPOSURE_TRUTHS, EXPOSURE_DARES,
  HOME_DARES, HOME_TRUTHS,
} from './couple';

export const COUPLE_QUESTIONS: TDQuestion[] = [
  ...SWEET_TRUTHS, ...SWEET_DARES,
  ...SPICY_TRUTHS, ...SPICY_DARES,
  ...SPICY_TRUTHS_DIRTY_TALK, ...SPICY_DARES_DIRTY_TALK,
  ...CONFESSION_TRUTHS, ...CONFESSION_DARES,
  ...ROLEPLAY_TRUTHS, ...ROLEPLAY_DARES,
  ...KINKY_TRUTHS, ...KINKY_DARES,
  ...BDSM_TRUTHS, ...BDSM_DARES,
  ...TABOO_TRUTHS, ...TABOO_DARES,
  ...THIRD_TRUTHS, ...THIRD_DARES,
  ...DIRTYTALK_TRUTHS, ...DIRTYTALK_DARES,
  ...SLUTWIFE_TRUTHS, ...SLUTWIFE_DARES,
  ...CUCKOLD_TRUTHS, ...CUCKOLD_DARES,
  ...SWING_TRUTHS, ...SWING_DARES,
  ...EXPOSURE_TRUTHS, ...EXPOSURE_DARES,
  ...HOME_DARES, ...HOME_TRUTHS,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickQuestion(
  type: 'truth' | 'dare',
  difficulty: TDDifficulty,
  themes: TDTheme[],
  currentPlayer: 0 | 1,
  playerRoles: ['male' | 'female', 'male' | 'female'],
  mode: GameMode = 'couple',
  excludeTexts: string[] = [],
): TDQuestion | null {
  const sourcePool = mode === 'couple' ? COUPLE_QUESTIONS : NORMAL_QUESTIONS;

  const playerTarget = playerRoles[currentPlayer];
  let pool = sourcePool.filter(q =>
    q.type === type &&
    q.difficulty === difficulty &&
    themes.includes(q.theme) &&
    (q.target === 'both' || q.target === playerTarget)
  );

  if (excludeTexts.length > 0) {
    const remaining = pool.filter(q => !excludeTexts.includes(q.text));
    if (remaining.length > 0) pool = remaining;
  }

  const fallback = pool.length === 0
    ? sourcePool.filter(q =>
        q.type === type && q.difficulty === difficulty && themes.includes(q.theme)
      )
    : [];

  let finalPool = pool.length > 0 ? pool : fallback;

  if (excludeTexts.length > 0) {
    const remaining = finalPool.filter(q => !excludeTexts.includes(q.text));
    if (remaining.length > 0) finalPool = remaining;
  }

  if (finalPool.length === 0) return null;
  return pickRandom(finalPool);
}

// ========================================================================
//  PENALTIES — 惩罚 (完全分离的 couple/normal 池)
// ========================================================================

const RAW_PENALTIES: TDPenalty[] = [
  // soft
  { difficulty: 'soft', text: '做10个深蹲' },
  { difficulty: 'soft', text: '学猫叫三声' },
  { difficulty: 'soft', text: '单脚站立30秒' },
  { difficulty: 'soft', text: '捏着鼻子说完一句话' },
  { difficulty: 'soft', text: '倒立靠墙10秒（做不到就平板支撑）' },
  { difficulty: 'soft', text: '原地转5圈然后走直线' },
  { difficulty: 'soft', text: '用最夸张的语气朗读一段天气预报' },
  { difficulty: 'soft', text: '模仿你最喜欢的动物叫声持续10秒' },
  // hot
  { difficulty: 'hot', text: '给对方的备注改成"我错了"，用一天' },
  { difficulty: 'hot', text: '发一条语音给TA说今晚都听你的' },
  { difficulty: 'hot', text: '让对方在你脸上画胡子' },
  { difficulty: 'hot', text: '做20个高抬腿，一边做一边说我最棒' },
  { difficulty: 'hot', text: '模仿一个韩剧里最肉麻的台词' },
  { difficulty: 'hot', text: '把头像换成对方指定的图片用一天' },
  { difficulty: 'hot', text: '用屁股写自己的名字' },
  { difficulty: 'hot', text: '对着镜子说三遍你最好看，要发自内心' },
  // hard
  { difficulty: 'hard', text: '发一条朋友圈说今天我是猪，不能删' },
  { difficulty: 'hard', text: '给对方洗脚' },
  { difficulty: 'hard', text: '把你最囧的一张照片设成手机壁纸一天' },
  { difficulty: 'hard', text: '拍一个15秒的搞笑视频发给对方' },
  { difficulty: 'hard', text: '给对方做一顿饭吃（不能是泡面）' },
  { difficulty: 'hard', text: '把你最私密的一个秘密写在纸上然后烧掉' },
  { difficulty: 'hard', text: '用对方的口吻给TA的闺蜜/兄弟发一条消息' },
  { difficulty: 'hard', text: '在小区楼下对着天空大喊一声对方的名字' },
  { difficulty: 'hard', text: '亲一下对方的脚背' },
  { difficulty: 'hard', text: '全程用撒娇的语气说话直到下一轮结束' },
  // extreme (couple 专属)
  { difficulty: 'extreme', text: '在楼下大声喊对方的名字说我爱你' },
  { difficulty: 'extreme', text: '把手机里最尴尬的一张截图发朋友圈' },
  { difficulty: 'extreme', text: '一周内对方说的要求你都必须答应' },
  { difficulty: 'extreme', text: '把你最不想让人知道的一件事说出来' },
  { difficulty: 'extreme', text: '让对方向你的父母/好友说一句你最怕的话' },
  { difficulty: 'extreme', text: '把你的手机交给对方，让TA发一条任意内容的朋友圈' },
  { difficulty: 'extreme', text: '现编一个和对方有关的浪漫故事，讲满3分钟' },
  { difficulty: 'extreme', text: '让对方在你身上最敏感的地方吹气10秒' },
  { difficulty: 'extreme', text: '完成对方指定的一个你从未做过的大胆挑战' },
  { difficulty: 'hot', text: '用嘴把对方的袜子脱下来' },
  { difficulty: 'hot', text: '被对方用手机拍一张最丑的表情做壁纸' },
  { difficulty: 'hard', text: '脱掉裤子，只穿上衣在房间里走一圈' },
  { difficulty: 'hard', text: '让对方在你屁股上写一个字然后拍照留念' },
  { difficulty: 'hard', text: '对着窗户大声说出你最羞耻的一个性幻想' },
  { difficulty: 'hard', text: '让对方给你口交10秒，不能拒绝' },
  { difficulty: 'extreme', text: '脱光全身，让对方给你全身拍照3张' },
  { difficulty: 'extreme', text: '在阳台裸体站30秒（确保安全私密的前提下）' },
  { difficulty: 'extreme', text: '让对方用口红/笔在你全身写满TA想写的话' },
  { difficulty: 'extreme', text: '完成对方指定的一个包含性意味的挑战' },
  { difficulty: 'extreme', text: '自慰给对方看直到高潮' },
  { difficulty: 'hot', text: '让对方用口红在你脸上写一个"色"字' },
  { difficulty: 'hot', text: '把内裤脱下来给对方面前闻一下' },
  { difficulty: 'hard', text: '跪在对方面前说三声"我错了"直到对方满意' },
  { difficulty: 'hard', text: '发一条语音跟对方说最色情的一句情话' },
  { difficulty: 'hard', text: '把手机壁纸换成对方裸体/内衣照一天' },
  { difficulty: 'hard', text: '让对方在你屁股上用力拍三下' },
  { difficulty: 'extreme', text: '跪在对方面前，双手背后，保持1分钟' },
  { difficulty: 'extreme', text: '在全身镜前自慰给对方看' },
  { difficulty: 'extreme', text: '让对方用你的手机给TA自己发一条色情短信' },
  { difficulty: 'extreme', text: '被对方绑住双手后完成一个性挑战' },
];

export const COUPLE_PENALTIES: TDPenalty[] = RAW_PENALTIES;

// ========================================================================
//  DIFFICULTIES & PICKER
// ========================================================================

export const DIFFICULTIES: { key: TDDifficulty; label: string; color: string }[] = [
  { key: 'soft', label: '温和', color: '#30D158' },
  { key: 'hot', label: '热辣', color: '#FF9F0A' },
  { key: 'hard', label: '猛烈', color: '#FF375F' },
  { key: 'extreme', label: '极限', color: '#BF5AF2' },
];

export function pickPenalty(
  difficulty: TDDifficulty,
  mode: GameMode = 'couple',
): TDPenalty | null {
  const sourcePool = mode === 'couple' ? COUPLE_PENALTIES : NORMAL_PENALTIES;
  const filtered = sourcePool.filter(p => p.difficulty === difficulty);
  if (filtered.length === 0) return null;
  return pickRandom(filtered);
}
