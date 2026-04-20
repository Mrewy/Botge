/** @format */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { TWITCH_ACCESS_TOKEN_PATH, TwitchApi } from '../../api/twitch-api.ts';

import { getTwitchAccessToken } from '../api/twitch-api-utils.ts';

export async function newTwitchApi(twitchClientId: string, twitchSecret: string): Promise<Readonly<TwitchApi>> {
  if (existsSync(TWITCH_ACCESS_TOKEN_PATH)) {
    const accessToken = readFileSync(TWITCH_ACCESS_TOKEN_PATH, 'utf-8');
    const twitchApi: Readonly<TwitchApi> = new TwitchApi(twitchClientId, twitchSecret, accessToken);
    await twitchApi.validateAndGetNewAccessTokenIfInvalid();

    return twitchApi;
  }

  const accessToken = await getTwitchAccessToken(twitchClientId, twitchSecret);
  writeFileSync(TWITCH_ACCESS_TOKEN_PATH, accessToken, { encoding: 'utf8', flag: 'w' });
  return new TwitchApi(twitchClientId, twitchSecret, accessToken);
}
