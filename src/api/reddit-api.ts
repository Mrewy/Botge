/** @format */

import fetch from 'node-fetch';
import { writeFileSync } from 'node:fs';

import {
  REDDIT_API_ENDPOINTS,
  getRedditAccessToken
} from '../utils/api/get-reddit-access-token.ts';
import { fetchAndJson } from '../utils/public/fetch-and-json.ts';

import { DATABASE_DIR } from '../directory-paths.ts';

type RedditGlobalOptions = {
  readonly method: string;
  readonly headers: { readonly Authorization: string };
};

type RedditLivestreamFails = {
  readonly data: {
    readonly children: readonly {
      readonly data: { readonly permalink: string; readonly over_18: boolean };
    }[];
  };
};

export const REDDIT_ACCESS_TOKEN_PATH: 'data/redditAccessToken.txt' =
  `${DATABASE_DIR}/redditAccessToken.txt` as const;

export class RedditApi {
  readonly #clientId: string;
  readonly #secret: string;
  #accessToken: string;

  public constructor(clientId: string, secret: string, accessToken: string) {
    this.#clientId = clientId;
    this.#secret = secret;
    this.#accessToken = accessToken;
  }

  get #apiRequestOptions(): RedditGlobalOptions {
    const optionsTwitchGlobal: RedditGlobalOptions = {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.#accessToken}` }
    };

    return optionsTwitchGlobal;
  }

  public async validateAndGetNewAccessTokenIfInvalid(): Promise<void> {
    const resp = await fetch(REDDIT_API_ENDPOINTS.accessTokenValidate, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.#accessToken}` }
    });

    if (resp.status === 403) {
      this.#accessToken = await getRedditAccessToken(this.#clientId, this.#secret);
      writeFileSync(REDDIT_ACCESS_TOKEN_PATH, this.#accessToken, { encoding: 'utf8', flag: 'w' });
    }
  }

  public async getLivestreamFails(): Promise<RedditLivestreamFails> {
    const query = `hot.json`;
    const query2 = 'limit=5';

    return (await fetchAndJson(
      `${REDDIT_API_ENDPOINTS.livestreamFail}/${query}?${query2}`,
      this.#apiRequestOptions
    )) as RedditLivestreamFails;
  }
}
