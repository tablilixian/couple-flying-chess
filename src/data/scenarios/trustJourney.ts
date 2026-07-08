import { Scenario } from '../../types';

export const TRUST_JOURNEY: Scenario = {
  id: 'trust-journey',
  mode: 'normal',
  title: '信任探索',
  emoji: '🤝',
  desc: '通过一系列互动小游戏，增进彼此的信任感和默契度。适合朋友、伴侣一起玩。',
  roles: ['体验者 A', '体验者 B'],
  roleEmojis: ['🌟', '✨'],
  difficulty: 'soft',
  estimatedMinutes: 25,
  acts: [
    {
      title: '破冰对视',
      desc: '最简单的开始——眼睛是心灵的窗户。',
      steps: [
        {
          type: 'command',
          actor: 'both',
          text: '面对面坐下，保持一米距离。互相注视对方的眼睛，不许笑、不许说话，坚持 30 秒。',
        },
        {
          type: 'question',
          actor: 'both',
          text: '刚才对视的时候，你脑子里在想什么？{partner}有没有让你意外的表情或眼神变化？',
        },
      ],
    },
    {
      title: '信任倒落',
      desc: '经典的信任测试，感受把自己交给对方的安全感。',
      steps: [
        {
          type: 'command',
          actor: 0,
          text: '背对{partner}站好，双手抱在胸前。让{partner}在你身后半米处做好准备。听到指令后，身体直直地向后倒——对方会接住你。',
          note: '如果不敢一次倒到位，可以先从小幅度开始，逐步增加角度。',
        },
        {
          type: 'command',
          actor: 1,
          text: '现在换{actor}。背对{partner}站好，双手抱胸，身体直直向后倒。',
        },
        {
          type: 'question',
          actor: 'both',
          text: '哪一次接人让你更紧张——接还是被接？你觉得信任{partner}最难的部分是什么？',
        },
      ],
    },
    {
      title: '蒙眼引导',
      desc: '一个人蒙眼，另一个人用语言引导，考验表达与倾听。',
      steps: [
        {
          type: 'command',
          actor: 1,
          text: '为{partner}戴上眼罩（或用毛巾蒙住眼睛）。然后通过语言引导{partner}在房间里完成一个简单的路线：走到门口→摸一下门把手→回到原地坐下。全程不能碰触对方。',
        },
        {
          type: 'command',
          actor: 0,
          text: '现在换{actor}引导。重新设置路线：走到窗边→摸一下窗户→走到桌前→坐下。',
        },
        {
          type: 'question',
          actor: 'both',
          text: '蒙眼的时候你更依赖听觉还是触觉？引导的时候你觉得自己表达清楚了吗？',
        },
      ],
    },
    {
      title: '默契考验',
      desc: '最后一个环节——测试你们的默契有多深。',
      steps: [
        {
          type: 'command',
          actor: 'both',
          text: '背对背坐好。各自在手机上或纸上写出以下三个问题的答案：（1）{partner}最喜欢的颜色（2）{partner}最近最开心的一件事（3）如果明天是世界末日，{partner}最想做什么。写完后同时亮出答案。',
        },
        {
          type: 'question',
          actor: 'both',
          text: '有几道题答对了？哪一道题的答案让你最意外？经过这次旅程，你觉得对{partner}的信任有变化吗？',
        },
      ],
    },
  ],
};
