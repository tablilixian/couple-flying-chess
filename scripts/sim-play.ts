/**
 * 飞行棋局仿真：回答「现在的题量够不够玩几局」。
 *
 * 用真实的棋盘生成、骰子、移动、事件判定、抽题逻辑，
 * 跑完整的一局（直到有人走到 48），统计：
 *   - 一局触发多少个任务、双方各执行多少个
 *   - 一局里实际用掉了多少条**互不相同**的题（玩得尽不尽兴）
 *   - 相邻两局之间重样多少
 *   - 连着玩时，第几局开始「抽不出新题」
 *
 * 事件判定复刻 useGameState.checkTile 的真实分支：
 *   幸运格 / 亲密追尾 → 用**落点方自己的包**，由对方执行
 *   意外陷阱         → 用**对方的包**，由落点方执行
 *   落点与对方同格   → 追尾（collision），用落点方自己的包，对方执行
 *
 * 两种去重策略对比（这是应用真正的分歧点）：
 *   reset  每开一局清空窗口 —— 现状（useGameState.startGame 里 recentTasks: []）
 *   keep   窗口跨局保留
 *
 * 用法：npx vite-node scripts/sim-play.ts [--games N] [--seed S] [--window W] [--strategy reset|keep]
 */
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { pickTaskForRole } from '../src/utils/taskPicker';
import type { TaskEventType } from '../src/utils/taskPicker';

/** 与 useGameState 保持一致的近期去重窗口 */
const RECENT_TASKS_LIMIT = 10;
const TILES = 49;
const WIN = 48;

/** mulberry32：可复现的伪随机 */
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

/** 与 gameLogic.generateBoardMap 同构，但用可控随机 */
function makeBoard(rand: () => number): TileType[] {
  const board: TileType[] = new Array(TILES).fill('blank');
  const idxs: number[] = [];
  for (let i = 1; i < TILES - 1; i++) idxs.push(i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  let k = 0;
  for (let i = 0; i < 6; i++) board[idxs[k++]] = 'status';
  for (let i = 0; i < 13; i++) board[idxs[k++]] = 'lucky';
  for (let i = 0; i < 13; i++) board[idxs[k++]] = 'trap';
  return board;
}

function moveTo(current: number, steps: number): number {
  let target = current + steps;
  if (target >= WIN) target = WIN - (target - WIN);
  return target;
}

interface GameResult {
  tasks: string[];
  perExecutor: { male: number; female: number };
  turns: number;
}

/** 跑一局。两人共用同一个包（最常见的用法）。 */
function playGame(
  themeId: string,
  rand: () => number,
  recentTasks: string[],
  windowSize: number
): GameResult {
  const theme = COUPLE_DEFAULT_THEMES.find(t => t.id === themeId)!;
  const board = makeBoard(rand);
  const steps = [0, 0];
  let turn = 0;
  const tasks: string[] = [];
  const perExecutor = { male: 0, female: 0 };
  let turns = 0;

  for (let guard = 0; guard < 500; guard++) {
    const active = turn;
    const opponent = turn === 0 ? 1 : 0;
    const dice = Math.floor(rand() * 6) + 1;
    steps[turn] = moveTo(steps[turn], dice);
    turns++;
    if (steps[turn] === WIN) break;

    let event: TaskEventType | null = null;
    let executorRole: 'male' | 'female';

    if (steps[turn] !== 0 && steps[turn] === steps[opponent]) {
      event = 'collision';
      executorRole = opponent === 0 ? 'male' : 'female';
    } else {
      const tile = board[steps[turn]];
      if (tile === 'lucky') {
        event = 'lucky';
        executorRole = opponent === 0 ? 'male' : 'female';
      } else if (tile === 'trap') {
        event = 'trap';
        executorRole = active === 0 ? 'male' : 'female';
      }
    }

    if (event) {
      const task = pickTaskForRole(theme, executorRole, event, recentTasks, rand);
      if (task) {
        tasks.push(task);
        perExecutor[executorRole]++;
        if (!recentTasks.includes(task)) recentTasks.push(task);
        while (recentTasks.length > windowSize) recentTasks.shift();
      }
    }
    turn = opponent;
  }

  return { tasks, perExecutor, turns };
}

// ─────────────────────────── 跑起来 ───────────────────────────

const args = process.argv.slice(2);
const argOf = (flag: string, dflt: number) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt;
};
const GAMES = argOf('--games', 200);
const SEED = argOf('--seed', 20261105);
const WINDOW = argOf('--window', RECENT_TASKS_LIMIT);
const STRATEGY = args.includes('--strategy') ? args[args.indexOf('--strategy') + 1] : 'keep';

