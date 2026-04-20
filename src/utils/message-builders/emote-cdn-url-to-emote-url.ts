/** @format */

import { SEVEN_TV_NOT_IN_SET_CDN } from '../../command-handlers/add-emote.ts';
import type { AssetInfo } from '../../types.ts';
import { Platform } from '../../enums.ts';

const EMOTE_ENDPOINTS: Readonly<Map<Platform, string>> = new Map<Platform, string>([
  [Platform.sevenInSet, 'https://7tv.app/emotes/'],
  [Platform.sevenNotInSet, 'https://7tv.app/emotes/'],
  [Platform.bttv, 'https://betterttv.com/emotes/'],
  [Platform.ffz, 'https://www.frankerfacez.com/emoticon/']
]);

export function emoteCdnUrlToEmoteUrl(asset: AssetInfo): string {
  const { id, name, platform, url } = asset;
  if (platform === Platform.twitch) return url;

  const emoteEndpoint = EMOTE_ENDPOINTS.get(platform);
  if (emoteEndpoint === undefined) return url;

  const id_ = platform === Platform.ffz ? `${id}-${name}` : id;
  return `${emoteEndpoint}${id_}`;
}

export function emoteCdnUrlToEmoteApiCdnUrl(asset: AssetInfo): string | undefined {
  const { id, platform } = asset;
  if (platform !== Platform.sevenNotInSet) return undefined;

  return `${SEVEN_TV_NOT_IN_SET_CDN}/${id}`;
}
