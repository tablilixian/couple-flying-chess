import { TDQuestion, TDPenalty, TDDifficulty } from '../types';

export const TRUTH_QUESTIONS: TDQuestion[] = [
  { type: 'truth', difficulty: 'soft', text: '你第一次对我心动是什么时候？' },
  { type: 'truth', difficulty: 'soft', text: '和我在一起最开心的一件事是什么？' },
  { type: 'truth', difficulty: 'soft', text: '你最喜欢我身上的哪个特质？' },
  { type: 'truth', difficulty: 'soft', text: '第一次约会前你紧张吗？' },
  { type: 'truth', difficulty: 'soft', text: '你最喜欢我们一起去的哪个地方？' },
  { type: 'truth', difficulty: 'soft', text: '你什么时候觉得我最可爱？' },
  { type: 'truth', difficulty: 'soft', text: '你第一次牵我的手是什么感觉？' },
  { type: 'truth', difficulty: 'soft', text: '你觉得我们之间最有默契的一件事是什么？' },
  { type: 'truth', difficulty: 'soft', text: '如果用一个词形容我，你会用什么？' },
  { type: 'truth', difficulty: 'soft', text: '你更喜欢白天约会还是晚上约会？' },
  { type: 'truth', difficulty: 'hot', text: '你最想和我一起做但还没做的事是什么？' },
  { type: 'truth', difficulty: 'hot', text: '上一次偷偷想我是什么时候？' },
  { type: 'truth', difficulty: 'hot', text: '你觉得我什么时候最性感？' },
  { type: 'truth', difficulty: 'hot', text: '你最想让我为你做的一件事是什么？' },
  { type: 'truth', difficulty: 'hot', text: '你第一次梦到我是什么内容？' },
  { type: 'truth', difficulty: 'hot', text: '你觉得我们之间谁更主动？' },
  { type: 'truth', difficulty: 'hot', text: '你最想改善我们关系中的哪一点？' },
  { type: 'truth', difficulty: 'hot', text: '你收到过我最让你心动的礼物是什么？' },
  { type: 'truth', difficulty: 'hot', text: '你觉得激情和陪伴哪个对我们更重要？' },
  { type: 'truth', difficulty: 'hot', text: '你偷偷观察过我睡觉的样子吗？' },
  { type: 'truth', difficulty: 'hard', text: '你最不为人知的一个秘密是什么？' },
  { type: 'truth', difficulty: 'hard', text: '你有没有曾经因为我的某句话而难过很久？' },
  { type: 'truth', difficulty: 'hard', text: '如果有一天我消失了，你第一反应会是什么？' },
  { type: 'truth', difficulty: 'hard', text: '你对我们的未来最担心的是什么？' },
  { type: 'truth', difficulty: 'hard', text: '你有没有在朋友面前炫耀过我们的关系？' },
  { type: 'truth', difficulty: 'hard', text: '你觉得你做过的哪件事最让我失望？' },
  { type: 'truth', difficulty: 'hard', text: '你幻想过我们十年后的生活是什么样吗？' },
  { type: 'truth', difficulty: 'hard', text: '你曾经因为嫉妒做过什么不理智的事？' },
  { type: 'truth', difficulty: 'hard', text: '你有没有对比过我和你的前任？' },
  { type: 'truth', difficulty: 'hard', text: '你觉得爱和被爱哪个对你更重要？' },
  { type: 'truth', difficulty: 'extreme', text: '你最深层的恐惧是什么？' },
  { type: 'truth', difficulty: 'extreme', text: '你有没有隐瞒过我什么至今没说的？' },
  { type: 'truth', difficulty: 'extreme', text: '如果你可以改变我们之间的一个决定，会是什么？' },
  { type: 'truth', difficulty: 'extreme', text: '你在最脆弱的时候最想找谁？为什么不是找我？' },
  { type: 'truth', difficulty: 'extreme', text: '你觉得真正的爱情到最后是什么？' },
  { type: 'truth', difficulty: 'extreme', text: '你有没有想过如果没有遇见我，你的人生会怎样？' },
  { type: 'truth', difficulty: 'extreme', text: '你最不希望我知道的关于你的一件事是什么？' },
  { type: 'truth', difficulty: 'extreme', text: '你觉得我们之间的信任有没有裂缝？' },
  { type: 'truth', difficulty: 'extreme', text: '你心中最完美的亲密关系是什么样？' },
  { type: 'truth', difficulty: 'extreme', text: '如果明天是世界末日，你最想和我做什么？' },
];

