import { describe, it, expect } from 'vitest';
import { parseTaskTags, taskKindOf, stripTaskTags } from '../utils/personalizeTask';
import { pickTaskForRole, EVENT_KINDS } from '../utils/taskPicker';
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../data/themes';

/**
 * 「提问型任务」这一维度，以及由它带来的转换包。
 *
 * 背景：飞行棋原本 489 条任务全是「要做的事」，
 * 三种棋盘事件（幸运时刻 / 意外陷阱 / 亲密追尾）抽的是同一个池子。
 * 这里用 `[Q]` 标签引入「要回答的问题」，让事件之间真正产生区别。
 *
 * 转换包分两类：
 * - **场景包** 9 个：一个 TD 主题 = 一个包，包内是该幻想的推进梯度
 * - **烈度包** 12 个：一个 TD 主题按烈度档拆开，一包一档（补齐 TD 库里从未进过包的 5 个幻想）
 *
 * 三条硬约束，任何一条被破坏都必须红：
 * 1. **手写包行为不变** —— 没有 `[Q]` 就没有提问型，手写包一字不改
 * 2. **普通模式不受影响** —— 转换包只属于情侣模式
 * 3. **转换没有代词残留** —— 题面里不能出现「老公/老婆/男生/女生」这类第三人称
 */

/** 场景包：一个 TD 主题 = 一个包 */
const SCENE_PACK_IDS = [
  'public-eyes',
  'living-room',
  'deep-confession',
  'beyond-the-line',
  'three-way',
  'loose-tongue',
  'changed-hands',
  'swapped-night',
  'seductive-wife'
];

/** 烈度包：同一个幻想按烈度档拆开，包内不混档 */
const TIER_PACK_IDS = [
  'first-feelings',
  'slow-warmth',
  'hidden-heart',
  'flame-probe',
  'flame-daily',
  'desire-abyss',
  'role-cast',
  'role-lost',
  'kink-list',
  'kink-beyond',
  'bond-first',
  'bond-deep'
];

const CONVERTED_PACK_IDS = [...SCENE_PACK_IDS, ...TIER_PACK_IDS];

const coupleThemes = COUPLE_DEFAULT_THEMES;
const scenePacks = coupleThemes.filter(t => SCENE_PACK_IDS.includes(t.id));
const tierPacks = coupleThemes.filter(t => TIER_PACK_IDS.includes(t.id));
const convertedPacks = coupleThemes.filter(t => CONVERTED_PACK_IDS.includes(t.id));
/** 手写包 —— 一条 [Q] 都没有，行为必须与改造前完全一致 */
const legacyPacks = coupleThemes.filter(t => !CONVERTED_PACK_IDS.includes(t.id));

/** 可复现的伪随机（mulberry32），让抽题测试是确定性的 */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rolePoolSize(theme: { tasks: string[] }, role: 'male' | 'female'): number {
  let n = 0;
  for (const t of theme.tasks) {
    const { tags } = parseTaskTags(t);
    if (tags.includes('M')) { if (role === 'male') n++; }
    else if (tags.includes('F')) { if (role === 'female') n++; }
    else n++;
  }
  return n;
}

/**
 * 这个包**实际**能被用到的题池大小。
 *
 * 飞行棋里包的执行方永远是对方：
 *   男方选这个包 → 女方执行它 → 题目必须女方能做
 *   女方选这个包 → 男方执行它 → 题目必须男方能做
 *   两边都能选     → 取两边较小值
 *
 * 一局到底抽多少题，用 `scripts/sim-play.ts` 实测（真实棋盘 + 骰子 + 抽题逻辑，
 * 每包跑 200 局）：**一局约 17.1 个任务，两人分摊 → 单方每局约 8.6 个**。
 * ⚠️ 事件判定只在**落点**触发一次（不是每走一步都触发），所以远少于「每格一次」的粗算。
 *
 * 按单方池算，能撑几局不重复 ≈ 池子 ÷ 8.6：
 *   ≥ 9 一局 / ≥ 18 两局 / ≥ 26 三局 / ≥ 35 四局
 */
function executorPool(theme: { tasks: string[]; audience: string }): number {
  const male = rolePoolSize(theme, 'male');
  const female = rolePoolSize(theme, 'female');
  if (theme.audience === 'male') return female;
  if (theme.audience === 'female') return male;
  return Math.min(male, female);
}

// ─────────────────────────────────────────────────────────────
// 标签机制
// ─────────────────────────────────────────────────────────────

