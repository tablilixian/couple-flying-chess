import { Scenario } from '../../types';

export const HOTWIFE_JOURNEY: Scenario = {
  id: 'hotwife-journey',
  mode: 'couple',
  title: '淫妻启蒙',
  emoji: '💋',
  desc: '一场关于幻想、信任与探索的旅程。由{actor}引导{partner}，从心理到言语到行动，一步步打开心扉。',
  roles: ['引导者（丈夫）', '探索者（妻子）'],
  roleEmojis: ['👑', '💃'],
  difficulty: 'hard',
  estimatedMinutes: 45,
  definitions: [
    { term: '淫妻（Hotwife）', meaning: '指妻子在丈夫知情且同意的情况下，与其他男性发生性关系或暧昧互动。核心在于丈夫从中获得性兴奋，而非隐瞒或背叛。' },
  ],
  acts: [
    {
      title: '心锚对话',
      desc: '通过几个问题，探明彼此对"淫妻"幻想的真实想法和边界。没有对错，只有坦诚。',
      steps: [
        {
          type: 'question',
          actor: 0,
          text: '你第一次幻想她被别的男人碰是什么场景？尽可能详细地描述那个画面。',
        },
        {
          type: 'question',
          actor: 1,
          text: '你幻想过被别的男人欣赏甚至渴望吗？你最想被什么样的男人注视？',
          suggestions: [
            '刘德华那样的帅大叔',
            '鹿晗那种小鲜肉',
            '胸肌发达肌肉男',
            '鸡巴很大的猛男',
            '很聪明的高智商类型',
            '温柔体贴暖男型',
            '坏坏的痞帅型',
          ],
        },
        {
          type: 'question',
          actor: 'both',
          text: '「淫妻」对你们的关系意味着什么？各自用一句话写在纸上，然后交换看。',
        },
      ],
    },
    {
      title: '言语刺激',
      desc: '用语言构建画面感。这一阶段不涉及真实行动，只停留在幻想和对话中。',
      steps: [
        {
          type: 'command',
          actor: 0,
          text: '看着{partner}的眼睛，告诉她你幻想她被别人抱在怀里的样子。说完后问她：听到这些你身体的哪个部位有反应？',
        },
        {
          type: 'command',
          actor: 1,
          text: '闭上眼睛，想象一个陌生男人在注视你。描述{actor}从头顶到脚尖的感觉——他最喜欢{actor}哪个部位？',
          suggestions: [
            '胸',
            '屁股',
            '腰',
            '腿',
            '锁骨',
            '脚',
            '嘴唇',
          ],
        },
        {
          type: 'command',
          actor: 0,
          text: '打开手机录音，对着它描述你想象中{partner}在别人身下的样子。录完后放给她听，观察她的表情。',
        },
      ],
    },
    {
      title: '社交实验',
      desc: '进入真实社交场景，感受被注视的刺激。可选择在公共场合完成，或在相对私密的社交环境中。',
      steps: [
        {
          type: 'action',
          actor: 1,
          text: '今晚穿一件{actor}平时觉得"太大胆了"的衣服，在{partner}的陪伴下出门散步或去酒吧。回来后描述你感受到的视线。',
          note: '不一定非得很暴露，可以是一件紧身裙、深V、或者不穿内衣。重点是你的心态。',
        },
        {
          type: 'question',
          actor: 0,
          text: '今晚你看到有几个男人看她？你心里是什么感受——嫉妒？兴奋？自豪？分别打几分（1-10）？',
        },
        {
          type: 'question',
          actor: 1,
          text: '被其他男人注视的时候，你在想什么？你有想到{partner}吗？你希望那时他在看你的表情，还是在看其他男人的反应？',
        },
      ],
    },
    {
      title: '深度整合',
      desc: '把前三阶段的体验整合到一起，用亲密收尾。这是整个旅程最重要的一环。',
      steps: [
        {
          type: 'command',
          actor: 'both',
          text: '面对面坐下，膝盖相触。各自写下「这个过程中我最享受的时刻」和「这个过程中最让我不安的时刻」。交换读，不许说话读完。',
        },
        {
          type: 'command',
          actor: 0,
          text: '告诉{partner}你为她今晚的勇气感到骄傲。用最温柔的方式和她做爱——不是出于欲望，而是出于连接。',
        },
      ],
    },
  ],
};