console.log(`仿真：每个包跑 ${GAMES} 局，随机种子 ${SEED}，去重窗口 ${WINDOW}，跨局策略 ${STRATEGY}`);
console.log('（两人共用同一个包）');
console.log('');

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - s.length));

interface Stat {
  name: string;
  tasks: number;
  perGame: number;
  perExecutor: number;
  distinctPerGame: number;
  repeatInGame: number;
  adjacentRepeat: number;
  newPerGame: number;
  exhaustedAfter: number;
}

const stats: Stat[] = [];
let totalTurnsAll = 0;

for (const pack of COUPLE_DEFAULT_THEMES) {
  const rand = seeded(SEED);
  const recent: string[] = [];
  const sessionSeen = new Set<string>();
  let totalTasks = 0, totalDistinct = 0, totalRepeats = 0, totalNew = 0;
  let totalExecMale = 0, totalExecFemale = 0, totalTurns = 0;
  // 平均回合数用于校验仿真节奏，单方一次移动平均 3.5 步 × 两人 ≈ 28 回合
  let exhaustedGame = -1;
  let adjacentSum = 0, adjacentCount = 0;
  let prevTasks: string[] = [];

  for (let g = 0; g < GAMES; g++) {
    if (STRATEGY === 'reset') recent.length = 0;
    const before = new Set(sessionSeen);
    const r = playGame(pack.id, rand, recent, WINDOW);
    totalTasks += r.tasks.length;
    totalTurns += r.turns;
    totalExecMale += r.perExecutor.male;
    totalExecFemale += r.perExecutor.female;
    const uniq = new Set(r.tasks);
    totalDistinct += uniq.size;
    totalRepeats += r.tasks.length - uniq.size;
    if (g > 0) {
      const prevSet = new Set(prevTasks);
      adjacentSum += r.tasks.filter(t => prevSet.has(t)).length;
      adjacentCount++;
    }
    prevTasks = r.tasks;
    let newCount = 0;
    for (const t of r.tasks) {
      if (!before.has(t)) newCount++;
      sessionSeen.add(t);
    }
    totalNew += newCount;
    if (newCount === 0 && exhaustedGame < 0) exhaustedGame = g + 1;
  }

  stats.push({
    name: pack.name,
    tasks: pack.tasks.length,
    perGame: totalTasks / GAMES,
    perExecutor: (totalExecMale + totalExecFemale) / GAMES / 2,
    distinctPerGame: totalDistinct / GAMES,
    repeatInGame: totalRepeats / GAMES,
    adjacentRepeat: adjacentCount ? adjacentSum / adjacentCount : 0,
    newPerGame: totalNew / GAMES,
    exhaustedAfter: exhaustedGame
  });
  totalTurnsAll += totalTurns;
}

console.log(pad('包名', 14), pad('题量', 6), pad('局均任务', 10), pad('单方执行', 10),
  pad('局内唯一', 10), pad('局内重样', 10), pad('相邻局重样', 12), pad('局均新题', 10), '抽不出新题');
console.log('-'.repeat(104));

for (const s of stats) {
  console.log(
    pad(s.name, 14),
    pad(String(s.tasks), 6),
    pad(s.perGame.toFixed(1), 10),
    pad(s.perExecutor.toFixed(1), 10),
    pad(s.distinctPerGame.toFixed(1), 10),
    pad(s.repeatInGame.toFixed(1), 10),
    pad(s.adjacentRepeat.toFixed(1), 12),
    pad(s.newPerGame.toFixed(1), 10),
    s.exhaustedAfter > 0 ? `第 ${s.exhaustedAfter} 局` : '未出现'
  );
}

const avg = (k: keyof Stat) => stats.reduce((a, s) => a + (s[k] as number), 0) / stats.length;
console.log('-'.repeat(104));
console.log(`平均：局均 ${avg('perGame').toFixed(1)} 个任务 · 单方 ${avg('perExecutor').toFixed(1)} 个 · 局内唯一 ${avg('distinctPerGame').toFixed(1)} 个 · 相邻局重样 ${avg('adjacentRepeat').toFixed(1)} 个`);
console.log(`平均回合 ${(totalTurnsAll / (stats.length * GAMES)).toFixed(1)} 回合/局（两人合计）`);
