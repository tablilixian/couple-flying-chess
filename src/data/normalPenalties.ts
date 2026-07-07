import { TDPenalty } from '../types';

// ========================================================================
//  普通模式惩罚（完全独立于情侣模式）
//  搞笑 / 体能向 / 朋友之间也能玩
// ========================================================================

export const NORMAL_PENALTIES: TDPenalty[] = [
  { difficulty: 'soft', text: '做10个深蹲' },
  { difficulty: 'soft', text: '学猫叫三声' },
  { difficulty: 'soft', text: '单脚站立30秒' },
  { difficulty: 'soft', text: '捏着鼻子说完一句话' },
  { difficulty: 'soft', text: '倒立靠墙10秒（做不到就平板支撑）' },
  { difficulty: 'soft', text: '原地转5圈然后走直线' },
  { difficulty: 'soft', text: '用最夸张的语气朗读一段天气预报' },
  { difficulty: 'soft', text: '模仿你最喜欢的动物叫声持续10秒' },
  { difficulty: 'hot', text: '给对方的备注改成"我错了"，用一天' },
  { difficulty: 'hot', text: '发一条语音给TA说今晚都听你的' },
  { difficulty: 'hot', text: '让对方在你脸上画胡子' },
  { difficulty: 'hot', text: '做20个高抬腿，一边做一边说我最棒' },
  { difficulty: 'hot', text: '模仿一个韩剧里最肉麻的台词' },
  { difficulty: 'hot', text: '把头像换成对方指定的图片用一天' },
  { difficulty: 'hot', text: '用屁股写自己的名字' },
  { difficulty: 'hot', text: '对着镜子说三遍你最好看，要发自内心' },
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
];
