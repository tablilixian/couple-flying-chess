import { GameMode, Theme } from '../../types';

import couplePrelude from './couplePrelude';
import coupleSweet from './coupleSweet';
import coupleWarmup from './coupleWarmup';
import coupleFirewood from './coupleFirewood';
import coupleTemptation from './coupleTemptation';
import coupleUnion from './coupleUnion';
import coupleRoleplay from './coupleRoleplay';
import coupleRewardPunish from './coupleRewardPunish';
import coupleContractLovers from './coupleContractLovers';
import normalTruthDare from './normalTruthDare';
import normalFunChallenges from './normalFunChallenges';
import normalPerformance from './normalPerformance';
import normalMindBender from './normalMindBender';
import normalGroupChaos from './normalGroupChaos';

const RAW_COUPLE_THEMES: Omit<Theme, 'mode'>[] = [
  couplePrelude,
  coupleSweet,
  coupleWarmup,
  coupleFirewood,
  coupleTemptation,
  coupleUnion,
  coupleRoleplay,
  coupleRewardPunish,
  coupleContractLovers
];

const RAW_NORMAL_THEMES: Omit<Theme, 'mode'>[] = [
  normalTruthDare,
  normalFunChallenges,
  normalPerformance,
  normalMindBender,
  normalGroupChaos
];

export const COUPLE_DEFAULT_THEMES: Theme[] = RAW_COUPLE_THEMES.map(theme => ({
  ...theme,
  mode: 'couple' as GameMode
}));

export const NORMAL_DEFAULT_THEMES: Theme[] = RAW_NORMAL_THEMES.map(theme => ({
  ...theme,
  mode: 'normal' as GameMode
}));

export const DEFAULT_THEMES: Theme[] = [
  ...COUPLE_DEFAULT_THEMES,
  ...NORMAL_DEFAULT_THEMES
];
