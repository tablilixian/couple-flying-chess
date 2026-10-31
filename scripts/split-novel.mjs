#!/usr/bin/env node
/**
 * 把 public/novels/*.md 拆成「目录 + 单章」静态文件，供书房按需加载。
 *
 * 背景：xiangyinqi.md 是一个 1.5MB 的单文件，GitHub Pages 上实测要 40~60 秒才能拉完，
 * 而旧实现必须等整本下完才能渲染目录，于是出现「点目录一直转圈」。
 *
 * 产物（以 xiangyinqi 为例）：
 *   public/novels/xiangyinqi/index.json      ~3KB  章节目录
 *   public/novels/xiangyinqi/ch/01.json      ~25KB 单章正文
 *
 * 目录格式：{ id, title, count, chapters: [{ i, title, words }] }
 * 单章格式：{ i, title, paragraphs: string[] }
 *
 * 用法：node scripts/split-novel.mjs    （dev / build 前自动执行）
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOVEL_DIR = join(ROOT, 'public', 'novels');

/** 与前端 NovelView 的解析规则保持一致 */
const CHAPTER_RE = /^##\s*第\s*\d+\s*章/;

function splitChapters(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const starts = [];

  lines.forEach((line, i) => {
    const t = line.trim();
    if (CHAPTER_RE.test(t)) starts.push({ line: i, title: t.replace(/^##\s*/, '').trim() });
  });

  const chapters = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].line;
    const end = i + 1 < starts.length ? starts[i + 1].line : lines.length;
    const paragraphs = [];
    for (let j = start + 1; j < end; j++) {
      const t = lines[j].trim();
      if (!t || t.startsWith('#')) continue;
      paragraphs.push(t);
    }
    if (!paragraphs.length) continue; // 空章（只有标题）跳过，避免目录点进去是白屏
    chapters.push({ title: starts[i].title, paragraphs });
  }
  return chapters;
}

if (!existsSync(NOVEL_DIR)) {
  console.log('[split-novel] 没有 public/novels 目录，跳过');
  process.exit(0);
}

const mdFiles = readdirSync(NOVEL_DIR).filter(f => f.endsWith('.md'));
if (!mdFiles.length) {
  console.log('[split-novel] 没有 .md 文件，跳过');
  process.exit(0);
}

let totalChapters = 0;
let totalBytes = 0;

for (const file of mdFiles) {
  const id = basename(file, '.md');
  const raw = readFileSync(join(NOVEL_DIR, file), 'utf8');
  const chapters = splitChapters(raw);
  if (!chapters.length) {
    console.warn(`[split-novel] ${file} 没解析出章节，跳过`);
    continue;
  }

  const outDir = join(NOVEL_DIR, id);
  const chDir = join(outDir, 'ch');
  rmSync(outDir, { recursive: true, force: true }); // 清理旧产物，避免改稿后残留
  mkdirSync(chDir, { recursive: true });

  const index = {
    id,
    title: id,
    count: chapters.length,
    chapters: chapters.map((c, i) => ({
      i,
      title: c.title,
      words: c.paragraphs.reduce((n, p) => n + p.length, 0),
    })),
  };
  const indexJson = JSON.stringify(index);
  writeFileSync(join(outDir, 'index.json'), indexJson, 'utf8');
  totalBytes += Buffer.byteLength(indexJson);

  chapters.forEach((c, i) => {
    const payload = JSON.stringify({ i, title: c.title, paragraphs: c.paragraphs });
    writeFileSync(join(chDir, `${String(i + 1).padStart(2, '0')}.json`), payload, 'utf8');
    totalBytes += Buffer.byteLength(payload);
  });

  totalChapters += chapters.length;
  console.log(`[split-novel] ${file} → ${chapters.length} 章，目录 ${(Buffer.byteLength(indexJson) / 1024).toFixed(1)}KB`);
}

console.log(`[split-novel] 完成：${totalChapters} 章 / ${(totalBytes / 1024).toFixed(0)}KB`);
