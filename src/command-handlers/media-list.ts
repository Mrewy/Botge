/** @format */

import fetch from 'node-fetch';

import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

import { getOptionValue } from '../utils/get-option-value.ts';
import { logError } from '../utils/log-error.ts';
import { MediaMessageBuilder } from '../message-builders/media-message-builder.ts';
import type { MediaDatabase } from '../database/media-database.ts';
import type { Guild } from '../discord/guild.ts';
import type { Media } from '../types.ts';

type TenorResponse = {
  readonly results: readonly {
    readonly media_formats: {
      readonly tinygif: { readonly url: string };
    };
  }[];
};

const { TENOR_API_KEY } = process.env;

async function getAllMediaWithTenorUrls(allMedia: readonly Media[]): Promise<readonly Media[]> {
  const tenorIds = allMedia
    .map((media) => {
      const { url } = media;
      if (url.startsWith('https://tenor.com/view/')) return url.split('-').at(-1);
      return undefined;
    })
    .filter((mediaUrl) => mediaUrl !== undefined);
  const tenorUrls: string[] = [];

  for (let index = 0; index < tenorIds.length; index += 50) {
    const idsJoined = tenorIds.slice(index, index + 50).join(',');

    const tenorResponse = (await (
      await fetch(`https://tenor.googleapis.com/v2/posts?key=${TENOR_API_KEY}&ids=${idsJoined}&media_filter=tinygif`)
    ).json()) as TenorResponse;

    tenorResponse.results.forEach((tenorResponseResult) => {
      tenorUrls.push(tenorResponseResult.media_formats.tinygif.url);
    });
  }

  let tenorUrlsIndex = 0;
  return allMedia.map((media) => {
    if (media.url.startsWith('https://tenor.com/view/')) return { ...media, tenorUrl: tenorUrls[tenorUrlsIndex++] };
    return media;
  });
}

export function mediaListHandler(
  mediaDataBase: Readonly<MediaDatabase>,
  mediaMessageBuilders: Readonly<MediaMessageBuilder>[]
) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const sortBy = getOptionValue<string>(interaction, 'sortby');
      const userId = interaction.user.id;
      const allMedia = ((): readonly Media[] => {
        const allMedia_ = mediaDataBase.getAllMedia(userId);

        if (sortBy === 'alphabetical') return [...allMedia_].sort((a, b) => a.name.localeCompare(b.name));
        return allMedia_;
      })();

      if (allMedia.length === 0) {
        await defer;
        await interaction.editReply('You do not have any media added.');
        return;
      }

      const mediaMessageBuilder = new MediaMessageBuilder(
        interaction,
        await getAllMediaWithTenorUrls(allMedia),
        sortBy
      );

      const reply = mediaMessageBuilder.first();
      await defer;

      if (reply === undefined) return;
      await interaction.editReply(reply);
      mediaMessageBuilders.push(mediaMessageBuilder);
    } catch (error) {
      logError(error, 'Error at mediaListHandler');

      await defer;
      await interaction.editReply('Failed to show media list.');
    }
  };
}
