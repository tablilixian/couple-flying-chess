import { GameMode, Theme } from '../../types';

import couplePrelude from './couplePrelude';
import coupleSweet from './coupleSweet';
import coupleWarmup from './coupleWarmup';
import coupleFirewood from './coupleFirewood';
import coupleTemptation from './coupleTemptation';
import coupleUnion from './coupleUnion';
import coupleRoleplay from './coupleRoleplay';
import coupleRewardPunish from './coupleRewardPunish';
import coupleDominator from './coupleDominator';
import coupleQueen from './coupleQueen';
import coupleContractLovers from './coupleContractLovers';
import couplePublicEyes from './couplePublicEyes';
import coupleLivingRoom from './coupleLivingRoom';
import coupleDeepConfession from './coupleDeepConfession';
import coupleBeyondTheLine from './coupleBeyondTheLine';
import coupleThreeWay from './coupleThreeWay';
import coupleLooseTongue from './coupleLooseTongue';
import coupleChangedHands from './coupleChangedHands';
import coupleSwappedNight from './coupleSwappedNight';
import coupleSeductiveWife from './coupleSeductiveWife';
import coupleFirstFeelings from './coupleFirstFeelings';
import coupleSlowWarmth from './coupleSlowWarmth';
import coupleHiddenHeart from './coupleHiddenHeart';
import coupleFlameProbe from './coupleFlameProbe';
import coupleFlameDaily from './coupleFlameDaily';
import coupleDesireAbyss from './coupleDesireAbyss';
import coupleRoleCast from './coupleRoleCast';
import coupleRoleLost from './coupleRoleLost';
import coupleKinkList from './coupleKinkList';
import coupleKinkBeyond from './coupleKinkBeyond';
import coupleBondFirst from './coupleBondFirst';
import coupleBondDeep from './coupleBondDeep';
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
  coupleDominator,
  coupleQueen,
  coupleContractLovers,
  couplePublicEyes,
  coupleLivingRoom,
  coupleDeepConfession,
  coupleBeyondTheLine,
  coupleThreeWay,
  coupleLooseTongue,
  coupleChangedHands,
  coupleSwappedNight,
  coupleSeductiveWife,
  coupleFirstFeelings,
  coupleSlowWarmth,
  coupleHiddenHeart,
  coupleFlameProbe,
  coupleFlameDaily,
  coupleDesireAbyss,
  coupleRoleCast,
  coupleRoleLost,
  coupleKinkList,
  coupleKinkBeyond,
  coupleBondFirst,
  coupleBondDeep
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
