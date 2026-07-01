import { StatusEffect, StatusSlot, StatusTarget, PlayerStatusSlots, Theme } from '../types';
import {
  parseStatusString,
  pickStatusForTarget,
  DEFAULT_ACTION_STATES,
  DEFAULT_CONDITION_STATES,
  OPENING_STATES
} from '../data/statePools';

let statusIdCounter = 0;

function generateStatusId(): string {
  return `st_${Date.now().toString(36)}_${(statusIdCounter++).toString(36)}`;
}

function pickPoolForSlot(
  theme: Theme | undefined,
  slot: StatusSlot,
  target: 'male' | 'female'
): string[] {
  const themePool =
    slot === 'action'
      ? theme?.actionStates
      : theme?.conditionStates;

  if (themePool && themePool.length > 0) {
    return themePool;
  }

  return slot === 'action' ? DEFAULT_ACTION_STATES : DEFAULT_CONDITION_STATES;
}

export function buildStatus(
  theme: Theme | undefined,
  slot: StatusSlot,
  target: 'male' | 'female'
): StatusEffect | null {
  const pool = pickPoolForSlot(theme, slot, target);
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

export function buildOpeningStatus(target: 'male' | 'female'): StatusEffect | null {
  const raw = pickStatusForTarget(OPENING_STATES, target);
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
