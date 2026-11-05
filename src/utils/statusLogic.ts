import { StatusEffect, StatusSlot, PlayerStatusSlots, Theme, GameMode } from '../types';
import {
  parseStatusString,
  pickStatusForTarget,
  COUPLE_DEFAULT_ACTION_STATES,
  COUPLE_DEFAULT_CONDITION_STATES,
  COUPLE_OPENING_STATES
} from '../data/statePools';

let statusIdCounter = 0;

function generateStatusId(): string {
  return `st_${Date.now().toString(36)}_${(statusIdCounter++).toString(36)}`;
}

/**
 * 状态系统只在情侣模式启用。
 *
 * 状态池（COUPLE_*）全部是成人向文案，而普通模式面向朋友局/聚会局，
 * 题库也是中性的。这里是唯一收口点：普通模式下所有状态入口一律返回 null，
 * 保证普通模式永远拿不到成人状态。
 */
export function isStatusEnabled(mode: GameMode): boolean {
  return mode === 'couple';
}

function pickPoolForSlot(theme: Theme | undefined, slot: StatusSlot): string[] {
  const themePool =
    slot === 'action'
      ? theme?.actionStates
      : theme?.conditionStates;

  if (themePool && themePool.length > 0) {
    return themePool;
  }

  return slot === 'action'
    ? COUPLE_DEFAULT_ACTION_STATES
    : COUPLE_DEFAULT_CONDITION_STATES;
}

export function buildStatus(
  theme: Theme | undefined,
  slot: StatusSlot,
  target: 'male' | 'female',
  mode: GameMode
): StatusEffect | null {
  if (!isStatusEnabled(mode)) return null;

  const pool = pickPoolForSlot(theme, slot);
  const raw = pickStatusForTarget(pool, target);
  if (!raw) return null;

  const parsed = parseStatusString(raw);
  return {
    id: generateStatusId(),
    slot,
    target: parsed.target,
    description: parsed.description,
    tag: parsed.tag,
    sourceThemeId: theme?.id || 'default',
    sourceThemeName: theme?.name || '通用'
  };
}

export function buildOpeningStatus(
  target: 'male' | 'female',
  mode: GameMode
): StatusEffect | null {
  if (!isStatusEnabled(mode)) return null;

  const raw = pickStatusForTarget(COUPLE_OPENING_STATES, target);
  if (!raw) return null;
  const parsed = parseStatusString(raw);
  return {
    id: generateStatusId(),
    slot: 'action',
    target: parsed.target,
    description: parsed.description,
    tag: parsed.tag,
    sourceThemeId: 'opening',
    sourceThemeName: '开局热身'
  };
}

export function applyStatusToSlots(
  current: PlayerStatusSlots,
  newStatus: StatusEffect
): PlayerStatusSlots {
  return { ...current, [newStatus.slot]: newStatus };
}

export function clearStatusSlot(
  current: PlayerStatusSlots,
  slot: StatusSlot
): PlayerStatusSlots {
  return { ...current, [slot]: null };
}
