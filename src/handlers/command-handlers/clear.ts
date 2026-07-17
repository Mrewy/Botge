/** @format */

import {
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  LabelBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
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
    try {
      const interactionGuild = interaction.guild;

      if (interactionGuild === null) {
        await interaction.reply({
          content: 'The bot had to have been added as a server bot for this command to work.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const member_ = interaction.member as GuildMember;
      // const memberRolesCache: readonly (readonly [string, Role])[] = [...member_.roles.cache];

      if (
        !owner(member_, interactionGuild)
        // && !administrator(memberRolesCache)
        && !globalAdministrator(member_)
      ) {
        await interaction.reply({
          content: 'You do not have permission to use this command.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      let channel: TextChannel | undefined = undefined;
      try {
        channel = client.channels.cache.get(interaction.channelId) as TextChannel | undefined;
        if (channel === undefined) throw new Error('Channel not found.');
      } catch {
        await interaction.reply({
          content: 'The command can only be used in a text channel.',
          flags: MessageFlags.Ephemeral
        });
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
        || !botPermissionsInChannel.has('ReadMessageHistory')
      ) {
        await interaction.reply({
          content:
            'The bot does not have the permissions to either: view channel, send messages, manage messages or read message history.\n(Replying to command is different from sending messages.)',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const modalCustomId = 'clearMessageModal';
      const areYouSureAnswerTextInputCustomId = 'areYouSure';
      const modal = new ModalBuilder()
        .setCustomId(modalCustomId)
        .setTitle('Are You Sure?')
        .addLabelComponents(
          new LabelBuilder()
            .setLabel('Clear Messages')
            .setDescription("Type 'Yes' to confirm.")
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId(areYouSureAnswerTextInputCustomId)
                .setMaxLength(3)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Yes')
                .setRequired(true)
            )
        );
      await interaction.showModal(modal);

      const modalSubmitInteraction = await interaction
        .awaitModalSubmit({
          filter: (modalSubmitInteraction_: ModalSubmitInteraction): boolean =>
            modalSubmitInteraction_.customId === modalCustomId,
          time: 60000
        })
        .catch(() => undefined); //timeout catch
      if (modalSubmitInteraction === undefined) return;

      const areYouSureAnswer = modalSubmitInteraction.fields.getTextInputValue(
        areYouSureAnswerTextInputCustomId
      );
      if (areYouSureAnswer !== 'Yes') {
        await modalSubmitInteraction.reply({
          content: 'Clear messages aborted.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await modalSubmitInteraction.deferReply({ flags: MessageFlags.Ephemeral });

      let messages: Readonly<Collection<string, Readonly<Message<true>>>>;
      do {
        messages = await channel.messages.fetch({ limit: 5 });

        const messageDeletes: Promise<void>[] = [];
        for (const [messageId] of messages)
          messageDeletes.push(channel.messages.delete(messageId).catch(() => undefined));

        await Promise.all(messageDeletes);
      } while (messages.size > 0);

      await modalSubmitInteraction.editReply('Cleared messages.');
      return;
    } catch (error) {
      logError(error, 'Error at clearHandler');

      if (interaction.replied) return; // if the error happens after interaction.showModal()

      await interaction.reply({
        content: 'Failed to clear messages.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  };
}
