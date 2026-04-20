/** @format */

import type { AssetInfo } from '../../../types.ts';
import { Platform } from '../../../enums.ts';
import { sevenTVNotInSetToAsset } from '../../emote-matcher/emote-to-asset.ts';
import { sevenTVUrlToSevenTVNotInSet } from '../platform-url-to-api-url.ts';

export function maxPlatformSize(platform: Platform): number {
  if (platform === Platform.bttv || platform === Platform.twitch) return 3;

  return 4;
}

export function emoteSizeChange(url: string, size: number, platform: Platform): string {
  if (size >= 1 && size <= 4) {
    if (platform === Platform.sevenInSet || platform === Platform.sevenNotInSet) {
      return url.replace('/2x', `/${size}x`);
    } else if (platform === Platform.bttv) {
      if (size < 4) return url.replace('/2x', `/${size}x`);
    } else if (platform === Platform.ffz) {
      if (size !== 3) return url.slice(0, -1) + `${size}`;
    } else {
      if (size < 4) return url.replace('/2.0', `/${size}.0`);
    }
  }

  return url;
}

export async function assetSizeChange(asset: AssetInfo, size: number): Promise<AssetInfo> {
  const { url, platform } = asset;

  if (platform === Platform.sevenInSet || platform === Platform.sevenNotInSet) {
    const emoteId = url.split('/').at(-2);
    const sevenUrl = `https://7tv.app/emotes/${emoteId}`;
    const sevenUrlToSevenNotInSet_ = await sevenTVUrlToSevenTVNotInSet(sevenUrl);
    const sevenNotInSetToAsset_ =
      sevenUrlToSevenNotInSet_ !== undefined ? sevenTVNotInSetToAsset(sevenUrlToSevenNotInSet_, size) : undefined;

    return sevenNotInSetToAsset_ ?? asset;
  }

  return asset;
}
