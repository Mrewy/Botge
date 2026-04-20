/** @format */

// Copyright (c) 2026 Mrewy. All rights reserved. Licensed under the MIT license.
// See LICENSE.txt in the project root for license information.

/**
 * Search emotes, clips, use zero-width emotes and other such commands.
 *
 * @remarks
 * Initializes the {@link Bot} object, registers its listeners and starts it.
 *
 * @packageDocumentation
 */

import { readdir, rm } from 'node:fs/promises';
import { scheduleJob } from 'node-schedule';
import { join } from 'node:path';
import { ensureDir, type Dirent } from 'fs-extra';

import { Meilisearch } from 'meilisearch';
import { Translator } from 'deepl-node';
import OpenAI from 'openai';
import { Client, GatewayIntentBits } from 'discord.js';
import { getVoiceConnections } from '@discordjs/voice';
import initSqlJs from 'sql.js';

import { BroadcasterNameAndPersonalEmoteSetsDatabase } from './database/broadcaster-name-and-personal-emote-sets-database.ts';
import { PermittedRoleIdsDatabase } from './database/permitted-role-ids-database.ts';
import { AddedEmotesDatabase } from './database/added-emotes-database.ts';
import { MediaDatabase } from './database/media-database.ts';
import { PingsDatabase } from './database/pings-database.ts';
import { QuotesDatabase } from './database/quotes-database.ts';
import { UsersDatabase } from './database/users-database.ts';

import { newRedditApi } from './utils/constructors/new-reddit-api.ts';
import { newTwitchApi } from './utils/constructors/new-twitch-api.ts';
import { newGuild } from './utils/constructors/new-guild.ts';
import { registerPings } from './utils/register-pings.ts';
import { logError } from './utils/log-error.ts';

import { TwitchClipsMeilisearch } from './api/twitch-clips-meilisearch.ts';
import { CachedUrl } from './api/cached-url.ts';

import { DatabaseManager } from './bot/database-manager.ts';
import { ApiManager } from './bot/api-manager.ts';
import { Bot } from './bot/bot.ts';

import { GlobalEmoteMatcherConstructor } from './emote-matcher/emote-matcher-constructor.ts';
import type { PersonalEmoteSets } from './emote-matcher/personal-emote-sets.ts';

import type { Guild } from './discord/guild.ts';
import { User } from './discord/user.ts';

import { updateCommands } from './utils/discord/update-commands.ts';

import type { ReadonlyOpenAI, ReadonlyTranslator } from './types.ts';

import { DATABASE_DIR, TMP_DIR } from './directory-paths.ts';

const DATABASE_PATHS = {
  addedEmotes: `${DATABASE_DIR}/addedEmotes.sqlite`,
  pings: `${DATABASE_DIR}/pings.sqlite`,
  permitRoleIds: `${DATABASE_DIR}/permitRoleIds.sqlite`,
  broadcasterNameAndPersonalEmoteSets: `${DATABASE_DIR}/broadcasterNameAndPersonalEmoteSets.sqlite`,
  users: `${DATABASE_DIR}/users.sqlite`,
  media: `${DATABASE_DIR}/media.sqlite`,
  quote: `${DATABASE_DIR}/quote.sqlite`
} as const;
const COMMANDS_PATH = `${DATABASE_DIR}/commands.txt` as const;

/**
 * Ensures that directories exist.
 *
 * @remarks
 *
 * Deletes everything in the {@link TMP_DIR} directory, but not the directory itself.
 */
const ensureDirs = (async (): Promise<void> => {
  await ensureDir(DATABASE_DIR);
  await ensureDir(TMP_DIR);

  await Promise.all(
    (await readdir(TMP_DIR, { withFileTypes: true }))
      .filter((dirent: Readonly<Dirent>) => dirent.isDirectory())
      .map((dirent: Readonly<Dirent>) => dirent.name)
      .map(async (dir) => rm(join(TMP_DIR, dir), { recursive: true }))
  );
})();

