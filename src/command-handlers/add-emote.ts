/** @format */

import type { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';

import { sevenTVUrlToSevenTVNotInSet, SPLITTER } from '../utils/command-handlers/platform-url-to-api-url.ts';
import { permitted, owner, globalAdministrator } from '../utils/command-handlers/permitted.ts';
import { getOptionValue, getOptionValueWithoutUndefined } from '../utils/get-option-value.ts';
import { fetchAndJson } from '../utils/fetch-and-json.ts';
import { logError } from '../utils/log-error.ts';
import type { AddedEmotesDatabase } from '../database/added-emotes-database.ts';
import type { AddedEmote, SevenTVEmoteNotInSet } from '../types.ts';
import type { Guild } from '../discord/guild.ts';

export const SEVEN_TV_NOT_IN_SET_CDN = 'https://7tv.io/v3/emotes' as const;

export function addEmoteHandlerSevenTVNotInSet(addedEmotesDatabase: Readonly<AddedEmotesDatabase>) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const defer = interaction.deferReply();
    try {
      const { member } = interaction;
      const interactionGuild = interaction.guild;
      if (interactionGuild === null || member === null) return;

      const member_ = member as GuildMember;
      const memberRolesCache: readonly (readonly [string, Role])[] = [...member_.roles.cache];
      if (
        !guild.allowEveryoneToAddEmote &&
        !permitted(memberRolesCache, guild.addEmotePermittedRoleIds) &&
        !owner(member_, interactionGuild) &&
        !globalAdministrator(member_)
      ) {
        await defer;
        await interaction.editReply('You do not have the necessary permissions to use this command.');
        return;
      }

      const url = getOptionValueWithoutUndefined<string>(interaction, 'url');
      const name = getOptionValue<string>(interaction, 'name') ?? null;

      const sevenTVUrlToSevenNotInSet_ = await sevenTVUrlToSevenTVNotInSet(url);
      if (sevenTVUrlToSevenNotInSet_ === undefined) {
        await defer;
        await interaction.editReply('Invalid URL.');

        return;
      }

      if (guild.emoteMatcher.matchSingleExact(name ?? sevenTVUrlToSevenNotInSet_.name)) {
        await defer;
        await interaction.editReply('There is already an emote with the same name.');

        return;
      }

      const emoteId = url.split(SPLITTER).at(-1);
      const addedEmote: AddedEmote = { url: `${SEVEN_TV_NOT_IN_SET_CDN}${SPLITTER}${emoteId}`, alias: name };
      const addedEmotes = addedEmotesDatabase.getAll(guild.id);
      if (addedEmotes.some((addedEmote_) => addedEmote_.url === addedEmote.url)) {
        await defer;
        await interaction.editReply('There is already an emote with the same URL.');

        return;
      }

      addedEmotesDatabase.insert(addedEmote, guild.id);

      const sevenTVEmoteNotInSet = await (async (): Promise<SevenTVEmoteNotInSet> => {
        const sevenTVEmoteNotInSet_ = (await fetchAndJson(addedEmote.url)) as SevenTVEmoteNotInSet;

        if (name !== null) return { ...sevenTVEmoteNotInSet_, name: name };
        else return sevenTVEmoteNotInSet_;
      })();

      guild.personalEmoteMatcherConstructor.addSevenTVEmoteNotInSet(sevenTVEmoteNotInSet);
      guild.emoteMatcher.addSevenTVEmoteNotInSetSuffix(sevenTVEmoteNotInSet);

      await defer;
      await interaction.editReply(
        `Added emote ${sevenTVUrlToSevenNotInSet_.name}${name !== null ? ` with the name ${name}` : ''}.`
      );
    } catch (error) {
      logError(error, 'Error at addEmoteHandlerSevenNotInSet');

      await defer;
      await interaction.editReply('Failed to add emote.');
    }
  };
}
