/** @format */

import type { OmitPartialGroupDMChannel, Message } from 'discord.js';

import type { MediaDatabase } from '../api/media-database.ts';
import { GUILD_ID_CUTEDOG } from '../guilds.ts';
import type { Guild } from '../guild.ts';

export const MEDIA_COMMAND_IDENTIFIER = '.' as const;

export async function mediaMessageCreateHandler(
  message: OmitPartialGroupDMChannel<Message>,
  guild: Readonly<Guild>,
  mediaDataBase: Readonly<MediaDatabase>
): Promise<void> {
  const { member } = message;
  if (member === null) return;

  const mediaName = message.content.trim().slice(MEDIA_COMMAND_IDENTIFIER.length);
  const mediaUrl = ((): string | undefined => {
    const memberId = member.id;

    const mediaUrl_ = mediaDataBase.getMediaUrl(memberId, mediaName);
    if (mediaUrl_ !== undefined) return mediaUrl_;

    return mediaDataBase.getMediaUrl(memberId, mediaName.toLowerCase());
  })();

  if (mediaUrl === undefined) {
    if (guild.id === GUILD_ID_CUTEDOG) {
      await message.react('<:HAH1:1236635745570127892>');
      await message.react('<:HAH2:1236635747449045003>');
      await message.react('<:HAH3:1236635749290610740>');
    } else await message.react('❌');

    return;
  }

  await message.reply({ content: mediaUrl, allowedMentions: { repliedUser: false } });
}
