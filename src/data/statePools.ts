export interface ParsedStatus {
  target: 'male' | 'female' | 'both';
  description: string;
  tag: string;
}

export function parseStatusString(text: string): ParsedStatus {
  const trimmed = text.trim();
  if (trimmed.startsWith('[M]')) {
    return { target: 'male', description: trimmed.slice(3).trim(), tag: '[M]' };
  }
  if (trimmed.startsWith('[F]')) {
    return { target: 'female', description: trimmed.slice(3).trim(), tag: '[F]' };
  }
  if (trimmed.startsWith('[both]')) {
    return { target: 'both', description: trimmed.slice(6).trim(), tag: '[both]' };
  }
  return { target: 'both', description: trimmed, tag: '' };
}

export function pickRandomStatus(pool: string[]): string | null {
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

export function pickStatusForTarget(pool: string[], target: 'male' | 'female'): string | null {
  if (!pool || pool.length === 0) return null;
  const eligible = pool.filter(t => {
    const p = parseStatusString(t);
    return p.target === target || p.target === 'both';
  });
  const usePool = eligible.length > 0 ? eligible : pool;
  return usePool[Math.floor(Math.random() * usePool.length)] || null;
}

// ════════════════════════════════════════════
// 通用保底状态池（主题无专属状态时使用）
// ════════════════════════════════════════════

export const DEFAULT_ACTION_STATES: string[] = [
  "[M] 每次掷骰前，隔着裤子摸自己阴茎 5 下",
  "[M] 每次掷骰前，把手伸进裤子里握住阴茎 10 秒",
  "[M] 每次掷骰前，用力捏自己乳头 3 下",
  "[F] 每次掷骰前，隔着内裤揉自己阴蒂 5 下",
  "[F] 每次掷骰前，揉搓自己乳房 5 下",
  "[F] 每次掷骰前，把手伸进内裤里抚摸阴唇 10 秒",
  "[both] 每次掷骰前，深吻对方 5 秒",
  "[both] 每次掷骰前，互相抚摸对方大腿 5 秒",
  "[both] 每次掷骰前，脱掉自己的一件衣物再掷骰",
  "[both] 每次掷骰前，在对方耳边说一句脏话情话"
];

export const DEFAULT_CONDITION_STATES: string[] = [
  "[M] 保持下身裸露——裤子拉链拉开，阴茎保持可见",
  "[M] 阴茎保持半勃起状态，对方可随时伸手检查",
  "[F] 保持上身裸露——上衣解开或脱掉",
  "[F] 阴蒂保持暴露——内裤脱到一边或脱掉",
  "[both] 双方保持身体接触——至少手牵手或腿贴腿",
  "[both] 眼睛被蒙住——用丝巾或领带蒙眼继续游戏",
  "[both] 双手被绑在背后（用领带/丝巾，松紧适度）",
  "[both] 跪着玩游戏——坐垫可以跪，但不许坐着"
];

// ════════════════════════════════════════════
// 开场状态池（游戏开始时随机抽一条赋给双方）
// ════════════════════════════════════════════

export const OPENING_STATES: string[] = [
  "[M] 每次掷骰前，隔着裤子摸自己阴茎 5 下",
  "[F] 每次掷骰前，隔着内裤揉自己阴蒂 5 下",
  "[both] 每次掷骰前，深吻对方 5 秒",
  "[both] 每次掷骰前，脱掉自己的一件衣物再掷骰",
  "[M] 每次掷骰前，对着对方挺起胸膛展示自己",
  "[F] 每次掷骰前，对着对方翘起臀部展示自己",
];
