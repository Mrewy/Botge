/** @format */

import fetch from 'node-fetch';

export const REDDIT_API_ENDPOINTS = {
  accessToken: 'https://www.reddit.com/api/v1/access_token',
  accessTokenValidate: 'https://oauth.reddit.com/api/v1/scopes', // there is no real validation path.
  livestreamFail: 'https://oauth.reddit.com/r/LivestreamFail'
} as const;

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
