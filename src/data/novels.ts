export interface NovelCharacter {
  name: string;
  role: string;
  description: string;
}

export interface NovelRelation {
  from: string;
  to: string;
  relation: string;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  tags: string[];
  /** 相对于 public 根目录的 md 文件路径 */
  src: string;
  /** 简介 */
  description: string;
  /** 主要人物（从正文提取） */
  characters?: NovelCharacter[];
  /** 人物关系（从正文提取） */
  relations?: NovelRelation[];
}

// 小说清单：后续增加小说只需在此追加一项，并把 md 文件放到 public/novels/ 下
export const NOVELS: Novel[] = [
  {
    id: 'xiangyinqi',
    title: '想淫妻的我竟然被绿了',
    author: '深夜渔夫',
    tags: ['現代奇幻', '淫妻', 'NTR', '人妻', '调教', '绿奴'],
    src: `${import.meta.env.BASE_URL}novels/xiangyinqi.md`,
    description: '共60章。事业有成的李有有，因婚后三年无法让妻子简宁高潮，心底萌生了为妻子寻找「人形快乐工具」的念头。一桩邻居偷情事件，将他推入欲望、羞辱与禁忌交织的深渊……',
    characters: [
      { name: '李有有', role: '丈夫 / 主角', description: '事业有成的公司老板，大学毕业与吴凯合伙创业。因无法让妻子高潮而产生淫妻念头，内心充满愧疚、自卑与禁忌欲望的交织。' },
      { name: '简宁', role: '妻子 / 女主', description: '业内小有名气的画家，美院客座教授。外表高雅端庄，实则内媚敏感，身体极其特殊——快要高潮时收缩极强导致丈夫秒射，三年未尝高潮滋味。经济独立、性格坚韧，被黄鹤雨逐步调教沦陷。' },
      { name: '黄鹤雨', role: '核心反派 / 大学生 / 调教者', description: '21岁大二学生，管理系，住在李有有楼下(15楼2号)。外表憨厚普通，实则玩弄女性的老手，擅长心理操控与身体开发，录制视频贩卖牟利。先后调教过大学语文老师李珏、校花母女、靓丽人妻等，现以简宁为目标。' },
      { name: '何俪', role: '小姨 / 4S店老板', description: '简宁母亲的亲妹妹，只大简宁8岁，大美女。经营一家4S店，与简宁如姐妹般亲密。简宁的红色野马是她帮忙从国外买回的。喜欢品酒，常拉着简宁喝酒。' },
      { name: '吴凯', role: '合伙人 / 技术总监', description: '李有有的大学同学，公司技术总监，典型理工男，不善应酬。常拉着李有有出席各类交流会，二人斗嘴是日常乐趣。' },
      { name: '李晓媛', role: '楼下邻居 / 人妻', description: '住在楼下的美丽人妻，表面得体随和，实则在楼梯间与表弟偷情，被少年淫辱却极度享受。' },
      { name: '李晓媛表弟', role: '少年 / 偷窥者', description: '18-19岁，李晓媛的表弟。外表腼腆胆小，实则淫辱表姐、偷拍简宁的跟踪狂。后被李有有发现并威胁删除了偷拍视频。' },
      { name: '李小鹏', role: '学弟 / 黑客 / 员工', description: '李有有大学学弟，公司科研部固件开发负责人，黑客技术高手。受李有有委托入侵黄鹤雨电脑与摄像头，提供技术支持。' },
      { name: '李珏', role: '大学语文老师 / 受害者', description: '黄鹤雨的大学语文老师，平时矜持端方，实则越害羞越兴奋，被黄鹤雨在教室、家中等地多次调教录像，成为其「大学语文老师」系列视频的主角。' },
      { name: '李胖子', role: '黄鹤雨同伙', description: '黄鹤雨的朋友/同伙，协助监视目标、拍摄素材。' },
      { name: '校花', role: '黄鹤雨受害者', description: '有男朋友的大学生，被黄鹤雨偷偷搞定，在校期间各种花样都玩过，毕业后偶尔还能约上一回。' },
      { name: '人妻辣妈', role: '黄鹤雨受害者', description: '校花的母亲，比女儿更骚，母女之间还有互动，价格更贵。' },
      { name: '靓丽人妻', role: '黄鹤雨受害者', description: '大公司管理层，风骚主动，老公有绿帽癖，黄鹤雨多次当着她老公面操她。' },
    ],
    relations: [
      { from: '李有有', to: '简宁', relation: '夫妻（结婚三年，无法让妻子高潮）' },
      { from: '李有有', to: '吴凯', relation: '大学同学 / 合伙人 / 技术总监' },
      { from: '李有有', to: '李小鹏', relation: '大学学弟 / 员工 / 黑客技术支持' },
      { from: '简宁', to: '何俪', relation: '姨甥关系 / 如姐妹般亲密' },
      { from: '简宁', to: '黄鹤雨', relation: '被调教者 / 受害者（楼下邻居大学生）' },
      { from: '简宁', to: '李晓媛表弟', relation: '被偷拍跟踪 / 受害者' },
      { from: '李晓媛', to: '李晓媛表弟', relation: '表姐弟 / 偷情关系（楼梯间淫辱）' },
      { from: '黄鹤雨', to: '李珏', relation: '调教者 / 受害者（大学语文老师系列）' },
      { from: '黄鹤雨', to: '校花', relation: '调教者 / 受害者（有男友）' },
      { from: '黄鹤雨', to: '人妻辣妈', relation: '调教者 / 受害者（校花母亲，母女互动）' },
      { from: '黄鹤雨', to: '靓丽人妻', relation: '调教者 / 受害者（老公有绿帽癖）' },
      { from: '黄鹤雨', to: '李胖子', relation: '同伙 / 朋友' },
      { from: '李有有', to: '李晓媛', relation: '楼上楼下邻居 / 知晓其偷情' },
    ],
  },
];
