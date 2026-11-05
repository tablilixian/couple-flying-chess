/**
 * 难度档位 / 题型 / 执行方分布盘点。
 *
 * 飞行棋的三个事件对内容有不同要求：
 * - 幸运格只出 act，且优先挑 [R]（温和档）→ 缺 [R] 的包抽不到温和题
 * - 陷阱/碰撞格出 act + ask（[Q]）
 * - 执行方过滤：[F] 只能给女方执行、[M] 只能给男方执行、[both] 两边都能
 *
 * 用法：npx vite-node scripts/audit-level-dist.ts
 */
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { parseTaskTags } from '../src/utils/personalizeTask';

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - s.length));

console.log(pad('包名', 14), pad('总数', 6), pad('R', 5), pad('H', 5), pad('Q', 5), pad('F', 5), pad('M', 5), 'both');
console.log('-'.repeat(60));

for (const pack of COUPLE_DEFAULT_THEMES) {
  let r = 0, h = 0, q = 0, f = 0, m = 0, b = 0;
  for (const task of pack.tasks) {
    const tags = parseTaskTags(task).tags;
    if (tags.includes('R')) r++;
    if (tags.includes('H')) h++;
    if (tags.includes('Q')) q++;
    if (tags.includes('F')) f++;
    else if (tags.includes('M')) m++;
    else if (tags.includes('both')) b++;
  }
  console.log(
    pad(pack.name, 14),
    pad(String(pack.tasks.length), 6),
    pad(String(r), 5),
    pad(String(h), 5),
    pad(String(q), 5),
    pad(String(f), 5),
    pad(String(m), 5),
    String(b),
  );
}
