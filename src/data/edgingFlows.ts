import { EdgingFlow, EdgingPhaseKind } from '../types';

export const EDGING_KIND_CONFIG: Record<EdgingPhaseKind, { label: string; color: string; desc: string }> = {
  slow:  { label: '慢速',  color: '#0A84FF', desc: '舒缓热身' },
  build: { label: '加速',  color: '#BF5AF2', desc: '逐渐加快' },
  fast:  { label: '快速',  color: '#FF375F', desc: '冲刺节奏' },
  edge:  { label: '寸止',  color: '#FF453A', desc: '立刻停住' },
  rest:  { label: '休息',  color: '#30D158', desc: '放松呼吸' },
};

export const EDGING_KINDS: EdgingPhaseKind[] = ['slow', 'build', 'fast', 'edge', 'rest'];

export const PRESET_EDGING_FLOWS: EdgingFlow[] = [
  {
    id: 'flow-warmup',
    name: '慢热渐入',
    emoji: '🌊',
    desc: '新手友好 · 由慢到快，两次寸止',
    phases: [
      {
        kind: 'slow', bpm: 50, duration: 60,
        title: '夜深了',
        text: '跟着节拍，一下一下，深呼吸',
        script: [
          { kind: 'story', text: '夜已经深了，房间只亮着一盏灯，窗外的城市也安静了下来。' },
          { kind: 'story', text: '现在我就在这里，隔着屏幕陪着你。接下来的时间，你只需要听话。' },
          { kind: 'command', text: '先把衣服慢慢褪到肩头，让皮肤碰到微凉的空气。' },
          { kind: 'command', text: '跟着节拍，一下，一下，深呼吸。别急着进入状态。' },
          { kind: 'story', text: '你的心跳比平时快了一点，我知道——你在想象我正注视着你。' },
        ],
      },
      {
        kind: 'build', bpm: 70, duration: 45,
        title: '手，交给我',
        text: '我让你动，你才动',
        script: [
          { kind: 'command', text: '把手放到你最想要被抚摸的地方。我让你动，你才动。', pop: ['你才动'] },
          { kind: 'story', text: '想象那只手不是你的，是我在替你指挥它。' },
          { kind: 'command', text: '跟住节拍，慢慢加快，感受自己开始发烫。' },
          { kind: 'story', text: '你微微仰起头的样子，一定很好看。' },
        ],
      },
      {
        kind: 'fast', bpm: 90, duration: 30,
        title: '不要停',
        text: '快一点，不许慢下来',
        script: [
          { kind: 'command', text: '快一点。跟着节拍，不许慢下来。', pop: ['不许慢'] },
          { kind: 'command', text: '对，就这样，让节奏带着你走。' },
          { kind: 'story', text: '你越接近的时候，越是听话的时候。' },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 20,
        title: '寸止',
        text: '停！立刻停住！',
        script: [
          { kind: 'command', text: '停。现在，立刻，停住。', pop: ['停'] },
          { kind: 'denial', text: '手给我离开。忍住，把那股冲动咽回去。', pop: ['忍住'] },
          { kind: 'story', text: '那种被硬生生拦在悬崖边的战栗——是我送给你的。' },
        ],
      },
      {
        kind: 'fast', bpm: 90, duration: 30,
        title: '再来',
        text: '再来，比刚才更快',
        script: [
          { kind: 'command', text: '再来。比刚才更快，我盯着你。', pop: ['更快'] },
          { kind: 'story', text: '你以为我要放过你吗？还早得很。' },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 20,
        title: '第二次',
        text: '停住！忍住！',
        script: [
          { kind: 'command', text: '停住。又不许动了。', pop: ['停住'] },
          { kind: 'denial', text: '你很想要吧，但我没说可以。深呼吸，把它压下去。', pop: ['没说可以'] },
        ],
      },
      {
        kind: 'rest', bpm: 0, duration: 60,
        title: '余韵',
        text: '慢慢放松，感受余韵',
        script: [
          { kind: 'praise', text: '乖。做得很好，{name}。', pop: ['乖', '{name}'] },
          { kind: 'command', text: '现在把手松开，慢慢呼吸，让身体回到平静。' },
          { kind: 'story', text: '今天的你，很听话。明天，我们还会有更长的夜晚。' },
        ],
      },
    ],
  },
  {
    id: 'flow-edge',
    name: '寸止挑战',
    emoji: '⏳',
    desc: '进阶 · 三次寸止，接近极限',
    phases: [
      {
        kind: 'slow', bpm: 60, duration: 45,
        title: '听我说',
        text: '节奏、快慢、什么时候停，都由我说了算',
        script: [
          { kind: 'story', text: '今晚，我不允许你自己决定任何事。节奏、快慢、什么时候停，都由我说了算。' },
          { kind: 'command', text: '坐下，放松，把手放好。我会告诉你每一步该怎么做。', pop: ['我说了算'] },
          { kind: 'story', text: '你在等我的指令——光是这一点，就让你比平时更兴奋。' },
        ],
      },
      {
        kind: 'build', bpm: 80, duration: 40,
        title: '升温',
        text: '跟着节拍，慢慢的',
        script: [
          { kind: 'command', text: '开始。慢慢的，跟着节拍抚摸自己。', pop: ['跟着节拍'] },
          { kind: 'story', text: '想象我半倚在床边，翘着腿，饶有兴味地看着你。' },
          { kind: 'command', text: '加速，不要因为舒服就偷懒。我要你对我诚实。' },
        ],
      },
      {
        kind: 'fast', bpm: 120, duration: 30,
        title: '靠近',
        text: '跟着我给你的速度，靠近边缘',
        script: [
          { kind: 'command', text: '快。跟着我给你的速度，靠近那个边缘。', pop: ['边缘'] },
          { kind: 'story', text: '你已经能感觉到它在逼近了，呼吸都乱了。' },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 30,
        title: '第一次',
        text: '停！手离开！',
        script: [
          { kind: 'command', text: '停！手离开！', pop: ['停'] },
          { kind: 'denial', text: '忍住，{name}。这是今晚第一次，不许给我交代。', pop: ['第一次', '不许'] },
          { kind: 'story', text: '感受那股悬在顶点的战栗，记住它——今晚你还要经历更多次。' },
        ],
      },
      {
        kind: 'fast', bpm: 120, duration: 25,
        title: '再来',
        text: '回到刚才的节奏，马上',
        script: [
          { kind: 'command', text: '回到刚才的节奏。马上。', pop: ['马上'] },
          { kind: 'story', text: '你的手在发抖。我很满意。' },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 25,
        title: '第二次',
        text: '停住！',
        script: [
          { kind: 'command', text: '停住。又到边缘了。', pop: ['停住'] },
          { kind: 'denial', text: '我正看着你。你要是敢擅自交代，今晚就到此为止。', pop: ['到此为止'] },
          { kind: 'story', text: '你努力撑着的样子，让我很想再逗你一会。' },
        ],
      },
      {
        kind: 'fast', bpm: 100, duration: 20,
        title: '慢一点',
        text: '放慢，感受每一拍',
        script: [
          { kind: 'command', text: '放慢，感受每一拍，别逃开这种折磨。', pop: ['折磨'] },
          { kind: 'story', text: '慢，有时候比快更难熬。我知道你懂。' },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 20,
        title: '第三次',
        text: '第三次寸止！',
        script: [
          { kind: 'command', text: '第三次。停。', pop: ['第三次'] },
          { kind: 'denial', text: '忍住。这是今晚最后一次寸止，撑过去，我给你奖励。', pop: ['最后一次'] },
          { kind: 'story', text: '你几乎要哭出来，可你还是忍住了——真乖。' },
        ],
      },
      {
        kind: 'rest', bpm: 0, duration: 30,
        title: '奖励',
        text: '深呼吸，奖励自己',
        script: [
          { kind: 'praise', text: '做得很好，{name}。奖励你。', pop: ['奖励'] },
          { kind: 'command', text: '现在把手还给我，轻轻深呼吸，感受自己的出色。' },
          { kind: 'story', text: '你证明了你是听话的。记住这种被掌控的感觉，我会让它越来越深。' },
        ],
      },
    ],
  },
  {
    id: 'flow-extreme',
    name: '极限控制',
    emoji: '🔥',
    desc: '高级 · 多段节奏，长时间忍耐',
    phases: [
      {
        kind: 'slow', bpm: 50, duration: 60,
        title: '仪式',
        text: '今晚属于我',
        script: [
          { kind: 'story', text: '昏暗的灯光，你跪坐在床边——今晚属于我。' },
          { kind: 'story', text: '我会用最慢的方式，把你想释放的欲望一点一点勾出来，然后紧紧攥在手里。' },
          { kind: 'command', text: '把衣服交给这个夜晚。深呼吸，让身体先冷下来。', pop: ['冷下来'] },
        ],
      },
      {
        kind: 'build', bpm: 70, duration: 40,
        title: '攀升',
        text: '从最浅的地方开始',
        script: [
          { kind: 'command', text: '慢慢开始，跟住节拍，从最浅的地方开始。', pop: ['从最浅'] },
          { kind: 'story', text: '你是被我捏在掌心的。我要你多慢，你就有多慢。' },
          { kind: 'command', text: '加速一点，让皮肤开始发烫。' },
        ],
      },
      {
        kind: 'fast', bpm: 100, duration: 30,
        title: '失控前',
        text: '快起来，交给我',
        script: [
          { kind: 'command', text: '快起来。什么都别想，交给我。', pop: ['交给我'] },
          { kind: 'story', text: '你已经乱了，呼吸越来越急。我知道你马上要到那个点。' },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 40,
        title: '深渊边缘',
        text: '停！悬在那里',
        script: [
          { kind: 'command', text: '停。悬在那里。', pop: ['停'] },
          { kind: 'denial', text: '不许动。把冲动钉在原地，感受它在骨头里烧。', pop: ['不许动'] },
          { kind: 'story', text: '离失控只有一步——这一步，是我给你的奖励和惩罚。' },
          { kind: 'denial', text: '忍住，{name}。我在看着你，别让我失望。', pop: ['别让我失望'] },
        ],
      },
      {
        kind: 'build', bpm: 90, duration: 35,
        title: '重来',
        text: '重新往上爬',
        script: [
          { kind: 'command', text: '重新开始，慢慢往上爬。像刚才那样听话。', pop: ['往上爬'] },
          { kind: 'story', text: '记住这种感觉——每次被拦下来，你的欲望都会变得更饿。' },
        ],
      },
      {
        kind: 'fast', bpm: 130, duration: 25,
        title: '更近',
        text: '冲！更接近了',
        script: [
          { kind: 'command', text: '冲。比刚才更快，这一次你更接近了。', pop: ['更接近'] },
          { kind: 'story', text: '你的指尖在颤抖，我全都看见了。' },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 40,
        title: '又一次',
        text: '停住！',
        script: [
          { kind: 'command', text: '停住。', pop: ['停住'] },
          { kind: 'denial', text: '你又要到边缘了，对吗？但我还是没有说可以。', pop: ['没说可以'] },
          { kind: 'story', text: '我享受你被悬在悬崖边发抖的样子。' },
        ],
      },
      {
        kind: 'fast', bpm: 140, duration: 20,
        title: '最后',
        text: '最高最快的节奏',
        script: [
          { kind: 'command', text: '最后一次攀升。最高、最快的节奏。', pop: ['最高最快'] },
          { kind: 'story', text: '你几乎要忘了自己叫什么，只记得我的声音。' },
        ],
      },
      {
        kind: 'rest', bpm: 0, duration: 60,
        title: '归还',
        text: '现在，我允许你了',
        script: [
          { kind: 'praise', text: '现在，可以了。{name}，我允许你了。', pop: ['我允许你'] },
          { kind: 'story', text: '攒了一整晚的冲动，在这一刻全部还给你——慢慢来，别着急。' },
          { kind: 'praise', text: '你是我见过最听话的。今晚做得非常好。', pop: ['最听话'] },
        ],
      },
    ],
  },
  {
    id: 'flow-commission',
    name: '委托之夜',
    emoji: '🎬',
    desc: '异世界剧场·第〇集 · 一部完整的绿帽背调史',
    phases: [
      {
        kind: 'slow', bpm: 50, duration: 60,
        title: '敲门',
        text: '坐好。手放膝盖上。我没让你动，你就不许动',
        script: [
          { kind: 'story', text: '门铃响了。你以为是老婆回来了，进来的却是她最好的闺蜜，甜甜。' },
          { kind: 'story', text: '她裹着一件过大的大衣，坐下，把手机拍在茶几上。"你老婆出差，托我带点东西给你。"' },
          { kind: 'command', text: '甜甜：（轻声）她说你最近火气大，让我来陪你"聊聊"。从哪儿聊起呢——就从上大学那会儿吧。', pop: ['聊聊'] },
          { kind: 'command', text: '坐好。手放膝盖上。我没让你动，你就不许动。', pop: ['不许动'] },
        ],
      },
      {
        kind: 'slow', bpm: 50, duration: 60,
        title: '大学·你把她追到手',
        text: '听清楚。这些不是用来怀念的',
        script: [
          { kind: 'story', text: '大一那年，她坐在你邻桌。白色衬衫，马尾辫，笑起来两个酒窝。' },
          { kind: 'story', text: '你追了她三年。在宿舍楼下站到熄灯，把生活费省下来给她买奶茶。她终于点头那天，你在操场上抱着她转了三圈。' },
          { kind: 'command', text: '甜甜：那会儿你老婆可是个清纯的姑娘。碰一下她的手都会脸红。你说什么来着——"我会让你一直这么纯下去。"', pop: ['纯下去'] },
          { kind: 'story', text: '毕业第二年，你们结婚了。彩礼、酒席、司仪问"无论疾病健康"，她笑着看你，眼眶红了。' },
          { kind: 'command', text: '甜甜：（笑）那时候她眼里只有你。真的。我亲眼看着的。' },
          { kind: 'command', text: '听清楚。这些不是用来怀念的，是用来让你明白——她是怎么样，一步一步变成现在这样的。', pop: ['一步一步'] },
        ],
      },
      {
        kind: 'build', bpm: 65, duration: 50,
        title: '婚后·她开始不满足',
        text: '难受也要听',
        script: [
          { kind: 'story', text: '刚结婚那两年是好的。可慢慢地，她开始说"你回来怎么越来越早""你怎么一沾枕头就睡"。' },
          { kind: 'command', text: '甜甜：不是她不爱你，是喂不饱。你上班、加班、回家倒头就睡，她躺在床上，手摸着自己的身体，越来越不甘心。', pop: ['不甘心'] },
          { kind: 'story', text: '她开始跟你吵架，为一点小事发火。你以为是感情淡了，其实是她身体先饿，饿到胃里发慌。' },
          { kind: 'command', text: '甜甜：你记得吗，她有一阵子老说"腰酸"。然后开始不让你碰，说"累了"。那不是累，{name}，那是她还没找到比她老公更行的男人之前，先把自己收起来了。', pop: ['收起来'] },
          { kind: 'command', text: '跟着节拍，深呼吸。听这些，你会难受。难受也要听。', pop: ['也要听'] },
        ],
      },
      {
        kind: 'build', bpm: 75, duration: 50,
        title: '闺蜜怂恿·她开始夜归',
        text: '她白天是你老婆，夜里是别人的骚货',
        script: [
          { kind: 'story', text: '就在那时候，她开始频繁跟我出去。说是逛街、喝咖啡、做美甲。' },
          { kind: 'command', text: '甜甜：其实是我带她见的世面。我告诉她——"你老公喂不饱你，外头有的是男人。你长得这么好看，别糟蹋自己。"', pop: ['别糟蹋自己'] },
          { kind: 'command', text: '甜甜：她一开始还犹豫，说"我结婚了"。我说"结了婚的才最吃香，人家就喜欢人妻，不用负责"。', pop: ['人妻'] },
          { kind: 'story', text: '那天晚上她回来得特别晚，酒气很重，进门就抱住你，什么也没说。你以为是应酬。那是她第一次，被别的男人摸遍了全身。' },
          { kind: 'command', text: '甜甜：那晚她回来抱你的时候，腿都是软的。你居然还心疼她，给她倒了杯热水。', pop: ['腿都是软的'] },
          { kind: 'command', text: '你记得那杯热水吗？她现在想起那晚，大概也在笑你傻。', pop: ['笑你傻'] },
        ],
      },
      {
        kind: 'fast', bpm: 85, duration: 45,
        title: '初次背叛·电话里的声音',
        text: '记住这种感觉——它是你今晚的主角',
        script: [
          { kind: 'story', text: '再后来，你出差。她在电话里跟你说晚安，声音断断续续。' },
          { kind: 'command', text: '甜甜：她跟你说"信号不好"，其实是被她第一个主人压着，捂住了嘴在挨肏。', pop: ['挨肏'] },
          { kind: 'command', text: '甜甜：她怕你听出来，又想让你听出来。那种又刺激又害怕的感觉，比跟老公做爽十倍——这话是她自己跟我说的。', pop: ['爽十倍'] },
          { kind: 'story', text: '你在酒店里对着天花板失眠，她在那头被人掰开腿，一遍一遍叫别人的名字。' },
          { kind: 'command', text: '甜甜：她说那通电话她事后听了三遍，每听一遍，腿间就更湿一点。你从头到尾，连一句"你怎么了"都没问出来。', pop: ['更湿'] },
          { kind: 'command', text: '捏紧拳头，别松开。记住这种感觉——它是你今晚的主角。', pop: ['主角'] },
        ],
      },
      {
        kind: 'fast', bpm: 95, duration: 45,
        title: '任务升级·公开的隐秘',
        text: '这句，给我听好了',
        script: [
          { kind: 'command', text: '甜甜：她主人开始给她派任务。第一个任务——戴着小东西，陪你逛街、陪你看电影。', pop: ['任务'] },
          { kind: 'story', text: '商场里她挽着你走了一下午，凑在你耳边说"老公，我今天里面有点不一样"。影院里她抓着你胳膊抖，你以为是感动。' },
          { kind: 'command', text: '甜甜：她主人隔着遥控器，当着你面调她。这叫"公开的隐秘"——你老婆当着你的面，被玩得腿都夹不拢。', pop: ['腿都夹不拢'] },
          { kind: 'command', text: '甜甜：晚上她搂着你说"今天玩得真开心"。她当然开心，她一路被顶着高潮。', pop: ['一路被顶'] },
          { kind: 'command', text: '甜甜：再后来任务越来越离谱——跪在卫生间里给主人发语音、穿你送的裙子去见别的男人、在餐厅桌底下被男人隔着裙子摸。每一件，她都做了。', pop: ['她都做了'] },
          { kind: 'command', text: '甜甜：这就是你老婆，{name}。白天是你的好妻子，夜里是别人的骚货。', pop: ['骚货'] },
          { kind: 'command', text: '这句，给我听好了。你老婆，白天是你老婆，夜里是别人的骚货。', pop: ['听好了'] },
        ],
      },
      {
        kind: 'fast', bpm: 110, duration: 40,
        title: '视频通话·落地窗',
        text: '你的身体比你的嘴诚实',
        script: [
          { kind: 'command', text: '甜甜：（点开手机）这是她跟她主人通宵那次。她开着视频，镜头对着自己——就是要你知道，她当着你，跟别人做到天亮。', pop: ['做到天亮'] },
          { kind: 'story', text: '画面里她撅着屁股趴在落地窗上，被从后面狠狠撞，奶子压在玻璃上压成一片。她在镜头里喊的是别人的名字，越喊越响。' },
          { kind: 'command', text: '甜甜：（看着你）看着你老婆被肏的样子，你居然更硬了，对吗？鸡巴在裤子里一跳一跳，我隔着大衣都看见了。', pop: ['更硬'] },
          { kind: 'command', text: '甜甜：说——是她挨肏的样子让你硬，还是"她背着你挨肏"这件事让你硬？两种我都见多了。', pop: ['挨肏'] },
          { kind: 'command', text: '对，就这样。承认它。你的身体比你的嘴诚实。', pop: ['诚实'] },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 30,
        title: '第一次寸止',
        text: '停！忍住！',
        script: [
          { kind: 'command', text: '停。手从裤子上拿开。', pop: ['停'] },
          { kind: 'command', text: '甜甜：怎么，听着我说你老婆被肏，你居然硬了，鸡巴还流了这么多水。来，让我试试你的小鸡巴——看看是不是像你老婆说的那么不中用。', pop: ['小鸡巴'] },
          { kind: 'command', text: '甜甜：（隔着裤子握了一下，轻笑）哟，挺烫的。可惜——我现在还不想碰。', pop: ['不想碰'] },
          { kind: 'denial', text: '忍住。她碰你了，你反而不许。把手背到背后，咽回去。', pop: ['不许'] },
        ],
      },
      {
        kind: 'fast', bpm: 100, duration: 40,
        title: '边缘拉扯·看得见的比较',
        text: '看够了没？闭上眼',
        script: [
          { kind: 'command', text: '甜甜：先看看看得见的吧。比奶子——我的是不是比她大多了？她结婚后都垂了，我的还翘着呢。', pop: ['大多了'] },
          { kind: 'command', text: '甜甜：你上次跟她一起来我家吃饭，眼睛就一直往我领口里瞟。我早就发现了。', pop: ['领口'] },
          { kind: 'command', text: '甜甜：比屁股、比腿、比我这张嘴会吸——你老婆一样都比不过我。她唯一赢我的，就是名分。', pop: ['会吸'] },
          { kind: 'command', text: '甜甜：而她拿着那个名分，去给外面的男人当骚货。你说，这算不算一种浪费？', pop: ['浪费'] },
          { kind: 'command', text: '看够了没？看够了就闭上眼，感受节拍。我数到三，你才可以睁开。', pop: ['三'] },
        ],
      },
      {
        kind: 'edge', bpm: 0, duration: 25,
        title: '第二次寸止',
        text: '忍到我让你动为止',
        script: [
          { kind: 'command', text: '停住。一，二，停。她就在你面前，你反而不许动。', pop: ['停住'] },
          { kind: 'command', text: '甜甜：你碰不到你老婆，就想把火撒我身上？{name}，今晚最难的事，就是听我命令。' },
          { kind: 'command', text: '甜甜：我看你鸡巴都快把裤子顶穿了。别急，我还没玩够。', pop: ['玩够'] },
          { kind: 'denial', text: '深呼吸。忍着。忍到我让你动为止。', pop: ['忍'] },
        ],
      },
      {
        kind: 'fast', bpm: 120, duration: 50,
        title: '主人的任务·进去了',
        text: '我不让你射，你不准射出来',
        script: [
          { kind: 'command', text: '甜甜：（脱掉吊带，握住你）好了。今晚破例，我给你点甜头。' },
          { kind: 'command', text: '甜甜：对，就这样，用你的大鸡巴插进来——想想你老婆，是怎么被她的主人按在落地窗上，从后面狠狠肏的。', pop: ['插进来'] },
          { kind: 'command', text: '甜甜：啊……你的大鸡巴这不是挺硬挺大的嘛。肏得我好深啊。对，用力，再深一些。', pop: ['好深'] },
          { kind: 'command', text: '甜甜：现在——你老婆里面，有比我这更热、更紧的吗？没有吧。你这条肉虫，今晚也算开荤了。', pop: ['更紧'] },
          { kind: 'command', text: '甜甜：是不是你肏你老婆的时候，脑子里想的也是我？她那条死鱼，哪有力气夹得你这么爽。', pop: ['死鱼'] },
          { kind: 'command', text: '甜甜：我不让你射，你不准射出来。你老婆被我主人训得那么乖，你今晚也得一样。', pop: ['不准射'] },
          { kind: 'story', text: '她咬着你耳朵喊你的名字，又喊别人的名字。你分不清是奖赏还是羞辱，只知道她里面热得发烫，绞得你头皮发麻。' },
          { kind: 'command', text: '甜甜：（喘）肏我……对，就这样……你老婆趴在窗上被我主人从后面撞的时候，叫得比我还浪呢，你听见过吗？', pop: ['比我还浪'] },
          { kind: 'command', text: '甜甜：我不叫停，你就接着干。你的腰，今晚归我管。', pop: ['归我管'] },
          { kind: 'story', text: '沙发陷下去，吊带散落一地。你在她身上发了疯一样地冲，脑子里全是落地窗、玻璃、压扁的奶子和别人的名字。' },
          { kind: 'command', text: '甜甜：（事后，整理衣领，声音恢复冷静）……这是主人的任务。她让我来验收一下，你配不配进这个世界。' },
          { kind: 'command', text: '甜甜：看在你今晚还算听话的份上——你老婆下个任务，是当着你的面，被她的主人肏给你看。到时候，你连碰都不能碰。', pop: ['肏给你看'] },
          { kind: 'story', text: '手机亮起，一条语音。你点开，只有一声很轻的、满足的叹息。' },
          { kind: 'command', text: '甜甜：（走到门口，回头看你一眼）别急，{name}。好戏才刚开场。' },
        ],
      },
      {
        kind: 'rest', bpm: 0, duration: 50,
        title: '落幕',
        text: '好戏才刚开场',
        script: [
          { kind: 'praise', text: '第一集，完。欲望是这里的通行证，而你，才刚刚学会看它。' },
          { kind: 'story', text: '甜甜的话还在你耳边：下一集《交换之夜》，我带你去见见那些"主人"。' },
        ],
      },
    ],
  },
];
