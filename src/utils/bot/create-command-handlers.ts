/** @format */

import type { Job } from 'node-schedule';

import type { ChatInputCommandInteraction, Client } from 'discord.js';

import { shortestUniqueSubstringsHandler } from '../../command-handlers/shortest-unique-substrings.ts';
import { addEmoteHandlerSevenTVNotInSet } from '../../command-handlers/add-emote.ts';
import { emoteHandler, emoteListHandler } from '../../command-handlers/emote.ts';
import { findTheEmojiHandler } from '../../command-handlers/find-the-emoji.ts';
import { mediaListHandler } from '../../command-handlers/media-list.ts';
import { quoteListHandler } from '../../command-handlers/quote-list.ts';
import { transientHandler } from '../../command-handlers/transient.ts';
import { translateHandler } from '../../command-handlers/translate.ts';
import { pingListHandler } from '../../command-handlers/ping-list.ts';
import { chatgptHandler } from '../../command-handlers/openai.ts';
import { pingMeHandler } from '../../command-handlers/ping-me.ts';
import { mediaHandler } from '../../command-handlers/media.ts';
import { quoteHandler } from '../../command-handlers/quote.ts';
import { steamHandler } from '../../command-handlers/steam.ts';
import { clipHandler } from '../../command-handlers/clip.ts';

import type { MessageBuilderManager } from '../../bot/message-builder-manager.ts';
import type { DatabaseManager } from '../../bot/database-manager.ts';
import type { ApiManager } from '../../bot/api-manager.ts';

import { SLASH_COMMAND_NAMES } from '../../discord/commands.ts';
import type { Guild } from '../../discord/guild.ts';

export type CommandHandler = (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;

export function createCommandHandlers(
  scheduledJobs: Readonly<Job>[],
  client: Client,
  messageBuilderManager: Readonly<MessageBuilderManager>,
  databaseManager: Readonly<DatabaseManager>,
  apiManager: Readonly<ApiManager>
): Map<string, CommandHandler> {
  return new Map<string, CommandHandler>([
    [
      SLASH_COMMAND_NAMES.shortestUniqueSubstrings,
      shortestUniqueSubstringsHandler(messageBuilderManager.emoteMessageBuilders)
    ],
    [SLASH_COMMAND_NAMES.addEmote, addEmoteHandlerSevenTVNotInSet(databaseManager.addedEmotesDatabase)],
    [SLASH_COMMAND_NAMES.emote, emoteHandler()],
    [SLASH_COMMAND_NAMES.emoteList, emoteListHandler(messageBuilderManager.emoteMessageBuilders)],
    [SLASH_COMMAND_NAMES.findTheEmoji, findTheEmojiHandler()],
    [
      SLASH_COMMAND_NAMES.mediaList,
      mediaListHandler(databaseManager.mediaDatabase, messageBuilderManager.mediaMessageBuilders)
    ],
    [
      SLASH_COMMAND_NAMES.quoteList,
      quoteListHandler(databaseManager.quoteDatabase, messageBuilderManager.quoteMessageBuilders)
    ],
    [SLASH_COMMAND_NAMES.transient, transientHandler()],
    [SLASH_COMMAND_NAMES.translate, translateHandler(apiManager.translator)],
    [
      SLASH_COMMAND_NAMES.pingList,
      pingListHandler(
        databaseManager.pingsDatabase,
        messageBuilderManager.pingForPingListMessageBuilders,
        client,
        scheduledJobs
      )
    ],
    [SLASH_COMMAND_NAMES.chatGpt, chatgptHandler(apiManager.openai)],
    [
      SLASH_COMMAND_NAMES.pingMe,
      pingMeHandler(
        databaseManager.pingsDatabase,
        messageBuilderManager.pingForPingMeMessageBuilders,
        client,
        scheduledJobs
      )
    ],
    [SLASH_COMMAND_NAMES.media, mediaHandler(databaseManager.mediaDatabase)],
    [SLASH_COMMAND_NAMES.quote, quoteHandler(databaseManager.quoteDatabase)],
    [SLASH_COMMAND_NAMES.poe2, steamHandler('2694490')],
    [SLASH_COMMAND_NAMES.clip, clipHandler(messageBuilderManager.twitchClipMessageBuilders)]
  ]);
}
