/** @format */

import type { Job } from 'node-schedule';
import type { ChatInputCommandInteraction, Client, TextChannel } from 'discord.js';

import { getOptionValue } from '../utils/get-option-value.ts';
import { logError } from '../utils/log-error.ts';
import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import type { PingsDatabase } from '../database/pings-database.ts';
import { PING_LIST } from '../discord/commands.ts';
import type { Guild } from '../discord/guild.ts';
import { PingForPingMeMessageBuilder } from '../message-builders/ping-for-ping-me-message-builder.ts';
import { daysAndHoursAndMinutesToMilliseconds } from './ping-me.ts';
import type { Ping } from '../types.ts';

export function pingListHandler(
  pingsDataBase: Readonly<PingsDatabase>,
  pingForPingListMessageBuilders: Readonly<PingForPingListMessageBuilder>[],
  client: Client,
  scheduledJobs: Readonly<Job>[]
) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const defer = interaction.deferReply();
    try {
      const type = getOptionValue<string>(interaction, 'type');
      const timezone = getOptionValue<string>(interaction, 'timezone');

      const pingForPingMeMessageBuilders = ((): readonly PingForPingMeMessageBuilder[] => {
        const interactionChannels = interaction.guild?.channels.cache;
        if (interactionChannels === undefined) return [];

        const pings = ((): readonly Ping[] => {
          const pings_ = pingsDataBase.getAll().filter((ping) => interactionChannels.has(ping.channelId));

          return type === PING_LIST.type.own ? pings_.filter((ping) => ping.userId === interaction.user.id) : pings_;
        })();

        return pings
          .map((ping) => {
            const { time, days, hours, minutes, channelId } = ping;

            let channel: TextChannel | undefined = undefined;
            try {
              channel = client.channels.cache.get(channelId) as TextChannel | undefined;
              if (channel === undefined) return undefined;
            } catch {
              return undefined;
            }

            const timeMilliseconds = time + daysAndHoursAndMinutesToMilliseconds(days ?? 0, hours ?? 0, minutes ?? 0);
            const pingDate = new Date(timeMilliseconds);

            return new PingForPingMeMessageBuilder(
              interaction,
              ping,
              pingDate,
              channel,
              scheduledJobs,
              PingForPingMeMessageBuilder.messageBuilderTypeForPingList
            );
          })
          .filter((pingForPingMeMessageBuilder) => pingForPingMeMessageBuilder !== undefined);
      })();

      if (pingForPingMeMessageBuilders.length === 0) {
        const reply =
          type === PING_LIST.type.own
            ? "You didn't register any pings yet."
            : 'There are no pings registered for this server.';

        await defer;
        await interaction.editReply(reply);
        return;
      }

      const pingForPingListMessageBuilder = new PingForPingListMessageBuilder(
        interaction,
        pingForPingMeMessageBuilders,
        timezone
      );
      pingForPingMeMessageBuilders.forEach((pingForPingMeMessageBuilder_: Readonly<PingForPingMeMessageBuilder>) => {
        pingForPingMeMessageBuilder_.registerPing(pingsDataBase);
      });
      const reply = pingForPingListMessageBuilder.first();
      await defer;

      if (reply === undefined) return;
      await interaction.editReply(reply);
      pingForPingListMessageBuilders.push(pingForPingListMessageBuilder);
    } catch (error) {
      logError(error, 'Error at pingListHandler');

      await defer;
      await interaction.editReply('Failed to show ping list.');
    }
  };
}
