/** @format */

import fetch from 'node-fetch';

export const TWITCH_API_ENDPOINTS = {
  accessToken: 'https://id.twitch.tv/oauth2/token',
  accessTokenValidate: 'https://id.twitch.tv/oauth2/validate',
  users: 'https://api.twitch.tv/helix/users',
  games: 'https://api.twitch.tv/helix/games',
  clips: 'https://api.twitch.tv/helix/clips',
  emotesGlobal: 'https://api.twitch.tv/helix/chat/emotes/global'
} as const;

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