/**
 * The central {@link Bot} object.
 *
 * @remarks
 *
 * Gets the environmental variables and constructs each object based on them.
 */
const bot = await (async (): Promise<Readonly<Bot>> => {
  const {
    OPENAI_API_KEY,
    DEEPL_API_KEY,
    TWITCH_CLIENT_ID,
    TWITCH_SECRET,
    REDDIT_CLIENT_ID,
    REDDIT_SECRET,
    MEILISEARCH_HOST,
    MEILI_MASTER_KEY,
    LOCAL_CACHE_BASE
  } = process.env;

  //client
  const client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
  });

  //apiManager
  const twitchClipsMeiliSearch: Readonly<TwitchClipsMeilisearch> | undefined =
    MEILISEARCH_HOST !== undefined && MEILI_MASTER_KEY !== undefined
      ? new TwitchClipsMeilisearch(new Meilisearch({ host: MEILISEARCH_HOST, apiKey: MEILI_MASTER_KEY }))
      : undefined;

  const redditApi =
    REDDIT_CLIENT_ID !== undefined && REDDIT_SECRET !== undefined
      ? newRedditApi(REDDIT_CLIENT_ID, REDDIT_SECRET)
      : undefined;
  const twitchApi =
    TWITCH_CLIENT_ID !== undefined && TWITCH_SECRET !== undefined
      ? newTwitchApi(TWITCH_CLIENT_ID, TWITCH_SECRET)
      : undefined;

  const cachedUrl: Readonly<CachedUrl> = new CachedUrl(LOCAL_CACHE_BASE);

  const translator: ReadonlyTranslator | undefined =
    DEEPL_API_KEY !== undefined ? new Translator(DEEPL_API_KEY) : undefined;
  const openai: ReadonlyOpenAI | undefined =
    OPENAI_API_KEY !== undefined ? new OpenAI({ apiKey: OPENAI_API_KEY }) : undefined;

  const apiManager: Readonly<ApiManager> = new ApiManager(
    twitchClipsMeiliSearch,
    await redditApi,
    await twitchApi,
    cachedUrl,
    translator,
    openai
  );

  //databaseManager
  const sqlJsStatic = await initSqlJs();

  const broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase> =
    new BroadcasterNameAndPersonalEmoteSetsDatabase(DATABASE_PATHS.broadcasterNameAndPersonalEmoteSets, sqlJsStatic);
  const permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase> = new PermittedRoleIdsDatabase(
    DATABASE_PATHS.permitRoleIds,
    sqlJsStatic
  );
  const addedEmotesDatabase: Readonly<AddedEmotesDatabase> = new AddedEmotesDatabase(
    DATABASE_PATHS.addedEmotes,
    sqlJsStatic
  );

  const mediaDatabase: Readonly<MediaDatabase> = new MediaDatabase(DATABASE_PATHS.media, sqlJsStatic);
  const usersDatabase: Readonly<UsersDatabase> = new UsersDatabase(DATABASE_PATHS.users, sqlJsStatic);
  const pingsDatabase: Readonly<PingsDatabase> = new PingsDatabase(DATABASE_PATHS.pings, sqlJsStatic);
  const quoteDatabase: Readonly<QuotesDatabase> = new QuotesDatabase(DATABASE_PATHS.quote, sqlJsStatic);

  const databaseManager: Readonly<DatabaseManager> = new DatabaseManager(
    broadcasterNameAndPersonalEmoteSetsDatabase,
    permittedRoleIdsDatabase,
    addedEmotesDatabase,
    mediaDatabase,
    quoteDatabase,
    pingsDatabase,
    usersDatabase
  );

  //guilds
  // ! needed for newGuild
  await GlobalEmoteMatcherConstructor.createInstance(await twitchApi, addedEmotesDatabase);

  const guilds: readonly Readonly<Guild>[] = await Promise.all(
    broadcasterNameAndPersonalEmoteSetsDatabase
      .getAllBroadcasterNamesAndPersonalEmoteSets()
      .entries()
      .toArray()
      .map(
        async ([guildId, [broadcasterName, personalEmoteSets]]: readonly [
          string,
          readonly [string | null, PersonalEmoteSets]
        ]) => {
          return newGuild(guildId, broadcasterName, personalEmoteSets, databaseManager, apiManager);
        }
      )
  );

  //users
  const users: readonly Readonly<User>[] = usersDatabase
    .getAllUsers()
    .entries()
    .toArray()
    .map(([userId, [guildId]]: readonly [string, readonly [string]]) => {
      const guild = guilds.find((guild_) => guild_.id === guildId);
      if (guild === undefined) throw new Error('Undefined guild while searching for guild for user.');

      return new User(userId, guild);
    });

  return new Bot(client, apiManager, databaseManager, guilds, users);
})();

