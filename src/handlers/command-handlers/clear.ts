/** @format */

import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type PermissionsBitField,
  type TextChannel,
  type GuildMember,
  type Collection,
  type Message,
  type Client
} from 'discord.js';

import { owner, globalAdministrator } from '../../utils/handlers/command-handlers/permitted.ts';

import type { Guild } from '../../modules/discord/guild.ts';

import { logError } from '../../utils/public/log-error.ts';

export function clearHandler(client: Client) {
  return async (
    interaction: ChatInputCommandInteraction,
    guild: Readonly<Guild>
  ): Promise<void> => {
    const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const interactionGuild = interaction.guild;

      if (interactionGuild === null) {
        await defer;
        await interaction.editReply(
          'The bot had to have been added as a server bot for this command to work.'
        );
        return;
      }

      const member_ = interaction.member as GuildMember;
      // const memberRolesCache: readonly (readonly [string, Role])[] = [...member_.roles.cache];

      if (
        !owner(member_, interactionGuild)
        // && !administrator(memberRolesCache)
        && !globalAdministrator(member_)
      ) {
        await defer;
        await interaction.editReply('You do not have permission to use this command.');
        return;
      }

      let channel: TextChannel | undefined = undefined;
      try {
        channel = client.channels.cache.get(interaction.channelId) as TextChannel | undefined;
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

      if (
        !botPermissionsInChannel.has('ViewChannel')
        || !botPermissionsInChannel.has('SendMessages')
        || !botPermissionsInChannel.has('ManageMessages')
      ) {
        await defer;
        await interaction.editReply(
          'The bot does not have the permissions to either: view channel, send messages or manage messages.\n(Replying to command is different from sending messages.)'
        );
        return;
      }

      let messages: Readonly<Collection<string, Readonly<Message<true>>>>;
      do {
        messages = await channel.messages.fetch({ limit: 5 });

        const messageDeletes: Promise<void>[] = [];
        for (const [messageId] of messages) messageDeletes.push(channel.messages.delete(messageId));

        await Promise.all(messageDeletes);
      } while (messages.size > 0);

      await defer;
      await interaction.editReply('Cleared messages.');
    } catch (error) {
      logError(error, 'Error at clearHandler');

      await defer;
      await interaction.editReply('Failed to clear messages.');
    }
  };
}
