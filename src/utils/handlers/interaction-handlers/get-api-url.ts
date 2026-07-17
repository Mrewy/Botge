/** @format */

import type { TwitchApi } from '../../../api/twitch-api.ts';
import type { BTTVPersonalEmotes, FFZPersonalEmotes, SevenTVEmotes } from '../../../types.ts';
import { fetchAndJson } from '../../public/fetch-and-json.ts';

const regExpSevenTvEmoteSetLink: Readonly<RegExp> = new RegExp(
  /^https:\/\/7tv\.app\/emote-sets\/[A-Za-z0-9]{26}$/
);

export type ApiUrlMessage =
  | { readonly type: 'success'; readonly url: string; readonly ownerUsername?: string }
  | { readonly type: 'error'; readonly message: string }
  | { readonly type: 'feedback'; readonly message: string };

export function getSevenTvEmoteSetLinkFromSevenTvApiUlr(sevenTvEmoteSetApiUrl: string): string {
  const emoteSetId = sevenTvEmoteSetApiUrl.split('/').at(-1);
  return `https://7tv.app/emote-sets/${emoteSetId}`;
}

export async function getSevenTvApiUrlFromSevenTvEmoteSetLink(
  sevenTvEmoteSetLink: string
): Promise<ApiUrlMessage> {
  const test = regExpSevenTvEmoteSetLink.test(sevenTvEmoteSetLink);
  if (!test)
    return {
      type: 'error',
      message:
        'Invalid 7TV Emote set link. The link should start with https://7tv.app/emote-sets/ and end with 26 characters.'
    };

  const emoteSetId = sevenTvEmoteSetLink.split('/').at(-1);
  const sevenTvApiUrl = `https://7tv.io/v3/emote-sets/${emoteSetId}`;

  const fetched = await fetchAndJson(sevenTvApiUrl).catch(() => undefined);
  if (fetched === undefined)
    return { type: 'error', message: 'Unknown error at getting 7TV emote set.' };

  const sevenTVEmotes = fetched as SevenTVEmotes;
  if (sevenTVEmotes.error !== undefined) return { type: 'error', message: sevenTVEmotes.error };
  return { type: 'success', url: sevenTvApiUrl, ownerUsername: sevenTVEmotes.owner.username };
}

export async function getBttvApiUrlFromBroadcasterName(
  broadcasterName: string,
  twitchApi: Readonly<TwitchApi> | undefined
): Promise<ApiUrlMessage> {
  if (twitchApi === undefined)
    return {
      type: 'error',
      message: 'The bot is unable to get broadcaster name from Twitch at this time.'
    };

  const users = await twitchApi.users([broadcasterName]).catch(() => undefined);
  if (users === undefined)
    return { type: 'error', message: 'Unknown error at getting broadcaster id from Twitch.' };

  if (users.data.length === 0) return { type: 'error', message: 'No such broadcaster' };

  const userId = users.data[0].id;
  const apiUrl = `https://api.betterttv.net/3/cached/users/twitch/${userId}`;

  const fetched = await fetchAndJson(apiUrl).catch(() => undefined);
  if (fetched === undefined)
    return { type: 'error', message: 'Unknown error at getting BTTV emote set.' };

  const bttvPersonalEmotes = fetched as BTTVPersonalEmotes;
  if (bttvPersonalEmotes.message !== undefined)
    return { type: 'feedback', message: 'Broadcaster does not have BTTV emotes' };
  return { type: 'success', url: apiUrl };
}

export async function getFfzApiUrlFromBroadcasterName(
  broadcasterName: string
): Promise<ApiUrlMessage> {
  const apiUrl = `https://api.frankerfacez.com/v1/room/${broadcasterName.toLowerCase()}`;

  const fetched = await fetchAndJson(apiUrl).catch(() => undefined);
  if (fetched === undefined)
    return { type: 'error', message: 'Unknown error at getting FFZ emote set.' };

  const ffzPersonalEmotes = fetched as FFZPersonalEmotes;
  if (ffzPersonalEmotes.error !== undefined)
    return { type: 'feedback', message: 'Broadcaster does not have FFZ emotes.' };
  return { type: 'success', url: apiUrl };
}
