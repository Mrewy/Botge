/** @format */

import { Platform } from '../../enums.ts';
import type {
  SevenTVEmoteFile,
  SevenTVEmoteInSet,
  SevenTVEmoteNotInSet,
  BTTVEmote,
  FFZEmote,
  TwitchEmote,
  AssetInfo
} from '../../types.ts';

const BTTV_CDN = 'cdn.betterttv.net/emote' as const;
const TWITCH_CDN = 'static-cdn.jtvnw.net/emoticons/v2' as const;

const EMOTE_SIZE = 2 as const;

export function sevenTVInSetToAsset(emote: SevenTVEmoteInSet, size?: number): AssetInfo {
  const { id, name, flags, data, timestamp } = emote;
  const { host, animated } = data;
  const filename = `${size ?? EMOTE_SIZE}x.${animated ? 'gif' : 'png'}`;
  const file = host.files.find((f: SevenTVEmoteFile) => f.name === filename);
  return {
    id: id,
    name: name,
    url: `https:${host.url}/${file?.name}`,
    zeroWidth: !!(1 & flags),
    animated: animated,
    width: file?.width,
    height: file?.height,
    platform: Platform.sevenInSet,
    timestamp: timestamp
  };
}

export function sevenTVNotInSetToAsset(emote: Readonly<SevenTVEmoteNotInSet>, size?: number): AssetInfo {
  const { id, name, flags, host, animated } = emote;
  const filename = `${size ?? EMOTE_SIZE}x.${animated ? 'gif' : 'png'}`;
  const file = host.files.find((f: SevenTVEmoteFile) => f.name === filename);
  return {
    id: id,
    name: name,
    url: `https:${host.url}/${file?.name}`,
    zeroWidth: !!(256 & flags),
    animated: animated,
    width: file?.width,
    height: file?.height,
    platform: Platform.sevenNotInSet,
    timestamp: undefined
  };
}

export function bttvToAsset(emote: BTTVEmote): AssetInfo {
  const { id, code, animated } = emote;
  const filename = `${EMOTE_SIZE}x.${animated ? 'gif' : 'png'}`;
  return {
    id: id,
    name: code,
    url: `https://${BTTV_CDN}/${id}/${filename}`,
    zeroWidth: false,
    animated: animated,
    width: undefined,
    height: undefined,
    platform: Platform.bttv,
    timestamp: undefined
  };
}

export function ffzToAsset(emote: FFZEmote): AssetInfo {
  const { id, name, urls } = emote;
  return {
    id: id,
    name: name,
    url: urls[`${EMOTE_SIZE}`],
    zeroWidth: false,
    animated: false,
    width: undefined,
    height: undefined,
    platform: Platform.ffz,
    timestamp: undefined
  };
}

export function twitchToAsset(emote: TwitchEmote): AssetInfo {
  const { id, name, format, theme_mode } = emote;
  const animated = format.length === 2;
  const chosenFormat = animated ? format[1] : format[0];
  const chosenThemeMode = theme_mode.length === 2 ? theme_mode[1] : theme_mode[0];
  return {
    id: id,
    name: name,
    url: `https://${TWITCH_CDN}/${id}/${chosenFormat}/${chosenThemeMode}/${EMOTE_SIZE}.0`,
    zeroWidth: false,
    animated: animated,
    width: undefined,
    height: undefined,
    platform: Platform.twitch,
    timestamp: undefined
  };
}
