/** @format */

import fetch from 'node-fetch';

import { TWITCH_API_ENDPOINTS, type TwitchApi } from '../../api/twitch-api.ts';
import type { TwitchClip, TwitchClips } from '../../types.ts';

type TwitchClientCredentialsGrantFlow = {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: string;
};

export async function getTwitchAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch(TWITCH_API_ENDPOINTS.accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
  });

  if (!response.ok) throw new Error(`Cannot get access token from Twitch: ${response.status}`);

  return ((await response.json()) as TwitchClientCredentialsGrantFlow).access_token;
}

async function transformClipsGameIdFromIdToNameAndTransformCreatedAt(
  twitchApi: Readonly<TwitchApi>,
  twitchClips: TwitchClips
): Promise<TwitchClip[]> {
  const gameIds = new Set(twitchClips.data.map((twitchClip) => twitchClip.game_id));
  const games = await twitchApi.games([...gameIds.keys()]);

  return twitchClips.data.map((twitchClip) => {
    const gameName = games.data.find((game) => game.id === twitchClip.game_id)?.name;
    return {
      ...twitchClip,
      created_at: twitchClip.created_at.split('T')[0],
      game_id: gameName ?? twitchClip.game_id
    };
  });
}

// max 100 ids
export async function getClipsWithGameNameFromIds(
  twitchApi: Readonly<TwitchApi>,
  ids: Readonly<Iterable<string>>
): Promise<TwitchClip[]> {
  const clips = await twitchApi.clipsFromIds(ids);

  return transformClipsGameIdFromIdToNameAndTransformCreatedAt(twitchApi, clips);
}

export async function getClipsWithGameNameFromBroadcasterName(
  twitchApi: Readonly<TwitchApi>,
  broadcasterName: string,
  cursor?: string
): Promise<readonly [TwitchClip[], string | undefined]> {
  const users = await twitchApi.users([broadcasterName]);
  const broadcasterId = users.data[0].id;

  const clips = await twitchApi.clipsFromBroadcasterId(broadcasterId, cursor);
  const transformClipsGameIdFromIdToName_ = await transformClipsGameIdFromIdToNameAndTransformCreatedAt(
    twitchApi,
    clips
  );

  return [transformClipsGameIdFromIdToName_, clips.pagination.cursor];
}
