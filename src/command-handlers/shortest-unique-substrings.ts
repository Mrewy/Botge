/** @format */

import type { ChatInputCommandInteraction } from 'discord.js';

import { getOptionValue, getOptionValueWithoutUndefined } from '../utils/get-option-value.ts';
import { logError } from '../utils/log-error.ts';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import type { EmoteMatcher } from '../emote-matcher/emote-matcher.ts';
import type { Guild } from '../discord/guild.ts';

export function getAllSubstrings(str: string): readonly string[] {
  const result: string[] = [];

  for (let i = 0; i < str.length; i++) {
    for (let j = i + 1; j < str.length + 1; j++) {
      result.push(str.slice(i, j));
    }
  }

  return result;
}

export function getShortestUniqueSubstrings(
  em: Readonly<EmoteMatcher>,
  text: string
): readonly [string | undefined, readonly string[] | undefined] {
  const matchSingle_ = em.matchSingle(text);
  if (!matchSingle_) return [undefined, undefined];
  const original = matchSingle_.name;

  const allSubstrings: readonly string[] = getAllSubstrings(original);
  const allSubstringUniqueness: readonly (boolean | undefined)[] = allSubstrings.map((substring) =>
    em.matchSingleUnique(substring, original)
  );

  const uniqueSubstrings: readonly string[] = allSubstrings
    .map((s, i) => {
      if (allSubstringUniqueness[i] !== undefined && allSubstringUniqueness[i]) return s;
      return undefined;
    })
    .filter((s) => s !== undefined);

  const shortestUniqueSubstringLength =
    uniqueSubstrings.length !== 0 ? uniqueSubstrings.reduce((a, b) => (a.length < b.length ? a : b)).length : undefined;

  const shortestUniqueSubstrings: readonly string[] | undefined =
    shortestUniqueSubstringLength !== undefined
      ? uniqueSubstrings.filter((s) => s.length === shortestUniqueSubstringLength)
      : undefined;

  return [original, shortestUniqueSubstrings];
}

export function shortestUniqueSubstringsHandler(emoteMessageBuilders: EmoteMessageBuilder[]) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const { emoteMatcher } = guild;
    const ephemeral = getOptionValue(interaction, 'ephemeral', Boolean) ?? false;
    const defer = ephemeral ? interaction.deferReply({ flags: 'Ephemeral' }) : interaction.deferReply();
    try {
      const emotesOption: readonly string[] = getOptionValueWithoutUndefined<string>(interaction, 'emotes').split(
        /\s+/
      );
      const format = getOptionValue<string>(interaction, 'format');

      const getShortestUniqueSubstrings_: readonly (readonly [string | undefined, readonly string[] | undefined])[] =
        emotesOption.map((emoteOption) => getShortestUniqueSubstrings(emoteMatcher, emoteOption));

      if (format !== undefined) {
        const emotes = emotesOption
          .map((emoteOption) => emoteMatcher.matchSingle(emoteOption))
          .filter((emote) => emote !== undefined);
        if (emotes.length === 0) return undefined;

        const descriptions: readonly string[] = getShortestUniqueSubstrings_
          .filter((getShortestUniqueSubstring_) => getShortestUniqueSubstring_[0] !== undefined)
          .map((getShortestUniqueSubstring_) => getShortestUniqueSubstring_[1])
          .map((shortestUniqueSubstring) => {
            if (shortestUniqueSubstring === undefined) return '-';
            return shortestUniqueSubstring.join(', ');
          });
        if (descriptions.length === 0) return undefined;

        const emoteMessageBuilder = new EmoteMessageBuilder(interaction, emotes, descriptions);
        const reply = emoteMessageBuilder.first();
        if (reply === undefined) return undefined;

        await defer;
        await interaction.editReply(reply);
        emoteMessageBuilders.push(emoteMessageBuilder);
        return;
      }

      let message = '';
      getShortestUniqueSubstrings_.forEach((i: readonly [string | undefined, readonly string[] | undefined], j) => {
        const [original, shortestUniqueSubstrings] = i;
        if (original === undefined) {
          message += `Could not find emote '${emotesOption[j]}'.\n`;
          return;
        }

        if (shortestUniqueSubstrings !== undefined) {
          if (shortestUniqueSubstrings.length === 1) message += `${original}: ${shortestUniqueSubstrings[0]}\n`;
          else message += `${original}: ${shortestUniqueSubstrings.join(', ')}\n`;
        } else {
          message += `${original}: -\n`;
        }

        return;
      });

      await defer;
      await interaction.editReply(message.trim());
      return;
    } catch (error) {
      logError(error, 'Error at shortestUniqueSubstringsHandler');

      await defer;
      await interaction.editReply('failed to provide shortest unique substrings.');
      return;
    }
  };
}
