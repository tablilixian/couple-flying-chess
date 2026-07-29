/**
 * 小说人物关系数据库类型定义
 * 由 parse-novel 脚本生成，供 NovelView.tsx 的「人物」Tab 直接 import 使用
 */

export interface Character {
  id: string;                    // 唯一键：拼音小写
  name: string;                  // 显示名
  aliases: string[];             // 别名/称呼（老公、阿有、表弟…）
  role: 'protagonist' | 'wife' | 'lover' | 'antagonist' | 'side' | 'minor';
  gender: 'male' | 'female';
  tags: string[];                // 身份标签：['丈夫','CEO','绿奴']…
  description: string;           // 一句话画像
  firstAppearChapter: number;
  lastAppearChapter: number;
  appearCount: number;
  metadata?: Record<string, any>;
}

export interface RelationshipEvent {
  chapter: number;
  eventType: 'meet' | 'confess' | 'sex' | 'conflict' | 'blackmail' | 'discover' | 'breakup' | 'milestone' | 'reveal' | 'other';
  summary: string;               // 一句话概括
  detail?: string;               // 可选：原文片段/详细描述
  participants: string[];        // 涉及角色 ids
}

export interface Relationship {
  id: string;                    // `${from}-${to}-${type}`
  from: string;                  // character.id
  to: string;
  type: 'spouse' | 'lover' | 'affair' | 'master_slave' | 'friend' | 'colleague' | 'family' | 'enemy' | 'blackmailer' | 'voyeur' | 'other';
  status: 'ongoing' | 'ended' | 'complicated' | 'secret' | 'public';
  intensity: 1 | 2 | 3 | 4 | 5;  // 1=路人 5=核心羁绊
  startChapter: number;
  endChapter?: number;
  keyEvents: RelationshipEvent[];
  notes?: string;
}

export interface ChapterSummary {
  chapter: number;
  title: string;
  charactersPresent: string[];   // 本章出场角色 ids
  keyEvents: RelationshipEvent[];
  wordCount: number;
}

export interface NovelCharacterDB {
  version: string;
  generatedAt: string;
  sourceFile: string;
  totalChapters: number;
  characters: Record<string, Character>;
  relationships: Relationship[];
  chapterSummaries: ChapterSummary[];
}

// 导出常量供 UI 直接 import
import full from './characterDB.full.json';
export const CHARACTER_DB: NovelCharacterDB = full as NovelCharacterDB;