/** @format */

import type { ChatInputCommandInteraction, GuildEmoji } from 'discord.js';

import { getOptionValue } from '../utils/get-option-value.ts';
import { logError } from '../utils/log-error.ts';
import type { Guild } from '../discord/guild.ts';

const DEFAULT_SIZE = 5 as const;

export function findTheEmojiHandler() {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const defer = interaction.deferReply();
    try {
      const emoji = getOptionValue<string>(interaction, 'emoji');
      const size = getOptionValue(interaction, 'size', Number) ?? DEFAULT_SIZE;

      if (size < 3) {
        await defer;
        await interaction.editReply('Size must be at least 3.');
        return;
      } else if (size > 7) {
        await defer;
        await interaction.editReply('Size must be at most 7.');
        return;
      }

      const interactionGuild = interaction.guild;
      if (interactionGuild === null) {
        await defer;
        await interaction.editReply('The bot must be in a server for this command to work.');
        return;
      }

      const emojiArray: readonly string[] = Array.from(
        (await (await interactionGuild.fetch()).emojis.fetch()).entries()
      )
        .filter((emoji_: readonly [string, GuildEmoji]) => !emoji_[1].animated)
        .map((emoji_: readonly [string, GuildEmoji]) => `<:${emoji_[1].name}:${emoji_[0]}>`);

      if (emojiArray.length < 2) {
        await defer;
        await interaction.editReply('Must have at least 2 non-animated emojis in the server.');
        return;
      }
      if (emoji !== undefined && !emojiArray.some((emoji_) => emoji === emoji_)) {
        await defer;
        await interaction.editReply('Emoji must be from this server.');
        return;
      }

      const findTheEmoji = emoji ?? emojiArray[Math.floor(Math.random() * emojiArray.length)];

      const alignment = ((): string => {
        switch (size) {
          case 3:
            return '               ';
          case 4:
            return '            ';
          case 5:
            return '          ';
          case 6:
            return '      ';
          case 7:
            return '   ';
          default:
            return '';
        }
      })();

      const reply = ((): string => {
        let reply_ = `⬇️ Find the emoji: ${findTheEmoji} ⬇️`;
        reply_ += `\n${alignment}`;

        const findTheEmojiPosition = Math.floor(Math.random() * size * size) + 1;
        for (let i = 1; i <= size * size; i++) {
          if (i !== findTheEmojiPosition) {
            let randomEmoji = emojiArray[Math.floor(Math.random() * emojiArray.length)];
            while (randomEmoji === findTheEmoji)
              randomEmoji = emojiArray[Math.floor(Math.random() * emojiArray.length)];

            reply_ += `||${randomEmoji}||`;
          } else {
            reply_ += `||${findTheEmoji}||`;
          }

          if (i % size === 0) reply_ += `\n${alignment}`;
        }

        return reply_.trim();
      })();

      await defer;
      await interaction.editReply(reply);
    } catch (error) {
      logError(error, 'Error at findTheEmojiHandler');

      await defer;
      await interaction.editReply('Failed to generate the find the emoji grid.');
    }
  };
}
