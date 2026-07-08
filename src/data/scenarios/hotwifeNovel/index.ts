import { Scenario } from '../../../types';
import { ch1 } from './ch1';
import { ch2 } from './ch2';

export const HOTWIFE_NOVEL: Scenario = {
  id: 'hotwife-novel',
  mode: 'couple',
  title: '淫妻开发之路',
  emoji: '📖',
  desc: '根据真实经历改编。你们将扮演{0}和{1}，重走从幻想到突破再到入圈的全过程。',
  roles: ['{0}（丈夫）', '{1}（妻子）'],
  roleEmojis: ['👑', '💃'],
  difficulty: 'hard',
  estimatedMinutes: 150,
  definitions: [
    { term: '淫妻（Hotwife）', meaning: '指妻子在丈夫知情且同意的情况下，与其他男性发生性互动。核心在于丈夫从中获得性兴奋，而非隐瞒或背叛。' },
    { term: '反差刺激', meaning: '淫妻爱好的本质——看惯了妻子在自己面前的淫荡模样，突然发现她在别人胯下还有完全不同的表现，这种"陌生又熟悉"的反差感是快感的来源。' },
  ],
  acts: [ch1, ch2],
};
