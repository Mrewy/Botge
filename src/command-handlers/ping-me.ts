/** @format */

import type { PermissionsBitField, Client, ChatInputCommandInteraction, TextChannel } from 'discord.js';

import { getOptionValue } from '../utils/get-option-value.ts';
import { logError } from '../utils/log-error.ts';
import { PingForPingMeMessageBuilder } from '../message-builders/ping-for-ping-me-message-builder.ts';
import type { PingsDatabase } from '../database/pings-database.ts';
import type { Guild } from '../discord/guild.ts';
import type { Ping } from '../types.ts';
import type { Job } from 'node-schedule';

export function daysAndHoursAndMinutesToMilliseconds(days: number, hours: number, minutes: number): number {
  return ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
}

export function pingMeHandler(
  pingsDataBase: Readonly<PingsDatabase>,
  pingMessageBuilders: Readonly<PingForPingMeMessageBuilder>[],
  client: Client,
  scheduledJobs: Readonly<Job>[]
) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const defer = interaction.deferReply();
    try {
      const days = getOptionValue(interaction, 'days', Number);
      const hours = getOptionValue(interaction, 'hours', Number);
      const minutes = getOptionValue(interaction, 'minutes', Number);
      const message = getOptionValue<string>(interaction, 'message');

      const interactionGuild = interaction.guild;
      if (interactionGuild === null) {
        await defer;
        await interaction.editReply('The bot had to have been added as a server bot for this command to work.');
        return;
      }

      if (days === undefined && hours === undefined && minutes === undefined) {
        await defer;
        await interaction.editReply('Either days, hours or minutes must be specified.');
        return;
      }

      if (days !== undefined && days < 1) {
        await defer;
        await interaction.editReply('Days must be at least 1.');
        return;
      }

      if (hours !== undefined && hours < 1) {
        await defer;
        await interaction.editReply('Hours must be at least 1.');
        return;
      }

      if (minutes !== undefined && minutes < 1) {
        await defer;
        await interaction.editReply('Minutes must be at least 1.');
        return;
      }

      if (message !== undefined && message.length > 1800) {
        await defer;
        await interaction.editReply('Message must be at most 1800 characters.');
        return;
      }

      const timeNow = Date.now();
      const pingDate = new Date(timeNow + daysAndHoursAndMinutesToMilliseconds(days ?? 0, hours ?? 0, minutes ?? 0));

      const { channelId } = interaction;
      let channel: TextChannel | undefined = undefined;

      try {
        channel = client.channels.cache.get(channelId) as TextChannel | undefined;
        if (channel === undefined) throw new Error('Channel not found.');
      } catch {
        await defer;
        await interaction.editReply('The command can only be used in a text channel.');
        return;
      }

      const botPermissionsInChannel = ((): Readonly<PermissionsBitField> => {
        const { user } = client;
        if (user === null) throw new Error('Bot client user is empty.');

        const botAsMember = interactionGuild.members.cache.get(user.id);
        if (botAsMember === undefined) throw new Error('Bot is not in the guild.');

        const botPermissionsInChannel_ = channel.permissionsFor(botAsMember);
        return botPermissionsInChannel_;
      })();

      if (!botPermissionsInChannel.has('ViewChannel') || !botPermissionsInChannel.has('SendMessages')) {
        await defer;
        await interaction.editReply(
          'The bot does not have the permissions to either view this channel or to send messages in this channel.\n(Replying to command is different from sending messages.)'
        );
        return;
      }

      const userId = interaction.user.id;
      const ping: Ping = {
        time: timeNow,
        days: days ?? null,
        hours: hours ?? null,
        minutes: minutes ?? null,
        userId: userId,
        channelId: channelId,
        message: message ?? null,
        userIds: null,
        userIdRemoved: null
      };

      const pingMessageBuilder = new PingForPingMeMessageBuilder(
        interaction,
        ping,
        pingDate,
        channel,
        scheduledJobs,
        PingForPingMeMessageBuilder.messageBuilderTypeForPingMe
      );
      const reply = pingMessageBuilder.registerPing(pingsDataBase);
      await defer;

      if (reply === undefined) return;
      await interaction.editReply(reply);
      pingMessageBuilders.push(pingMessageBuilder);
    } catch (error) {
      logError(error, 'Error at pingMeHandler');

      await defer;
      await interaction.editReply('Failed to register the ping.');
    }
  };
}
