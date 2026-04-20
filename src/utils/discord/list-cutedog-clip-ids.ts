/** @format */

import fetch from 'node-fetch';

import type { ReadonlyRegExpExecArray } from '../../types.ts';

const url =
  'https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vSWIkcAv-1T59HWffSdJwn1P4m5Kp4hjIahweIbinW2uO1TPbv2AoYH4QJL5hXL339ll3xua8ir9E8g/pubhtml/sheet?headers=false&gid=1208720498' as const;
const clipPattern1 = /https:\/\/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/g;
const clipPattern2 = /https:\/\/www\.twitch\.tv\/cutedog_\/clip\/([A-Za-z0-9_-]+)/g;

export async function listCutedogClipIds(): Promise<readonly string[]> {
  const html = await (await fetch(url)).text();

  const matches1 = html.matchAll(clipPattern1);
  const matchesArray1: readonly string[] = Array.from(matches1, (match: ReadonlyRegExpExecArray) => match[1]);
  const matches2 = html.matchAll(clipPattern2);
  const matchesArray2: readonly string[] = Array.from(matches2, (match: ReadonlyRegExpExecArray) => match[1]);

  return [...matchesArray1, ...matchesArray2];
}
