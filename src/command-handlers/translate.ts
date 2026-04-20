/** @format */

import type { ChatInputCommandInteraction } from 'discord.js';

import { getOptionValueWithoutUndefined } from '../utils/get-option-value.ts';
import { logError } from '../utils/log-error.ts';
import type { ReadonlyTranslator } from '../types.ts';
import type { Guild } from '../discord/guild.ts';

export function translateHandler(translator: ReadonlyTranslator | undefined) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    if (translator === undefined) {
      void interaction.reply('Translate command is not available right now.');
      return;
    }

    const defer = interaction.deferReply();
    try {
      const text = getOptionValueWithoutUndefined<string>(interaction, 'text');

      const textResult = await translator.translateText(text, null, 'en-US', {
        modelType: 'prefer_quality_optimized',
        formality: 'default'
      });

      await defer;
      await interaction.editReply(textResult.text);
    } catch (error: unknown) {
      logError(error, 'Error at translateHandler');

      await defer;
      await interaction.editReply('Failed to translate.');
    }
  };
}