export const DARE_QUESTIONS: TDQuestion[] = [
  { type: 'dare', difficulty: 'soft', text: '给对方一个真诚的拥抱，持续10秒' },
  { type: 'dare', difficulty: 'soft', text: '模仿一个可爱的小动物的叫声' },
  { type: 'dare', difficulty: 'soft', text: '闭上眼睛，让对方在你手心画一个图案，猜是什么' },
  { type: 'dare', difficulty: 'soft', text: '做10个深蹲，一边做一边说我好开心' },
  { type: 'dare', difficulty: 'soft', text: '用三句话夸对方，不能重复' },
  { type: 'dare', difficulty: 'soft', text: '给对方做一个搞笑的鬼脸' },
  { type: 'dare', difficulty: 'soft', text: '用方言说一段绕口令' },
  { type: 'dare', difficulty: 'soft', text: '闭眼转三圈，然后走到对方面前' },
  { type: 'dare', difficulty: 'soft', text: '给对方的备注改成你最想叫的昵称' },
  { type: 'dare', difficulty: 'soft', text: '和对方自拍一张搞怪合照' },
  { type: 'dare', difficulty: 'hot', text: '和对方对视20秒，不许笑' },
  { type: 'dare', difficulty: 'hot', text: '用手机给对方拍一张你觉得最好看的照片' },
  { type: 'dare', difficulty: 'hot', text: '模仿对方最经典的口头禅或小动作' },
  { type: 'dare', difficulty: 'hot', text: '闭眼让对方喂你吃一个东西' },
  { type: 'dare', difficulty: 'hot', text: '在对方耳边说一句最肉麻的情话' },
  { type: 'dare', difficulty: 'hot', text: '发一条仅对方可见的朋友圈夸TA' },
  { type: 'dare', difficulty: 'hot', text: '重现你们第一次接吻的场景' },
  { type: 'dare', difficulty: 'hot', text: '把你的手机壁纸换成对方的照片' },
  { type: 'dare', difficulty: 'hot', text: '用身体摆出一个爱心形状' },
  { type: 'dare', difficulty: 'hot', text: '深情地朗读对方微信里你最喜欢的一条消息' },
  { type: 'dare', difficulty: 'hard', text: '用对方手机发一条朋友圈，内容对方定' },
  { type: 'dare', difficulty: 'hard', text: '发一张你最丑的照片给对方，不能撤回' },
  { type: 'dare', difficulty: 'hard', text: '模仿一个影视剧里的经典表白桥段' },
  { type: 'dare', difficulty: 'hard', text: '给对方做一个全身按摩，持续3分钟' },
  { type: 'dare', difficulty: 'hard', text: '用第三人称介绍你们的故事，发语音给TA' },
  { type: 'dare', difficulty: 'hard', text: '去镜子前对自己说三遍你最棒' },
  { type: 'dare', difficulty: 'hard', text: '给对方画一幅肖像画（抽象派也行）' },
  { type: 'dare', difficulty: 'hard', text: '把对方的备注改成一个搞笑的名字用一周' },
  { type: 'dare', difficulty: 'hard', text: '给对方唱一首情歌，不能笑场' },
  { type: 'dare', difficulty: 'hard', text: '写下对方的5个缺点，然后说你还是全都喜欢' },
  { type: 'dare', difficulty: 'extreme', text: '在公共场合大声说一遍我爱你' },
  { type: 'dare', difficulty: 'extreme', text: '给对方转账一个520，备注写你最想说的话' },
  { type: 'dare', difficulty: 'extreme', text: '把手机给对方，让TA翻看你最私密的一个聊天记录' },
  { type: 'dare', difficulty: 'extreme', text: '当场写一封情书给TA，不少于100字' },
  { type: 'dare', difficulty: 'extreme', text: '给对方一个长达30秒的拥抱，全程不能说话' },
  { type: 'dare', difficulty: 'extreme', text: '在对方指定的社交平台发一条告白动态' },
  { type: 'dare', difficulty: 'extreme', text: '闭眼让对方引导你做一件事，全程信任TA' },
  { type: 'dare', difficulty: 'extreme', text: '把你们的故事讲给一个陌生人听' },
  { type: 'dare', difficulty: 'extreme', text: '做一个大胆的承诺，写在纸上签字按手印' },
  { type: 'dare', difficulty: 'extreme', text: '计划一个下次约会的完整方案，当场说给对方听' },
];

