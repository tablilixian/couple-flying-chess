#!/usr/bin/env tsx
/**
 * 将 public/novels/xiangyinqi.md 按「##第XX章」切分为 60 章
 * 输出 scripts/chapters.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const SRC = join(import.meta.dirname, '../public/novels/xiangyinqi.md');
const DST = join(import.meta.dirname, '../data/novel/chapters.json');

mkdirSync(dirname(DST), { recursive: true });

const raw = readFileSync(SRC, 'utf-8').replace(/\r\n/g, '\n');

// 行首可能有 \u3000 (全角空格) 或普通空格
const chapterRegex = /^[\s\u3000]*##\s*第\s*(\d{1,2})\s*章\s*(.*)$/gm;

const matches: { index: number; chapter: number; title: string }[] = [];
let match: RegExpExecArray | null;
while ((match = chapterRegex.exec(raw)) !== null) {
  const chNum = Number(match[1]);
  const chTitle = match[2].trim() || `第${chNum}章`;
  matches.push({ index: match.index, chapter: chNum, title: chTitle });
}

const chapters = matches.map((m, i) => {
  const start = m.index;
  const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
  const text = raw.slice(start, end).trim();
  return {
    chapter: m.chapter,
    title: m.title,
    text,
    wordCount: text.length,
  };
});

// 过滤掉可能的前言/元数据（章号为 0 或文本太短）
const valid = chapters.filter(c => c.chapter > 0 && c.text.length > 100);

console.log(`切分完成：${valid.length} 章`);
valid.forEach(c => console.log(`  Ch.${String(c.chapter).padStart(2, '0')} ${c.title} (${c.wordCount} 字)`));

writeFileSync(DST, JSON.stringify(valid, null, 2), 'utf-8');
console.log(`\n已写入 ${DST}`);