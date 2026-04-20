/** @format */

import type { Meilisearch, Index } from 'meilisearch';

const INDEX_NAME = 'twitchClips' as const;
const MAX_TOTAL_HITS = 3000 as const;

function getIndexName(guildId: string): string {
  return `${INDEX_NAME}_${guildId}`;
}

export class TwitchClipsMeilisearch {
  readonly #meilisearch: Readonly<Meilisearch>;

  public constructor(meilisearch: Meilisearch) {
    this.#meilisearch = meilisearch;
  }

  public async getOrCreateIndex(guildId: string): Promise<Index | undefined> {
    const indexName = getIndexName(guildId);

    await this.#meilisearch
      .createIndex(indexName, {
        primaryKey: 'id'
      })
      .waitTask();

    const index = await this.#meilisearch.getIndex(indexName);
    await index.updatePagination({ maxTotalHits: MAX_TOTAL_HITS }).waitTask();

    await index.updateSearchableAttributes(['title']).waitTask();
    await index.updateFilterableAttributes(['creator_name', 'game_id']).waitTask();
    await index.updateSortableAttributes(['view_count', 'created_at']).waitTask();

    return index;
  }
}
