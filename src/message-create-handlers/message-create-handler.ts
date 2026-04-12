/** @format */

import type { OmitPartialGroupDMChannel, Message } from 'discord.js';

import type { MediaDatabase } from '../api/media-database.ts';
import type { CachedUrl } from '../api/cached-url.ts';
import { EMOTE_COMMAND_IDENTIFIER, emotesHandler } from '../command-handlers/emote.ts';
import type { Guild } from '../guild.ts';
import { MEDIA_COMMAND_IDENTIFIER, mediaMessageCreateHandler } from './media-message-create-handler.ts';

export function messageCreateHandler() {
  return async (
    cachedUrl: Readonly<CachedUrl>,
    message: OmitPartialGroupDMChannel<Message>,
    guild: Readonly<Guild>,
    mediaDataBase: Readonly<MediaDatabase>
  ): Promise<void> => {
    try {
      const { content } = message;
      if (!content.startsWith(EMOTE_COMMAND_IDENTIFIER) && !content.startsWith(MEDIA_COMMAND_IDENTIFIER)) return;
      if (content[EMOTE_COMMAND_IDENTIFIER.length] === ' ') return;

      if (content.startsWith(EMOTE_COMMAND_IDENTIFIER)) {
        await emotesHandler(cachedUrl)(guild, undefined, message);
      } else if (content.startsWith(MEDIA_COMMAND_IDENTIFIER)) {
        await mediaMessageCreateHandler(message, guild, mediaDataBase);
      }
    } catch (error) {
      console.log(`Error at messageCreateHandler --> ${error instanceof Error ? error.stack : String(error)}`);
    }
  };
}
