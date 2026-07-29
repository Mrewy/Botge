/** @format */

import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

import { getOptionValueWithoutUndefined } from '../../utils/public/get-option-value.ts';
import { logError } from '../../utils/public/log-error.ts';
import type { QuotesDatabase } from '../../database/quotes-database.ts';
import { GUILD_ID_CUTEDOG, type Guild } from '../../modules/discord/guild.ts';

export function quoteHandler(quoteDataBase: Readonly<QuotesDatabase>) {
  return async (
    interaction: ChatInputCommandInteraction,
    guild: Readonly<Guild>
  ): Promise<void> => {
    try {
      const name = getOptionValueWithoutUndefined<string>(interaction, 'name');
      const quoteContent = ((): string | undefined => {
        const quoteContent_ = quoteDataBase.getQuoteContent(interaction.user.id, name);
        if (quoteContent_ !== undefined) return quoteContent_;

        return quoteDataBase.getQuoteContent(interaction.user.id, name.toLowerCase());
      })();

      const quoteNotFoundReply =
        interaction.guildId === GUILD_ID_CUTEDOG ? 'jij' : 'Quote not found.';

      if (quoteContent === undefined) {
        await interaction.reply({ content: quoteNotFoundReply, flags: MessageFlags.Ephemeral });
        return;
      }

      await interaction.reply(quoteContent);
    } catch (error) {
      logError(error, 'Error at quoteHandler');

      await interaction.reply({
        content: 'Something went wrong. Please try again later.',
        flags: MessageFlags.Ephemeral
      });
    }
  };
}
