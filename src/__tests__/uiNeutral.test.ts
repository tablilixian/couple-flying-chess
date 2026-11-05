import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 防回归：**界面文案里不得出现模式名 / 空间名**。
 *
 * 用户的硬要求是「不让人知道这个网站里还有情侣模式」。
 * 这件事很容易在后续迭代里被无意破坏 —— 加个徽标、写句提示、
 * 复制粘贴文案时带上「情侣模式」四个字，就漏了。
 * 所以用测试把它钉死：一旦有人把模式名写回 .tsx 界面，测试立刻红。
 *
 * 说明：
 * - 只扫 .tsx（界面层）；数据层 / 工具层的模式名是必要的，不在检查范围
 * - 扫描前先剥掉注释 —— 注释里的说明允许出现模式名（那是给维护者看的）
 */

const UI_DIR = join(process.cwd(), 'src');

// 拼接构造，避免这个测试文件自己被判为违规
const FORBIDDEN = [
  '情侣' + '模式',
  '普通' + '模式',
  '情侣' + '飞行棋',
  '普通' + '飞行棋',
  '情侣' + '题库',
  '普通' + '题库',
  '情侣' + '剧场',
  '亲子' + '剧场'
];

function collectTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTsxFiles(full, out);
    } else if (full.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

/** 剥掉块注释与行注释，只留下真正会被渲染 / 执行的代码 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('界面文案 · 不泄露模式名', () => {
  const files = collectTsxFiles(UI_DIR);

  it('至少扫到了界面文件（防止路径写错导致假通过）', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)('%s 不含模式名文案', (file) => {
    const code = stripComments(readFileSync(file, 'utf-8'));
    for (const word of FORBIDDEN) {
      expect(code, `${file} 出现了「${word}」，会让访客知道存在其他模式`).not.toContain(word);
    }
  });

  it('门禁页只提示「请输入密码」，不做任何模式暗示', () => {
    const gate = readFileSync(join(UI_DIR, 'components', 'VerificationGate.tsx'), 'utf-8');
    const code = stripComments(gate);
    expect(code).toContain('请输入密码');
    expect(code).toContain('密码错误');
    // 门禁上不允许出现任何「进入某模式」的按钮文案
    expect(code).not.toContain('首次使用');
    expect(code).not.toContain('选择一个模式');
  });
});
