/** @format */

import type { DatabaseManager } from '../../bot/database-manager.ts';
import type { ApiManager } from '../../bot/api-manager.ts';

import { PersonalEmoteMatcherConstructor } from '../../emote-matcher/emote-matcher-constructor.ts';

import type { PersonalEmoteSets } from '../../emote-matcher/personal-emote-sets.ts';

import { Guild } from '../../discord/guild.ts';

export async function newGuild(
  guildId: string,
  broadcasterName: string | null,
  personalEmoteSets: PersonalEmoteSets | undefined,
  databaseManager: Readonly<DatabaseManager>,
  apiManager: Readonly<ApiManager>
): Promise<Readonly<Guild>> {
  const { permittedRoleIdsDatabase, addedEmotesDatabase } = databaseManager;
  const { twitchClipsMeilisearch } = apiManager;

  permittedRoleIdsDatabase.createTable(guildId);
  addedEmotesDatabase.createTable(guildId);

  const settingsPermittedRoleIds = permittedRoleIdsDatabase.getSettingsPermittedRoleIds(guildId);
  const addEmotePermittedRoleIds = permittedRoleIdsDatabase.getAddEmotePermittedRoleIds(guildId);
  const addEmotePermitNoRole = permittedRoleIdsDatabase.getAddEmotePermitNoRole(guildId);

  const personalEmoteMatcherConstructor = PersonalEmoteMatcherConstructor.create(guildId, personalEmoteSets);
  const emoteMatcher = (await personalEmoteMatcherConstructor).constructEmoteMatcher();
  const twitchClipsMeilisearchIndex = twitchClipsMeilisearch?.getOrCreateIndex(guildId);

  return new Guild(
    guildId,
    broadcasterName,
    await twitchClipsMeilisearchIndex,
    await emoteMatcher,
    await personalEmoteMatcherConstructor,
    settingsPermittedRoleIds,
    addEmotePermittedRoleIds,
    addEmotePermitNoRole
  );
}
