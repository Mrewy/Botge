/** @format */

import type { Twemoji } from '@twemoji/api';
const twemoji = await (async (): Promise<Twemoji> => {
  const twemojiModule = await import('@twemoji/api');
  return twemojiModule.default as unknown as Twemoji;
})();

import type { AssetInfo } from '../../../types.ts';
import { Platform } from '../../../enums.ts';
import { sevenTVNotInSetToAsset } from '../../emote-matcher/emote-to-asset.ts';
import { sevenTVUrlToSevenTVNotInSet } from '../platform-url-to-api-url.ts';
import { maxPlatformSize } from './size-change.ts';

const letterToId = new Map<string, string>([
  ['A', '1f1e6'],
  ['B', '1f1e7'],
  ['C', '1f1e8'],
  ['D', '1f1e9'],
  ['E', '1f1ea'],
  ['F', '1f1eb'],
  ['G', '1f1ec'],
  ['H', '1f1ed'],
  ['I', '1f1ee'],
  ['J', '1f1ef'],
  ['K', '1f1f0'],
  ['L', '1f1f1'],
  ['M', '1f1f2'],
  ['N', '1f1f3'],
  ['O', '1f1f4'],
  ['P', '1f1f5'],
  ['Q', '1f1f6'],
  ['R', '1f1f7'],
  ['S', '1f1f8'],
  ['T', '1f1f9'],
  ['U', '1f1fa'],
  ['V', '1f1fb'],
  ['W', '1f1fc'],
  ['X', '1f1fd'],
  ['Y', '1f1fe'],
  ['Z', '1f1ff'],
  ['0', '30-20e3'],
  ['1', '31-20e3'],
  ['2', '32-20e3'],
  ['3', '33-20e3'],
  ['4', '34-20e3'],
  ['5', '35-20e3'],
  ['6', '36-20e3'],
  ['7', '37-20e3'],
  ['8', '38-20e3'],
  ['9', '39-20e3']
]);

function parseSingleLetterOrNumber(token: string): string | undefined {
  const letterToId_ = letterToId.get(token);
  if (letterToId_ === undefined) return undefined;

  return twemoji.base + '72x72' + '/' + letterToId_ + '.png';
}

function parseEmoji(emoji: string): string | undefined {
  const parsedEmoji = twemoji
    .parse(emoji)
    .split(/\s+/)[4]
    .split('=')[1]
    .replace('"', '')
    .replace('"', '')
    .replace('/>', '');

  if (parsedEmoji === emoji) return undefined;
  return parsedEmoji;
}

export async function parseToken(url: string, highestSize: boolean): Promise<AssetInfo | string | undefined> {
  const sevenTVUrlToSevenTVNotInSet_ = await sevenTVUrlToSevenTVNotInSet(url);
  const sevenTVNotInSetToAsset_ =
    sevenTVUrlToSevenTVNotInSet_ !== undefined
      ? highestSize
        ? sevenTVNotInSetToAsset(sevenTVUrlToSevenTVNotInSet_, maxPlatformSize(Platform.sevenNotInSet))
        : sevenTVNotInSetToAsset(sevenTVUrlToSevenTVNotInSet_)
      : undefined;

  if (sevenTVNotInSetToAsset_ !== undefined) return sevenTVNotInSetToAsset_;

  try {
    new URL(url);
    if (url.startsWith('https://tenor.com/view/') && !url.endsWith('.gif')) return url + '.gif';
    else return url;
  } catch {
    try {
      const parseEmoji_ = parseEmoji(url);
      if (parseEmoji_ !== undefined) return parseEmoji_;
    } catch {
      return parseSingleLetterOrNumber(url.toUpperCase());
    }

    return undefined;
  }
}
