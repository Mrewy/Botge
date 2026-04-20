/** @format */

import fetch from 'node-fetch';

import { REDDIT_API_ENDPOINTS } from '../../api/reddit-api.ts';

type RedditClientCredentialsGrantFlow = {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: string;
};

export async function getRedditAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch(REDDIT_API_ENDPOINTS.accessToken, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&scope=read`
  });

  if (!response.ok) throw new Error(`Cannot get access token from Reddit: ${response.status}`);

  return ((await response.json()) as RedditClientCredentialsGrantFlow).access_token;
}
