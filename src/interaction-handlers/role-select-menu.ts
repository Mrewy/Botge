/** @format */

import { MessageFlags, type RoleSelectMenuInteraction } from 'discord.js';

import type { DatabaseManager } from '../bot/database-manager.ts';

import { logError } from '../utils/log-error.ts';

import type { Guild } from '../discord/guild.ts';
import {
  SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID,
  SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID
} from './button.ts';

export function roleSelectMenuHandler(guild: Readonly<Guild>, databaseManager: Readonly<DatabaseManager>) {
  return async (interaction: RoleSelectMenuInteraction): Promise<void> => {
    const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const { customId, member } = interaction;
      const interactionGuild = interaction.guild;
      if (interactionGuild === null || member === null) return;

      if (
        customId === SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID ||
        customId === SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID
      ) {
        const { permittedRoleIdsDatabase } = databaseManager;

        const roleIds: readonly string[] = interaction.values;

        if (customId === SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID) {
          guild.changeSettingsPermittedRoleIds(roleIds);
          permittedRoleIdsDatabase.changeSettingsPermittedRoleIds(guild.id, roleIds);
        } else {
          guild.changeAddEmotePermittedRoleIds(roleIds);
          permittedRoleIdsDatabase.changeAddEmotePermittedRoleIds(guild.id, roleIds);
        }

        await defer;
        await interaction.editReply('Permitted roles changed.');
      }
    } catch (error) {
      logError(error, 'Error at roleSelectMenuHandler');

      await defer;
      await interaction.editReply('Failed to show role select menu or failed to change permitted roles.');
    }
  };
}
