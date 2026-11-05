/**
 * 跨包重复文案审计。
 *
 * 同一个任务文案出现在两个以上主题包里，等于「同一个题被抽到两次」，
 * 体感上就是内容在循环。这里把所有情侣主题包的题面（剥掉标签）放一起比对。
 *
 * 用法：npx vite-node scripts/audit-dup-cross.ts
 */
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { stripTaskTags } from '../src/utils/personalizeTask';

const seen = new Map<string, string[]>();

for (const pack of COUPLE_DEFAULT_THEMES) {
  for (const task of pack.tasks) {
    const body = stripTaskTags(task).trim();
    if (!body) continue;
    if (!seen.has(body)) seen.set(body, []);
    seen.get(body)!.push(pack.name);
  }
}

let groups = 0;
for (const [body, names] of seen) {
  if (names.length > 1) {
    groups++;
    console.log(`${names.join(' == ')}\n   ${body}\n`);
  }
}

console.log(`包数: ${COUPLE_DEFAULT_THEMES.length}`);
console.log(`题目总数: ${[...seen.values()].reduce((n, v) => n + v.length, 0)}`);
console.log(`跨包重复文案组数: ${groups}`);
