import { Theme } from '../types';
import { parseTaskTags, taskKindOf, type TaskKind } from './personalizeTask';

export type TaskEventType = 'lucky' | 'trap' | 'collision';

/**
 * 棋盘事件 → 允许的题型。
 *
 * - 幸运时刻：只出「要做的事」——好事就该是一个行动
 * - 意外陷阱：两类都出（罚做一件事 / 被问一个问题），**由系统随机决定**，
 *   执行者没有选择权，交互流程与改造前完全一致
 * - 亲密追尾：两类都出（加码动作 / 被追问）
 *
 * 主题里若不存在某种题型，会自动退到实际存在的题型；
 * 老主题包一条 `[Q]` 都没有，因此它们的行为与改造前一致。
 */
export const EVENT_KINDS: Record<TaskEventType, TaskKind[]> = {
  lucky: ['act'],
  trap: ['act', 'ask'],
  collision: ['act', 'ask']
};

function roleOf(tags: ReturnType<typeof parseTaskTags>['tags']): 'male' | 'female' | 'both' {
  if (tags.includes('M')) return 'male';
  if (tags.includes('F')) return 'female';
  return 'both';
}

/**
 * 抽一道任务。
 *
 * 收窄顺序：事件允许的题型 → 执行方 → 事件的 H/R 性质 → 最近去重。
 * 每一级都有兜底，**任何情况下都不会返回空串**（主题本身为空才返回 ''）。
 */
export function pickTaskForRole(
  theme: Theme | undefined,
  executorRole: 'male' | 'female',
  eventType: TaskEventType,
  recentTasks: string[],
  random: () => number = Math.random
): string {
  if (!theme || theme.tasks.length === 0) return '';

  // 事件允许的题型里，只保留本主题真实存在的
  const kinds = EVENT_KINDS[eventType].filter(k => theme.tasks.some(t => taskKindOf(t) === k));
  const kindOptions: TaskKind[] = kinds.length > 0 ? kinds : ['act'];

  // 题型由系统随机决定，执行者没有选择权
  const primaryKind = kindOptions[Math.floor(random() * kindOptions.length)];

  const buildPool = (kind: TaskKind): string[] => {
    const byKind = theme.tasks.filter(t => taskKindOf(t) === kind);

    const byRole = byKind.filter(t => {
      const roleTag = roleOf(parseTaskTags(t).tags);
      if (roleTag === 'male' && executorRole !== 'male') return false;
      if (roleTag === 'female' && executorRole !== 'female') return false;
      return true;
    });
    // 角色不匹配时退回同题型的全部题（宁可放宽角色，也不空池）
    const rolePool = byRole.length > 0 ? byRole : byKind;

    const byEvent = rolePool.filter(t => {
      const { tags } = parseTaskTags(t);
      if (eventType === 'trap' && tags.includes('R')) return false;
      if (eventType === 'lucky' && tags.includes('H')) return false;
      if (eventType === 'collision' && (tags.includes('R') || tags.includes('H'))) return false;
      return true;
    });
    return byEvent.length > 0 ? byEvent : rolePool;
  };

  // 先试随机到的题型，不可用再退到本事件允许的其它题型
  const kindOrder: TaskKind[] = [primaryKind, ...kindOptions.filter(k => k !== primaryKind)];
  let pool: string[] = [];
  for (const kind of kindOrder) {
    pool = buildPool(kind);
    if (pool.length > 0) break;
  }
  if (pool.length === 0) pool = theme.tasks;

  if (eventType === 'trap') {
    const hard = pool.filter(t => parseTaskTags(t).tags.includes('H'));
    if (hard.length > 0) pool = hard;
  } else if (eventType === 'lucky') {
    const reward = pool.filter(t => parseTaskTags(t).tags.includes('R'));
    if (reward.length > 0) pool = reward;
  }

  const fresh = pool.filter(t => !recentTasks.includes(t));
  const pickFrom = fresh.length > 0 ? fresh : pool;
  return pickFrom[Math.floor(random() * pickFrom.length)] || '';
}
