export interface Novel {
  id: string;
  title: string;
  author: string;
  tags: string[];
  /** 相对于 public 根目录的 md 文件路径 */
  src: string;
  /** 简介 */
  description: string;
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
  },
];
