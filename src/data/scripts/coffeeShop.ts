import { Script } from '../../types';

export const coffeeShop: Script = {
  id: 'coffee-shop',
  mode: 'couple',
  title: '咖啡店的邂逅',
  emoji: '☕',
  desc: '周末午后，街角的咖啡店，两个陌生人的目光在空气中交汇。一段关于邂逅与告白的甜蜜故事，从一杯咖啡开始。',
  tags: ['💕 甜蜜', '初阶'],
  duration: 15,
  difficulty: 1,
  endings: 2,
  characters: [
    {
      role: 'male',
      name: '陆辰',
      title: '独立游戏开发者',
      emoji: '👨‍💻',
      color: '#0A84FF',
      bio: '26岁，习惯在咖啡店写代码。温和敏感，社交中略显笨拙，却在代码的世界里游刃有余。最近刚完成一个项目，正在休假调整状态。'
    },
    {
      role: 'female',
      name: '苏晚',
      title: '插画师',
      emoji: '🎨',
      color: '#FF375F',
      bio: '24岁，喜欢在咖啡店寻找灵感的插画师。开朗活泼，对世界充满好奇心。刚刚搬来这座城市，正在用画笔记录新生活的点点滴滴。'
    }
  ],
  chapters: [
    {
      title: '第一章 · 不期而遇',
      mood: 'sweet',
      steps: [
        {
          type: 'narration',
          icon: '🏪',
          text: '周末午后的阳光透过玻璃窗，<br>在木质地板上洒下斑驳的光影。<br>你推开"遇见"咖啡店的木门，<br>一阵咖啡香扑面而来。',
          duration: 5000
        },
        {
          type: 'narration',
          icon: '👀',
          text: '窗边坐着一个熟悉的身影——<br>上周朋友的聚会上，你们有过一面之缘。<br>她正低头在素描本上画着什么，<br>阳光勾勒出她专注的侧脸轮廓。',
          duration: 5000
        },
        {
          type: 'narration',
          icon: '🖋️',
          text: '你抬起头，正好对上了他的目光。<br>空气仿佛在这一秒凝固了。<br>你微微一笑，他也轻轻点了点头——<br>有些相遇，从第一眼就注定了。',
          duration: 4500
        },
        {
          type: 'timer',
          icon: '👁️',
          title: '对视',
          desc: '请看着对方的眼睛，<br>保持安静，用心感受这一刻。<br>不需要说话，<br>让眼神代替语言。',
          duration: 10,
          mood: 'romantic'
        },
        {
          type: 'narration',
          icon: '☕',
          text: '服务生走过来打破沉默：<br>"两位想喝点什么？"<br>你们不约而同地笑了——<br>故事，就这样自然而然地开始了。',
          duration: 4000
        },
        {
          type: 'counter',
          icon: '💕',
          title: '拉近彼此的距离',
          desc: '每一次轻轻的触碰，<br>都让两颗心更近一些。<br>交替触碰对方的手，<br>感受指尖的温度。',
          target: 5,
          mood: 'romantic'
        },
        {
          type: 'narration',
          icon: '💫',
          text: '咖啡的香气在空气中弥漫，<br>你们的对话渐渐从客套变得自然。<br>从兴趣爱好聊到童年往事，<br>仿佛认识了很久很久。<br><br>阳光透过窗户洒在桌上，<br>这个普通的周末午后，<br>正在变得不再普通……',
          duration: 6000,
          isChapterEnd: true
        }
      ]
    },
    {
      title: '第二章 · 初次约会',
      mood: 'romantic',
      steps: [
        {
          type: 'narration',
          icon: '🌙',
          text: '一周后的傍晚，<br>你们约定在一家天台餐厅见面。<br>城市的灯火在脚下铺开，<br>晚风轻柔地吹过你的发梢。<br><br>他比你到得早，<br>远远看到你，就挥了挥手。',
          duration: 5500
        },
        {
          type: 'narration',
          icon: '🍷',
          text: '暖黄的烛光在桌上摇曳，<br>你们的倒影在红酒杯中交叠。<br>他看你的眼神里，<br>有一种说不清道不明的温柔。<br><br>今晚的星星很亮，<br>但似乎都不及你眼中的光。',
          duration: 5000
        },
        {
          type: 'counter',
          icon: '💋',
          title: '甜蜜五连拍',
          desc: '每说出一个对方的优点，<br>就在对方脸上亲一下。<br>交替进行，完成 5 次。<br>—— 让赞美和亲吻成为今晚的旋律。',
          target: 5,
          mood: 'intense'
        },
        {
          type: 'narration',
          icon: '🌟',
          text: '夜色渐深，<br>你们并肩看着城市的万家灯火。<br>那些亮着的窗户后面，<br>是一个个温暖的故事。<br><br>你偷偷看了他一眼，<br>发现他也在看你。<br>有些话在心口盘旋，<br>却还没找到说出口的时机……',
          duration: 6000,
          isChapterEnd: true
        }
      ]
    },
    {
      title: '第三章 · 告白之夜',
      mood: 'intense',
      steps: [
        {
          type: 'narration',
          icon: '🌉',
          text: '又是一个周末。<br>你们相约在江边散步。<br>晚风习习，吹皱了一江灯火，<br>星光在波光粼粼的水面上碎成万千光芒。<br><br>你们并肩走着，<br>肩膀偶尔碰在一起，<br>谁都没有躲开。',
          duration: 6000
        },
        {
          type: 'timer',
          icon: '🤲',
          title: '牵手漫步',
          desc: '牵起对方的手，<br>感受掌心的温度和心跳的节奏。<br>保持这个温度，<br>静静走一段路。<br>让沉默也变成一种交谈。',
          duration: 20,
          mood: 'romantic'
        },
        {
          type: 'narration',
          icon: '💗',
          text: '江边的灯光下，<br>你停下脚步，转过身，<br>认真地看着她的眼睛。<br><br>"其实……从那天在咖啡店开始，<br>我就一直在想怎么跟你说——<br>我喜欢你。"<br><br>风吹过来，<br>带走了所有的犹豫。',
          duration: 7000
        },
        {
          type: 'counter',
          icon: '🤗',
          title: '拥抱倒计时',
          desc: '紧紧地拥抱对方，<br>感受彼此的心跳在胸腔里共鸣。<br>每一次呼吸都在说着"我喜欢你"。<br>让这个拥抱久一点，再久一点……',
          target: 10,
          mood: 'intense'
        },
        {
          type: 'narration',
          icon: '💖',
          text: '"我也喜欢你。"<br>她轻声说道，<br>眼中有星光闪烁。<br><br>你紧紧握住了她的手——<br>十指相扣，<br>仿佛整个世界都安静了下来。<br><br>这一刻，就是永远。',
          duration: 6000,
          isChapterEnd: true
        }
      ]
    }
  ],
  endingTitle: '缘定今生',
  endingDesc: '你们的故事，从那个午后的咖啡店开始，<br>在这个星光璀璨的夜晚开花结果。<br>有些缘分，从一开始就注定了。<br><br>愿每一杯咖啡，都有一个温暖的结局。',
  endingIcon: '💖'
};
