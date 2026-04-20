/** @format */

import {
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type MessageActionRowComponentBuilder,
  type GuildMember,
  type Role
} from 'discord.js';

import { permitted, administrator, owner, globalAdministrator } from '../utils/command-handlers/permitted.ts';
import { booleanToAllowed } from '../utils/boolean-to-string.ts';
import { logError } from '../utils/log-error.ts';
import type { Guild } from '../discord/guild.ts';

export const SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID = 'settingsPermittedRolesButton' as const;
export const ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID = 'addEmotePermittedRolesButton' as const;
export const ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID = 'allowEveryoneToAddEmoteButton' as const;
export const ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID = 'addedEmoteDeletionMenuButton' as const;
export const CONFIGURATION_GUILD_BUTTON_CUSTOM_ID = 'configurationGuildButton' as const;
export const CONFIGURATION_USER_BUTTON_CUSTOM_ID = 'configurationUserButton' as const;

export function settingsHandler() {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild> | undefined): Promise<void> => {
    const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const { member } = interaction;
      const interactionGuild = interaction.guild;

      if (guild === undefined || interactionGuild === null || member === null) {
        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(CONFIGURATION_USER_BUTTON_CUSTOM_ID)
            .setLabel('Configuration')
            .setStyle(ButtonStyle.Primary)
        );

        await defer;
        await interaction.editReply({ components: [row] });
        return;
      }

      const member_ = member as GuildMember;
      const memberRolesCache: readonly (readonly [string, Role])[] = [...member_.roles.cache];
      const owner_ = owner(member_, interactionGuild);
      const globalAdministrator_ = globalAdministrator(member_);
      if (!permitted(memberRolesCache, guild.settingsPermittedRoleIds) && !owner_ && !globalAdministrator_) {
        await defer;
        await interaction.editReply('You do not have the necessary permissions to use this command.');
        return;
      }

      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
      if (administrator(memberRolesCache) || owner_ || globalAdministrator_) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(CONFIGURATION_GUILD_BUTTON_CUSTOM_ID)
            .setLabel('Configuration')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID)
            .setLabel('Settings permitted roles')
            .setStyle(ButtonStyle.Success)
        );
      }

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID)
          .setLabel('Add emote permitted roles')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID)
          .setLabel(`Allow everyone to add emote (Currently: ${booleanToAllowed(guild.allowEveryoneToAddEmote)})`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID)
          .setLabel('Added emote deletion menu')
          .setStyle(ButtonStyle.Danger)
      );

      await defer;
      await interaction.editReply({ components: [row] });
    } catch (error) {
      logError(error, 'Error at settingsHandler');

      await defer;
      await interaction.editReply('Failed to output settings.');
    }
  };
}
