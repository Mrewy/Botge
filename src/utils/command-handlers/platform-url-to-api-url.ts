/** @format */

import { SEVEN_TV_NOT_IN_SET_CDN } from '../../command-handlers/add-emote.ts';
import type { SevenTVEmoteNotInSet } from '../../types.ts';
import { fetchAndJson } from '../fetch-and-json.ts';

export const SPLITTER = '/' as const;

const regExpSevenTVEmoteNotInSet: Readonly<RegExp> = new RegExp(/^https:\/\/7tv\.app\/emotes\/[A-Za-z0-9]+$/);
const regExpOldSevenTVEmoteNotInSet: Readonly<RegExp> = new RegExp(/^https:\/\/old\.7tv\.app\/emotes\/[A-Za-z0-9]+$/);

export async function sevenTVUrlToSevenTVNotInSet(url: string): Promise<SevenTVEmoteNotInSet | undefined> {
  const urlSplit: readonly string[] = url.split(SPLITTER);

  if (!regExpSevenTVEmoteNotInSet.test(url)) if (!regExpOldSevenTVEmoteNotInSet.test(url)) return undefined;

  // TODO: USE REGEX CAPTURE
  const sevenEmoteNotInSetId = urlSplit.at(-1);
  const sevenEmoteNotInSetUrl = `${SEVEN_TV_NOT_IN_SET_CDN}${SPLITTER}${sevenEmoteNotInSetId}`;

  const sevenEmoteNotInSet = (await fetchAndJson(sevenEmoteNotInSetUrl)) as SevenTVEmoteNotInSet;
  return sevenEmoteNotInSet;
}