export const PENALTIES: TDPenalty[] = [
  { difficulty: 'soft', text: '做10个深蹲' },
  { difficulty: 'soft', text: '学猫叫三声' },
  { difficulty: 'soft', text: '用舌头够自己的鼻子，坚持5秒' },
  { difficulty: 'soft', text: '原地转5圈然后走直线' },
  { difficulty: 'soft', text: '捏着鼻子说完一句话' },
  { difficulty: 'soft', text: '单脚站立30秒' },
  { difficulty: 'hot', text: '给对方的备注改成我错了，用三天' },
  { difficulty: 'hot', text: '发一条语音说今晚都听你的' },
  { difficulty: 'hot', text: '让对方在你脸上画画' },
  { difficulty: 'hot', text: '做20个高抬腿，一边做一边喊加油' },
  { difficulty: 'hot', text: '模仿一个电视剧里最尴尬的台词' },
  { difficulty: 'hot', text: '把头像换成对方指定的图片三天' },
  { difficulty: 'hard', text: '发一条朋友圈说今天我是猪' },
  { difficulty: 'hard', text: '给对方洗脚' },
  { difficulty: 'hard', text: '把你最囧的一张照片设为手机壁纸一天' },
  { difficulty: 'hard', text: '拍一个短视频模仿网红跳舞' },
  { difficulty: 'hard', text: '给对方做一顿饭（不能是泡面）' },
  { difficulty: 'hard', text: '把你最私密的一个秘密写成纸条烧掉' },
  { difficulty: 'extreme', text: '在小区楼下大声喊对方的名字说我爱你' },
  { difficulty: 'extreme', text: '把手机里最尴尬的一张截图发朋友圈' },
  { difficulty: 'extreme', text: '一周内对方的所有要求你都必须答应' },
  { difficulty: 'extreme', text: '把你最不想让人知道的一件事告诉我' },
  { difficulty: 'extreme', text: '亲吻对方的脚尖' },
  { difficulty: 'extreme', text: '让对方的父母或好友面前说一句你最怕的话' },
];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickQuestion(type: 'truth' | 'dare', difficulty: TDDifficulty): TDQuestion | null {
  const pool = type === 'truth' ? TRUTH_QUESTIONS : DARE_QUESTIONS;
  const filtered = pool.filter(q => q.difficulty === difficulty);
  if (filtered.length === 0) return null;
  return pickRandom(filtered);
}

export function pickPenalty(difficulty: TDDifficulty): TDPenalty | null {
  const filtered = PENALTIES.filter(p => p.difficulty === difficulty);
  if (filtered.length === 0) return null;
  return pickRandom(filtered);
}

export const DIFFICULTIES: { key: TDDifficulty; label: string; color: string }[] = [
  { key: 'soft', label: '温和', color: '#30D158' },
  { key: 'hot', label: '热辣', color: '#FF9F0A' },
  { key: 'hard', label: '猛烈', color: '#FF375F' },
  { key: 'extreme', label: '极限', color: '#BF5AF2' },
];
