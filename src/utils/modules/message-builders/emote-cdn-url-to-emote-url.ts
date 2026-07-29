/** @format */

import type { Platform, AssetInfo } from '../../../types.ts';

import { SEVEN_TV_NOT_IN_SET_CDN } from '../../handlers/command-handlers/platform-url-to-api-url.ts';

const EMOTE_ENDPOINTS: Readonly<Map<Platform, string>> = new Map<Platform, string>([
  ['sevenInSet', 'https://7tv.app/emotes/'],
  ['sevenNotInSet', 'https://7tv.app/emotes/'],
  ['bttv', 'https://betterttv.com/emotes/'],
  ['ffz', 'https://www.frankerfacez.com/emoticon/']
]);

export function emoteCdnUrlToEmoteUrl(asset: AssetInfo): string {
  const { id, name, platform, url } = asset;
  if (platform === 'twitch') return url;

  const emoteEndpoint = EMOTE_ENDPOINTS.get(platform);
  if (emoteEndpoint === undefined) return url;

  const id_ = platform === 'ffz' ? `${id}-${name}` : id;
  return `${emoteEndpoint}${id_}`;
}

export function emoteCdnUrlToEmoteApiCdnUrl(asset: AssetInfo): string | undefined {
  const { id, platform } = asset;
  if (platform !== 'sevenNotInSet') return undefined;

  return `${SEVEN_TV_NOT_IN_SET_CDN}/${id}`;
}
