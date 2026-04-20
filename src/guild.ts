/** @format */

import type { EnqueuedTaskPromise, Index } from 'meilisearch';

import { getClipsWithGameNameFromBroadcasterName, getClipsWithGameNameFromIds } from './utils/api/twitch-api-utils.ts';
import { listCutedogClipIds } from './utils/list-cutedog-clip-ids.ts';
import type { TwitchApi } from './api/twitch-api.ts';
import type { PersonalEmoteMatcherConstructor } from './emote-matcher-constructor.ts';
import type { PersonalEmoteSets } from './personal-emote-sets.ts';
import type { ReadonlyRecordAny, TwitchClip } from './types.ts';
import type { EmoteMatcher } from './emote-matcher.ts';
import { GUILD_ID_CUTEDOG } from './guilds.ts';

export class Guild {
  readonly #id: string;
  #broadcasterName: string | null;
  #emoteMatcher: Readonly<EmoteMatcher>;
  readonly #twitchClipsMeilisearchIndex: Index | undefined;
  readonly #personalEmoteMatcherConstructor: Readonly<PersonalEmoteMatcherConstructor>;
  #uniqueCreatorNames: readonly string[] | undefined;
  #uniqueGameIds: readonly string[] | undefined;
  #settingsPermittedRoleIds: readonly string[] | null;
  #addEmotePermittedRoleIds: readonly string[] | null;
  #allowEveryoneToAddEmote: boolean;

  public constructor(
    id: string,
    broadcasterName: string | null,
    twitchClipsMeilisearchIndex: Index | undefined,
    emoteMatcher: Readonly<EmoteMatcher>,
    emoteMatcherConstructor: Readonly<PersonalEmoteMatcherConstructor>,
    settingsPermittedRoleIds: readonly string[] | null,
    addEmotePermittedRoleIds: readonly string[] | null,
    allowEveryoneToAddEmote: boolean
  ) {
    this.#id = id;
    this.#broadcasterName = broadcasterName;
    this.#twitchClipsMeilisearchIndex = twitchClipsMeilisearchIndex;
    this.#emoteMatcher = emoteMatcher;
    this.#personalEmoteMatcherConstructor = emoteMatcherConstructor;
    this.#uniqueCreatorNames = [];
    this.#uniqueGameIds = [];
    this.#settingsPermittedRoleIds = settingsPermittedRoleIds;
    this.#addEmotePermittedRoleIds = addEmotePermittedRoleIds;
    this.#allowEveryoneToAddEmote = allowEveryoneToAddEmote;
  }

  public get id(): string {
    return this.#id;
  }
  public get broadcasterName(): string | null {
    return this.#broadcasterName;
  }
  public get emoteMatcher(): Readonly<EmoteMatcher> {
    return this.#emoteMatcher;
  }
  public get twitchClipsMeilisearchIndex(): Index | undefined {
    return this.#twitchClipsMeilisearchIndex;
  }
  public get personalEmoteMatcherConstructor(): Readonly<PersonalEmoteMatcherConstructor> {
    return this.#personalEmoteMatcherConstructor;
  }
  public get uniqueCreatorNames(): readonly string[] | undefined {
    return this.#uniqueCreatorNames;
  }
  public get uniqueGameIds(): readonly string[] | undefined {
    return this.#uniqueGameIds;
  }

  public get settingsPermittedRoleIds(): readonly string[] | null {
    return this.#settingsPermittedRoleIds;
  }

  public get addEmotePermittedRoleIds(): readonly string[] | null {
    return this.#addEmotePermittedRoleIds;
  }

  public get allowEveryoneToAddEmote(): boolean {
    return this.#allowEveryoneToAddEmote;
  }

  public changeSettingsPermittedRoleIds(roleIds: readonly string[]): void {
    if (roleIds.length === 0) this.#settingsPermittedRoleIds = null;
    this.#settingsPermittedRoleIds = roleIds;
  }

  public changeAddEmotePermittedRoleIds(roleIds: readonly string[]): void {
    if (roleIds.length === 0) this.#addEmotePermittedRoleIds = null;
    this.#addEmotePermittedRoleIds = roleIds;
  }

  public toggleAllowEveryoneToAddEmote(): void {
    this.#allowEveryoneToAddEmote = !this.#allowEveryoneToAddEmote;
  }