/**
 * Closes each database and other shutdown functionalities.
 */
function closeFunction(): void {
  try {
    bot.dataBaseManager.closeDatabases();
  } catch (error) {
    logError(error, 'Error at closeFunction - closing databases');
  }

  try {
    const { user } = bot.client;
    if (user === null) return;

    user.setStatus('invisible');
  } catch (error) {
    logError(error, 'Error at closeFunction - setting invisible status');
  }

  try {
    getVoiceConnections().forEach((connection) => {
      connection.destroy();
    });
  } catch (error) {
    logError(error, 'Error at closeFunction - destroying voice connections');
  }
}

process.on('exit', (): void => {
  console.log('exiting');
  closeFunction();
});

process.on('SIGINT', (): void => {
  console.log('received SIGINT');
  closeFunction();
});

process.on('SIGTERM', (): void => {
  console.log('received SIGTERM');
  closeFunction();
});

process.on('uncaughtException', (error: Readonly<Error>): void => {
  console.log(`uncaughtException: ${error.message}`);
});

process.on('unhandledRejection', (error): void => {
  logError(error, 'unhandledRejection');
});

const refreshClipsOrRefreshUniqueCreatorNamesAndGameIds: readonly Promise<void>[] =
  process.env['UPDATE_CLIPS_ON_STARTUP'] === 'true'
    ? bot.guilds.map(async (guild) => guild.refreshClips(bot.apiManager.twitchApi))
    : bot.guilds.map(async (guild) => guild.refreshUniqueCreatorNamesAndGameIds());

scheduleJob('0 */4 * * * *', () => {
  bot.messageBuilderManager.cleanupMessageBuilders();
});

scheduleJob('0 */20 * * * *', async () => {
  await Promise.all(bot.guilds.map(async (guild) => guild.refreshEmoteMatcher()));
});

// update every hour, in the 54th minute 0th second
// this is because of the 300 second timeout of fetch + 1 minute, so twitch api is validated before use
scheduleJob('0 54 * * * *', async () => {
  await bot.apiManager.twitchApi?.validateAndGetNewAccessTokenIfInvalid();
});
scheduleJob('0 54 * * * *', async () => {
  await bot.apiManager.redditApi?.validateAndGetNewAccessTokenIfInvalid();
});

scheduleJob('0 */2 * * *', async () => {
  await Promise.all(bot.guilds.map(async (guild) => guild.refreshClips(bot.apiManager.twitchApi)));
});

scheduleJob('6 */6 * * *', async () => {
  await Promise.all(
    bot.guilds.map(async (guild) => guild.personalEmoteMatcherConstructor.refreshBTTVAndFFZPersonalEmotes())
  );
});

scheduleJob('12 */12 * * *', async () => {
  await GlobalEmoteMatcherConstructor.instance.refreshGlobalEmotes();
});

bot.registerListeners();
await ensureDirs;
await updateCommands(COMMANDS_PATH);
await Promise.all(refreshClipsOrRefreshUniqueCreatorNamesAndGameIds);
await bot.client.login(process.env['DISCORD_TOKEN']);
await registerPings(bot.client, bot.dataBaseManager.pingsDatabase, bot.scheduledJobs);
