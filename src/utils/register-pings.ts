/** @format */

import scheduler, { type Job } from 'node-schedule';

import type { Client, TextChannel } from 'discord.js';

import { getContent, ContentType } from '../message-builders/ping-for-ping-me-message-builder.ts';
import { daysAndHoursAndMinutesToMilliseconds } from '../command-handlers/ping-me.ts';
import type { PingsDatabase } from '../database/pings-database.ts';
import { logError } from './log-error.ts';

function millisecondsToHoursAndMinutes(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);

  const hoursText = hours > 0 ? `${hours} hours and ` : '';
  const minutesText = hours === 0 && minutes === 0 ? 'less than a minute' : `${minutes} minute`;

  return `${hoursText}${minutesText}`;
}

export async function registerPings(
  client: Client,
  pingsDataBase: Readonly<PingsDatabase>,
  scheduledJobs: Readonly<Job>[]
): Promise<void> {
  const pings = pingsDataBase.getAll();

  for (const ping of pings) {
    const { time, days, hours, minutes, channelId } = ping;

    const timeMilliseconds = time + daysAndHoursAndMinutesToMilliseconds(days ?? 0, hours ?? 0, minutes ?? 0);
    const pingDate = new Date(timeMilliseconds);

    let channel: TextChannel | undefined = undefined;
    try {
      channel = (await client.channels.fetch(channelId)) as TextChannel;
    } catch {
      return;
    }

    const difference = timeMilliseconds - Date.now();
    const pingedContent = getContent(ping, ContentType.Pinged);
    if (difference > 0) {
      const scheduledJob = scheduler.scheduleJob(pingDate, async () => {
        try {
          await channel.send(pingedContent);
          pingsDataBase.delete(ping);
          const scheduledJobIndex = scheduledJobs.findIndex(
            (scheduledJob_) => scheduledJob_.name === scheduledJob.name
          );
          if (scheduledJobIndex !== -1) scheduledJobs.splice(scheduledJobIndex, 1);
        } catch (error) {
          logError(error, 'Error at a scheduled job from registerPings');
        }
      });
      scheduledJobs.push(scheduledJob);
    } else {
      await channel.send(
        `${pingedContent}\nSorry for the bot downtime! The ping was delivered with a ${millisecondsToHoursAndMinutes(-difference)} delay!`
      );
      pingsDataBase.delete(ping);
    }
  }
}