  public async refreshEmoteMatcher(): Promise<void> {
    this.#emoteMatcher = await this.#personalEmoteMatcherConstructor.constructEmoteMatcher();
  }

  public async changeBroadcasterNameAndRefreshClips(
    twitchApi: Readonly<TwitchApi> | undefined,
    broadcasterName: string
  ): Promise<void> {
    // ? if (this.#broadcasterName === broadcasterName) return;

    this.#broadcasterName = broadcasterName;
    await this.refreshClips(twitchApi, true);
  }

  public async changePersonalEmoteSetsAndRefreshEmoteMatcher(personalEmoteSets: PersonalEmoteSets): Promise<void> {
    const emoteMatcher_ = await this.#personalEmoteMatcherConstructor.changePersonalEmoteSets(personalEmoteSets);
    if (emoteMatcher_ !== undefined) this.#emoteMatcher = emoteMatcher_;
  }

  public async refreshClips(twitchApi: Readonly<TwitchApi> | undefined, deleteOld?: boolean): Promise<void> {
    if (this.#twitchClipsMeilisearchIndex === undefined || twitchApi === undefined) return;
    if (this.#broadcasterName === null) return;

    this.#uniqueCreatorNames = [];
    this.#uniqueGameIds = [];

    const updateDocumentsQueue: Readonly<EnqueuedTaskPromise>[] = [];
    let updated = 0;

    if (deleteOld !== undefined && deleteOld) await this.#twitchClipsMeilisearchIndex.deleteAllDocuments().waitTask();

    if (this.#id === GUILD_ID_CUTEDOG) {
      // custom clips
      const increment = 100;
      const clipIds = await listCutedogClipIds();

      for (let i = 0; i < clipIds.length; i += increment) {
        const clips = (await getClipsWithGameNameFromIds(twitchApi, clipIds.slice(i, i + increment))).map((clip) => {
          if (clip.game_id === '') return { ...clip, game_id: 'N/A' };
          else return clip;
        });

        updateDocumentsQueue.push(this.#twitchClipsMeilisearchIndex.updateDocuments(clips));
        updated += clips.length;
      }
    } else {
      // get top 1000 most viewed clips
      let getClipsWithGameNameFromBroadcasterName_ = await getClipsWithGameNameFromBroadcasterName(
        twitchApi,
        this.#broadcasterName
      );

      let [clips, cursor] = getClipsWithGameNameFromBroadcasterName_;
      clips = clips.map((clip) => {
        if (clip.game_id === '') return { ...clip, game_id: 'N/A' };
        else return clip;
      });

      updateDocumentsQueue.push(this.#twitchClipsMeilisearchIndex.updateDocuments(clips));
      updated += clips.length;

      for (let i = 0; i < 9 && cursor !== undefined; i++) {
        getClipsWithGameNameFromBroadcasterName_ = await getClipsWithGameNameFromBroadcasterName(
          twitchApi,
          this.#broadcasterName,
          cursor
        );

        [clips, cursor] = getClipsWithGameNameFromBroadcasterName_;
        clips = clips.map((clip) => {
          if (clip.game_id === '') return { ...clip, game_id: 'N/A' };
          else return clip;
        });

        updateDocumentsQueue.push(this.#twitchClipsMeilisearchIndex.updateDocuments(clips));
        updated += clips.length;
      }
    }

    await Promise.all(updateDocumentsQueue.map(async (updateDocuments) => updateDocuments.waitTask()));
    await this.refreshUniqueCreatorNamesAndGameIds();
    console.log(`Updated ${updated} clips.`);
  }

  public async refreshUniqueCreatorNamesAndGameIds(): Promise<void> {
    if (this.#twitchClipsMeilisearchIndex === undefined) return;

    const { maxTotalHits } = await this.#twitchClipsMeilisearchIndex.getPagination();
    if (maxTotalHits === null || maxTotalHits === undefined) throw new Error('pagination max total hits not set');

    const clipsge: readonly TwitchClip[] = (
      await this.#twitchClipsMeilisearchIndex.getDocuments({ limit: maxTotalHits })
    ).results
      .map((record: ReadonlyRecordAny) => record as TwitchClip)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    this.#uniqueCreatorNames = new Set(clipsge.map((clip) => clip.creator_name)).keys().toArray();
    this.#uniqueGameIds = new Set(clipsge.map((clip) => clip.game_id)).keys().toArray();
  }
}
