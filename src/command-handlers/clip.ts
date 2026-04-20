/** @format */

import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

import { getOptionValue } from '../utils/get-option-value.ts';
import { logError } from '../utils/log-error.ts';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import type { TwitchClip, ReadonlyHit } from '../types.ts';
import type { Guild } from '../guild.ts';

function shuffle(array: unknown[]): void {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

const CLEANUP_MINUTES = 10 as const;
const MAX_TWITCH_CLIP_MESSAGE_BUILDERS_LENGTH = 15 as const;
const { EMBED_SERVER_TWITCH } = process.env;

export function clipHandler(twitchClipMessageBuilders: TwitchClipMessageBuilder[]) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const ephemeral = getOptionValue(interaction, 'ephemeral', Boolean) ?? false;
    if (ephemeral && interaction.guild === null) {
      await interaction.reply({ content: 'Ephemeral cannot be used in DMs.', flags: MessageFlags.Ephemeral });
      return;
    }

    const { twitchClipsMeilisearchIndex } = guild;
    if (twitchClipsMeilisearchIndex === undefined) {
      void interaction.reply('clip command is not available in this server.');
      return;
    }
    if (twitchClipMessageBuilders.length >= MAX_TWITCH_CLIP_MESSAGE_BUILDERS_LENGTH) {
      void interaction.reply(
        `${twitchClipMessageBuilders.length} clip commands are currently in use. Please wait at most ${CLEANUP_MINUTES} minutes.`
      );
      return;
    }

    const defer = ephemeral ? interaction.deferReply({ flags: MessageFlags.Ephemeral }) : interaction.deferReply();
    try {
      const title = getOptionValue<string>(interaction, 'title')?.toLowerCase();
      const clipper = getOptionValue<string>(interaction, 'clipper');
      const category = getOptionValue<string>(interaction, 'category');
      const sortBy = getOptionValue<string>(interaction, 'sortby');
      const sortByField = ((): string => {
        if (sortBy === 'views') return 'view_count:desc';
        else if (sortBy === 'shuffle') return sortBy;
        return 'created_at:desc';
      })();

      const filter = ((): string => {
        const filter_: string[] = [];
        const clipperFilter = clipper !== undefined ? `creator_name = ${clipper}` : undefined;
        const gameFilter = category !== undefined ? `game_id = "${category}"` : undefined;

        if (clipperFilter !== undefined) filter_.push(clipperFilter);
        if (gameFilter !== undefined) filter_.push(gameFilter);

        if (filter_.length >= 2) return filter_.join(' AND ');
        else if (filter_.length === 1) return filter_[0];
        return '';
      })();

      const { maxTotalHits } = await twitchClipsMeilisearchIndex.getPagination();
      if (maxTotalHits === null || maxTotalHits === undefined) throw new Error('pagination max total hits not set');

      const search = await twitchClipsMeilisearchIndex.search(title ?? null, {
        filter: filter,
        matchingStrategy: 'all',
        sort: sortByField !== 'shuffle' ? [sortByField] : [],
        limit: maxTotalHits
      });
      const hits: TwitchClip[] = search.hits.map((hit: ReadonlyHit) => hit as TwitchClip);
      if (sortByField === 'shuffle') shuffle(hits);

      if (hits.length === 0) {
        await defer;
        await interaction.editReply('Could not find clip.');
        return;
      } else if (hits.length === 1) {
        const [hit] = hits;
        const reply = EMBED_SERVER_TWITCH !== undefined ? `${EMBED_SERVER_TWITCH}${hit.id}` : hit.url;

        await defer;
        await interaction.editReply(reply);
        return;
      }

      const twitchClipMessageBuilder = new TwitchClipMessageBuilder(interaction, hits, ephemeral);
      const reply = twitchClipMessageBuilder.first();
      await defer;

      if (reply === undefined) return;
      await interaction.editReply(reply);
      twitchClipMessageBuilders.push(twitchClipMessageBuilder);
    } catch (error) {
      logError(error, 'Error at clipHandler');

      await defer;
      await interaction.editReply('Failed to get clip.');
    }
  };
}