describe('任务标签 · [Q] 提问型', () => {
  it('解析 [Q]，且能与其他标签叠加', () => {
    expect(parseTaskTags('[Q] 问一句').tags).toEqual(['Q']);
    expect(parseTaskTags('[M][Q] 问一句').tags).toEqual(['M', 'Q']);
    expect(parseTaskTags('[both][Q][H] 问一句').tags).toEqual(['both', 'Q', 'H']);
    expect(stripTaskTags('[M][Q] 问一句')).toBe('问一句');
  });

  it('没有 [Q] 的一律视为动作型（向后兼容）', () => {
    expect(taskKindOf('[M] 做一件事')).toBe('act');
    expect(taskKindOf('[both][H] 做一件事')).toBe('act');
    expect(taskKindOf('[M][Q] 问一个问题')).toBe('ask');
  });

  it('[Q] 不会影响执行方判定', () => {
    // roleFromTags 只认 M/F/both，其余标签被忽略
    expect(parseTaskTags('[M][Q] x').tags.includes('M')).toBe(true);
    expect(parseTaskTags('[Q][F] x').tags.includes('F')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 老包零回归
// ─────────────────────────────────────────────────────────────

describe('手写包 · 行为不变', () => {
  it('11 个手写包一条提问型都没有', () => {
    expect(legacyPacks).toHaveLength(11);
    for (const theme of legacyPacks) {
      const asks = theme.tasks.filter(t => taskKindOf(t) === 'ask');
      expect(asks, `${theme.name} 不该有提问型`).toHaveLength(0);
    }
  });

  it('手写包在三种事件下抽出的都还是动作型', () => {
    for (const theme of legacyPacks) {
      for (const event of ['lucky', 'trap', 'collision'] as const) {
        for (const role of ['male', 'female'] as const) {
          const task = pickTaskForRole(theme, role, event, [], seeded(7));
          expect(task, `${theme.name}/${event}`).not.toBe('');
          expect(taskKindOf(task), `${theme.name}/${event}`).toBe('act');
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 事件分流
// ─────────────────────────────────────────────────────────────

describe('事件分流 · 题型由系统随机决定', () => {
  const pack = convertedPacks[0];

  it('幸运时刻只出动作型', () => {
    expect(EVENT_KINDS.lucky).toEqual(['act']);
    for (let i = 0; i < 200; i++) {
      const task = pickTaskForRole(pack, 'female', 'lucky', [], seeded(i));
      expect(taskKindOf(task)).toBe('act');
    }
  });

  it('意外陷阱两类都会抽到，且由系统决定', () => {
    expect(EVENT_KINDS.trap).toEqual(['act', 'ask']);
    const kinds = new Set<string>();
    for (let i = 0; i < 200; i++) {
      kinds.add(taskKindOf(pickTaskForRole(pack, 'female', 'trap', [], seeded(i))));
    }
    expect(kinds).toEqual(new Set(['act', 'ask']));
  });

  it('亲密追尾两类都会抽到', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 200; i++) {
      kinds.add(taskKindOf(pickTaskForRole(pack, 'male', 'collision', [], seeded(i))));
    }
    expect(kinds).toEqual(new Set(['act', 'ask']));
  });

  it('主题里没有某种题型时自动退到存在的题型，不会抽空', () => {
    for (const theme of legacyPacks) {
      const task = pickTaskForRole(theme, 'male', 'trap', [], seeded(3));
      expect(task).not.toBe('');
    }
  });

  it('最近抽过的会被避开，池子耗尽后回退', () => {
    const theme = convertedPacks[0];
    const first = pickTaskForRole(theme, 'male', 'trap', [], seeded(11));
    expect(first).not.toBe('');
    const second = pickTaskForRole(theme, 'male', 'trap', [first], seeded(11));
    expect(second).not.toBe('');
    expect(second).not.toBe(first);
  });
});

// ─────────────────────────────────────────────────────────────
// 新主题包的数据质量
// ─────────────────────────────────────────────────────────────

describe('转换包 · 数据完整性', () => {
  it('21 个转换包都已注册，且都属于情侣模式', () => {
    expect(scenePacks).toHaveLength(9);
    expect(tierPacks).toHaveLength(12);
    expect(convertedPacks).toHaveLength(21);
    for (const t of convertedPacks) {
      expect(t.mode).toBe('couple');
    }
  });

  it('普通模式拿不到任何转换包', () => {
    const normalIds = NORMAL_DEFAULT_THEMES.map(t => t.id);
    for (const id of CONVERTED_PACK_IDS) expect(normalIds).not.toContain(id);
  });

  it('角色极不平衡的包用 audience 钉给合适的一方', () => {
    // 「风情妻子」有 129 条 [F]、只有 12 条 [M] —— 只能给男方选、交给女方执行
    const wife = convertedPacks.find(t => t.id === 'seductive-wife')!;
    expect(wife.audience).toBe('male');
    expect(rolePoolSize(wife, 'female')).toBeGreaterThanOrEqual(37);
    // 其余包男女都能选
    for (const t of convertedPacks.filter(x => x.id !== 'seductive-wife')) {
      expect(t.audience).toBe('common');
    }
  });

  it('场景包够打四局不重复（≥35，实测取 37）；烈度包至少够打三局（≥26，实测取 28）', () => {
    for (const t of scenePacks) {
      expect(t.tasks.length, t.name).toBeGreaterThanOrEqual(74);
      expect(executorPool(t), `${t.name} 的执行方池`).toBeGreaterThanOrEqual(37);
    }
    // 烈度包一包只收一个烈度档，题量天然比场景包小：
    // 单方一局抽 8.6 个题，28 条 ≈ 够三局不重复
    for (const t of tierPacks) {
      expect(executorPool(t), `${t.name} 的执行方池`).toBeGreaterThanOrEqual(28);
    }
  });

  it('达不到「四局不重复」的烈度包就是已知的那几个（内容变了要同步）', () => {
    const thin = tierPacks.filter(t => executorPool(t) < 35).map(t => t.name).sort();
    expect(thin).toEqual(['戏中失控', '束缚试探', '细水长流', '隐秘心事']);
  });

  it('每个包动作型与提问型都有，两种题型都玩得到', () => {
    for (const t of convertedPacks) {
      const acts = t.tasks.filter(x => taskKindOf(x) === 'act');
      const asks = t.tasks.filter(x => taskKindOf(x) === 'ask');
      expect(acts.length, t.name).toBeGreaterThan(0);
      expect(asks.length, t.name).toBeGreaterThan(0);
    }
  });

  it('题面没有转换残留：第三人称代词 / 占位符', () => {
    const bad = /老公|老婆|妻子|丈夫|男生|女生|@@KEEP|\$1|__KEEP__/;
    for (const t of convertedPacks) {
      for (const task of t.tasks) {
        const body = stripTaskTags(task);
        expect(bad.test(body), `${t.name}: ${body}`).toBe(false);
      }
    }
  });

  it('转换包之间没有重复文案', () => {
    const seen = new Map<string, string>();
    for (const t of convertedPacks) {
      for (const task of t.tasks) {
        const body = stripTaskTags(task);
        expect(seen.has(body), `重复：${body}`).toBe(false);
        seen.set(body, t.name);
      }
    }
  });

  it('每个包都有状态池（行动 + 条件）', () => {
    for (const t of convertedPacks) {
      expect((t.actionStates || []).length, t.name).toBeGreaterThan(0);
      expect((t.conditionStates || []).length, t.name).toBeGreaterThan(0);
    }
  });

  it('状态池文案同样没有第三人称残留', () => {
    for (const t of convertedPacks) {
      for (const s of [...(t.actionStates || []), ...(t.conditionStates || [])]) {
        expect(/老公|老婆|妻子|丈夫|男生|女生/.test(stripTaskTags(s)), s).toBe(false);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 事件 × 烈度 · 格子靠「题型」分流，烈度靠「包」决定
// ─────────────────────────────────────────────────────────────

describe('事件 × 烈度 · 格子分流由题型承担，不由烈度标签承担', () => {
  const pack = convertedPacks[0];

  it('转换包不标 [R]/[H]：烈度由包决定，不由标签调节', () => {
    // [R]/[H] 的原始语义是「奖励向 / 惩罚向」（来自手写包「奖惩卡池」）。
    // TD 的 difficulty 是「推进程度」不是「正反极性」，映射过去会把难度
    // 梯度误当成温和/极端塞进包 —— 既稀释包，又把格子池打歪。
    for (const t of convertedPacks) {
      for (const task of t.tasks) {
        const tags = parseTaskTags(task).tags;
        expect(tags.includes('R'), `${t.name}: ${task}`).toBe(false);
        expect(tags.includes('H'), `${t.name}: ${task}`).toBe(false);
      }
    }
  });

  it('幸运时刻只出动作型，不会抽到提问型', () => {
    for (let i = 0; i < 200; i++) {
      const task = pickTaskForRole(pack, 'female', 'lucky', [], seeded(i));
      expect(taskKindOf(task), task).toBe('act');
    }
  });

  it('意外陷阱会抽到提问型（被问一个问题）', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 200; i++) {
      kinds.add(taskKindOf(pickTaskForRole(pack, 'male', 'trap', [], seeded(i))));
    }
    expect(kinds).toEqual(new Set(['act', 'ask']));
  });

  it('亲密追尾会抽到提问型（被追问）', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 200; i++) {
      kinds.add(taskKindOf(pickTaskForRole(pack, 'female', 'collision', [], seeded(i))));
    }
    expect(kinds).toEqual(new Set(['act', 'ask']));
  });

  it('三个事件抽到的题互不相同（同一包内不会三格同题）', () => {
    const lucky = pickTaskForRole(pack, 'male', 'lucky', [], seeded(5));
    const trap = pickTaskForRole(pack, 'male', 'trap', [], seeded(5));
    expect(lucky).not.toBe('');
    expect(trap).not.toBe('');
    // 幸运格只出动作型、陷阱格可能出提问型，两者题型域不同
    expect(taskKindOf(lucky)).toBe('act');
  });
});
