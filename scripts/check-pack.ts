/**
 * 单包自检：文件格式 / 标签 / 人称残留 / 执行方池 / 状态池 / 跨包重复
 *
 * 用法：
 *   npx vite-node scripts/check-pack.ts src/data/themes/coupleBondIntro.ts ...
 *   npx vite-node scripts/check-pack.ts src/data/themes/coupleDominator.ts   # 顺便和全站比重复
 *
 * 退出码非 0 表示有问题。
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../src/data/themes';
import { parseTaskTags, stripTaskTags } from '../src/utils/personalizeTask';

const FORBIDDEN_WORDS = /老公|老婆|妻子|丈夫|男生|女生/;
const FORBIDDEN_PLACEHOLDER = /\{name\}|\{partner\}|\{actor\}|\{0\}|\{1\}|@@/;
const FORBIDDEN_THIRD_PARTY = /甜甜|实习生|学长|班主任/;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('用法：npx vite-node scripts/check-pack.ts <文件路径...>');
  process.exit(2);
}

interface Pack {
  id: string;
  name: string;
  desc: string;
  audience: string;
  tasks: string[];
  actionStates?: string[];
  conditionStates?: string[];
}

function parsePack(file: string): Pack {
  const src = readFileSync(file, 'utf8');
  const id = src.match(/id:\s*'([^']+)'/)?.[1];
  const name = src.match(/name:\s*'([^']+)'/)?.[1];
  const desc = src.match(/desc:\s*'([^']+)'/)?.[1];
  const audience = src.match(/audience:\s*'([^']+)'/)?.[1];
  const tasksBlock = src.match(/tasks:\s*\[([\s\S]*?)\n\s*\]/)?.[1] ?? '';
  const tasks = [...tasksBlock.matchAll(/^\s*"(.*)",?\s*$/gm)].map(m => m[1]);
  const stateBlock = (key: string) => {
    const m = src.match(new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\n\\s*\\]`));
    if (!m) return [] as string[];
    return [...m[1].matchAll(/^\s*"(.*)",?\s*$/gm)].map(x => x[1]);
  };
  if (!id || !name) throw new Error(`${file}: 解析不出 id / name`);
  return {
    id,
    name,
    desc: desc ?? '',
    audience: audience ?? 'common',
    tasks,
    actionStates: stateBlock('actionStates'),
    conditionStates: stateBlock('conditionStates')
  };
}

/** 单方一局抽多少题（scripts/sim-play.ts 实测 200 局）：两人分摊 */
const PER_GAME = 8.6;

function pools(pack: Pack) {
  let male = 0;
  let female = 0;
  let act = 0;
  let ask = 0;
  const r = { R: 0, H: 0 };
  for (const t of pack.tasks) {
    const { tags } = parseTaskTags(t);
    if (tags.includes('M')) male++;
    else if (tags.includes('F')) female++;
    else {
      male++;
      female++;
    }
    if (tags.includes('Q')) ask++;
    else act++;
    if (tags.includes('R')) r.R++;
    if (tags.includes('H')) r.H++;
  }
  const executor =
    pack.audience === 'male' ? female : pack.audience === 'female' ? male : Math.min(male, female);
  return { male, female, act, ask, r, executor };
}

/**
 * 取出某个文件在 HEAD 里的旧版本，用来区分「新写的」和「存量的」。
 *
 * 存量手写包本来就写着「男生/女生/老公」，是历史内容，不该被当成新问题；
 * 但**新写**的题必须守规矩 —— 所以只对新增的题面做禁止词/重复检查。
 */
function headBodies(file: string): Set<string> {
  try {
    const src = execFileSync('git', ['show', `HEAD:${file}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const block = src.match(/tasks:\s*\[([\s\S]*?)\n\s*\]/)?.[1] ?? '';
    return new Set([...block.matchAll(/^\s*"(.*)",?\s*$/gm)].map(m => stripTaskTags(m[1])));
  } catch {
    return new Set();
  }
}

/** 旧版文件里的状态池文案，用来判断哪些是存量 */
function headStates(file: string): Set<string> {
  try {
    const src = execFileSync('git', ['show', `HEAD:${file}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const out = new Set<string>();
    for (const key of ['actionStates', 'conditionStates']) {
      const m = src.match(new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\n\\s*\\]`));
      if (!m) continue;
      for (const x of m[1].matchAll(/^\s*"(.*)",?\s*$/gm)) out.add(stripTaskTags(x[1]));
    }
    return out;
  } catch {
    return new Set();
  }
}

const all = [...COUPLE_DEFAULT_THEMES, ...NORMAL_DEFAULT_THEMES];
const globalBodies = new Map<string, string>();
for (const t of all) {
  for (const task of t.tasks) {
    const body = stripTaskTags(task);
    if (!globalBodies.has(body)) globalBodies.set(body, t.name);
  }
}

let problems = 0;
const note = (file: string, msg: string) => {
  problems++;
  console.log(`  ✗ [${basename(file)}] ${msg}`);
};

for (const file of args) {
  const pack = parsePack(file);
  const p = pools(pack);
  const old = headBodies(file);
  console.log(`\n── ${pack.name} (${pack.id}) ${pack.tasks.length} 条 · audience=${pack.audience}`);

  if (pack.tasks.length === 0) note(file, '一条任务都没解析出来（检查 tasks 数组格式）');
  if (!pack.desc) note(file, '缺少 desc');
  // 状态池：存量包本来就有的不算问题，新文件缺了才算
  const oldStates = headStates(file);
  const isNewFile = old.size === 0 && !old.has('');
  if (!pack.actionStates?.length) {
    if (isNewFile) note(file, '缺少 actionStates');
    else console.log('  ⚠️ 这个包本来就没有状态池（存量）');
  }
  if (!pack.conditionStates?.length) {
    if (isNewFile) note(file, '缺少 conditionStates');
    else console.log('  ⚠️ 这个包本来就没有状态池（存量）');
  }

  for (const s of [...(pack.actionStates ?? []), ...(pack.conditionStates ?? [])]) {
    const body = stripTaskTags(s);
    if (oldStates.has(body)) continue;
    if (FORBIDDEN_WORDS.test(body)) note(file, `新写的状态池有禁止词：${body}`);
  }

  let legacy = 0;
  for (const t of pack.tasks) {
    const body = stripTaskTags(t);
    const isNew = !old.has(body);
    if (!isNew) {
      if (FORBIDDEN_WORDS.test(body)) legacy++;
      continue;
    }
    if (FORBIDDEN_WORDS.test(body)) note(file, `新写的题有禁止词：${body}`);
    if (FORBIDDEN_PLACEHOLDER.test(body)) note(file, `占位符残留：${body}`);
    if (FORBIDDEN_THIRD_PARTY.test(body)) note(file, `第三方角色：${body}`);
    const owner = globalBodies.get(body);
    if (owner && owner !== pack.name) note(file, `与「${owner}」重复：${body}`);
  }
  if (legacy > 0) console.log(`  （存量老题 ${legacy} 条含旧式称谓，不在本次检查范围）`);

  const games = p.executor / PER_GAME;
  console.log(
    `  题型 act:${p.act} / ask:${p.ask}   角色 M:${p.male} F:${p.female}   R:${p.r.R} H:${p.r.H}`
  );
  console.log(
    `  执行方池 ${p.executor} → 约够 ${games.toFixed(1)} 局不重复  ${
      p.executor >= 35 ? '✅' : '⚠️ 不足 35'
    }`
  );
}

console.log(problems === 0 ? '\n✅ 全部通过' : `\n❌ ${problems} 处问题`);
process.exit(problems === 0 ? 0 : 1);
