/** @format */

import type { Platform } from '../types.ts';

const SEVEN_IN_SET_STRING = '7TV' as const;
const SEVEN_NOT_IN_SET_STRING = '7TV | Added Emote' as const;
const BTTV_STRING = 'BTTV' as const;
const FFZ_STRING = 'FFZ' as const;
const TWITCH_STRING = 'Twitch' as const;

export function platformStrings(): readonly string[] {
  return [SEVEN_IN_SET_STRING, SEVEN_NOT_IN_SET_STRING, BTTV_STRING, FFZ_STRING, TWITCH_STRING];
}

export function platformToString(platform: Platform): string {
  if (platform === 'sevenInSet') return SEVEN_IN_SET_STRING;
  else if (platform === 'sevenNotInSet') return SEVEN_NOT_IN_SET_STRING;
  else if (platform === 'bttv') return BTTV_STRING;
  else if (platform === 'ffz') return FFZ_STRING;
  return TWITCH_STRING;
}

export function stringToPlatform(platform: string): Platform {
  if (platform === SEVEN_IN_SET_STRING) return 'sevenInSet';
  else if (platform === SEVEN_NOT_IN_SET_STRING) return 'sevenNotInSet';
  else if (platform === BTTV_STRING) return 'bttv';
  else if (platform === FFZ_STRING) return 'ffz';
  return 'twitch';
}
