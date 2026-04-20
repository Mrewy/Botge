/** @format */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { REDDIT_ACCESS_TOKEN_PATH, RedditApi } from '../../api/reddit-api.ts';
import { getRedditAccessToken } from '../api/reddit-api-utils.ts';

export async function newRedditApi(redditClientId: string, redditSecret: string): Promise<Readonly<RedditApi>> {
  if (existsSync(REDDIT_ACCESS_TOKEN_PATH)) {
    const accessToken = readFileSync(REDDIT_ACCESS_TOKEN_PATH, 'utf-8');
    const redditApi: Readonly<RedditApi> = new RedditApi(redditClientId, redditSecret, accessToken);
    await redditApi.validateAndGetNewAccessTokenIfInvalid();

    return redditApi;
  }

  const accessToken = await getRedditAccessToken(redditClientId, redditSecret);
  writeFileSync(REDDIT_ACCESS_TOKEN_PATH, accessToken, { encoding: 'utf8', flag: 'w' });
  return new RedditApi(redditClientId, redditSecret, accessToken);
}
