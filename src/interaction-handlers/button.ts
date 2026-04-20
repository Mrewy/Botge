/** @format */

import {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  LabelBuilder,
  type Client,
  type ButtonInteraction,
  type MessageActionRowComponentBuilder,
  type ModalSubmitInteraction,
  type TextChannel,
  type PermissionsBitField
} from 'discord.js';

import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import {
  PingForPingMeMessageBuilder,
  PING_ME_AS_WELL_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID,
  REMOVE_ME_FROM_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID,
  DELETE_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID
} from '../message-builders/ping-for-ping-me-message-builder.ts';
import {
  TwitchClipMessageBuilder,
  SEND_CLIP_BUTTON_BASE_CUSTOM_ID
} from '../message-builders/twitch-clip-message-builder.ts';
import { EmoteMessageBuilder, DELETE_EMOTE_BUTTON_BASE_CUSTOM_ID } from '../message-builders/emote-message-builder.ts';
import {
  MediaMessageBuilder,
  DELETE_MEDIA_BUTTON_BASE_CUSTOM_ID,
  RENAME_MEDIA_BUTTON_BASE_CUSTOM_ID
} from '../message-builders/media-message-builder.ts';
import {
  QuoteMessageBuilder,
  DELETE_QUOTE_BUTTON_BASE_CUSTOM_ID,
  RENAME_QUOTE_BUTTON_BASE_CUSTOM_ID
} from '../message-builders/quote-message-builder.ts';
import {
  getBaseCustomIdFromCustomId,
  getMessageBuilderTypeFromCustomId,
  getCounterFromCustomId,
  FIRST_BUTTON_BASE_CUSTOM_ID,
  LAST_BUTTON_BASE_CUSTOM_ID,
  PREVIOUS_BUTTON_BASE_CUSTOM_ID,
  NEXT_BUTTON_BASE_CUSTOM_ID,
  JUMP_TO_BUTTON_BASE_CUSTOM_ID
} from '../message-builders/base.ts';

import { getSevenTvEmoteSetLinkFromSevenTvApiUlr } from '../utils/interaction-handlers/get-api-url.ts';
import { booleanToAllowed } from '../utils/boolean-to-string.ts';
import { logError } from '../utils/log-error.ts';

import type { MessageBuilderManager } from '../bot/message-builder-manager.ts';
import type { DatabaseManager } from '../bot/database-manager.ts';

import {
  SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID,
  ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID,
  ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID,
  ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID,
  CONFIGURATION_GUILD_BUTTON_CUSTOM_ID,
  CONFIGURATION_USER_BUTTON_CUSTOM_ID
} from '../command-handlers/settings.ts';

import type {
  TwitchClipMessageBuilderTransformFunctionReturnType,
  EmoteMessageBuilderTransformFunctionReturnType,
  MediaMessageBuilderTransformFunctionReturnType,
  QuoteMessageBuilderTransformFunctionReturnType,
  PingForPingMeMessageBuilderReplies,
  PingForPingListMessageBuilderTransformFunctionReturnType
} from '../types.ts';

import type { Guild } from '../guild.ts';

import type { User } from '../user.ts';

import { Platform } from '../enums.ts';

export const SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID = 'selectSettingsPermittedRolesRoleSelectMenu';
export const SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID =
  'selectAddEmotePermittedRolesRoleSelectMenu' as const;
export const ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID = 'assignEmoteSetsModal' as const;
export const ASSIGN_GUILD_MODAL_CUSTOM_ID = 'assignGuildModal' as const;

export const BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID = 'broadcasterNameTextInput' as const;
export const SEVEN_TV_TEXT_INPUT_CUSTOM_ID = 'sevenTVTextInput' as const;
export const GUILD_ID_TEXT_INPUT_CUSTOM_ID = 'guildIdTextInput' as const;

const MAX_ROLE_SELECT_MENU_VALUES = 10 as const;

const RENAME_MEDIA_MODAL_BASE_CUSTOM_ID = 'renameMediaModal' as const;
const RENAME_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID = 'renameMediaModalNameTextInput' as const;
const RENAME_MEDIA_MODAL_CUSTOM_ID_SEPARATOR = '-' as const;

const RENAME_QUOTE_MODAL_BASE_CUSTOM_ID = 'renameQuoteModal' as const;
const RENAME_QUOTE_MODAL_NAME_TEXT_INPUT_CUSTOM_ID = 'renameQuoteModalNameTextInput' as const;
const RENAME_QUOTE_MODAL_CUSTOM_ID_SEPARATOR = '-' as const;

let RENAME_MEDIA_MODAL_COUNTER = 0;
let RENAME_QUOTE_MODAL_COUNTER = 0;

export function buttonHandler(
  client: Client,
  guild: Readonly<Guild> | undefined,
  user: Readonly<User> | undefined,
  messageBuilderManager: Readonly<MessageBuilderManager>,
  databaseManager: Readonly<DatabaseManager>
) {
  return async (interaction: ButtonInteraction): Promise<EmoteMessageBuilder | undefined> => {
    try {
      const { customId } = interaction;

      if (customId === CONFIGURATION_USER_BUTTON_CUSTOM_ID) {
        const GUILD_ID_TEXT_INPUT = new TextInputBuilder()
          .setCustomId(GUILD_ID_TEXT_INPUT_CUSTOM_ID)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
        if (user !== undefined) GUILD_ID_TEXT_INPUT.setValue(user.guild.id);

        const GUILD_ID_TEXT_INPUT_LABEL = new LabelBuilder()
          .setLabel('Guild ID')
          .setDescription('The ID of the Discord server where you want to get the emotes from.')
          .setTextInputComponent(GUILD_ID_TEXT_INPUT);

        const assignGuildModal = new ModalBuilder()
          .setCustomId(ASSIGN_GUILD_MODAL_CUSTOM_ID)
          .setTitle('Configuration')
          .addLabelComponents(GUILD_ID_TEXT_INPUT_LABEL);

        await interaction.showModal(assignGuildModal);
        return undefined;
      }

      if (guild === undefined) return undefined;

      if (
        customId === SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID ||
        customId === ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID
      ) {
        const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let permittedRoles = guild.settingsPermittedRoleIds;
        let roleSelectMenuCustomId = SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID;
        let commandName = 'settings';

        if (customId === ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID) {
          permittedRoles = guild.addEmotePermittedRoleIds;
          roleSelectMenuCustomId = SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID;
          commandName = 'addemote';
        }

        const roleSelectMenuBuilder = new RoleSelectMenuBuilder()
          .setCustomId(roleSelectMenuCustomId)
          .setPlaceholder('Select roles')
          .setMinValues(0)
          .setMaxValues(MAX_ROLE_SELECT_MENU_VALUES);
        if (permittedRoles !== null) roleSelectMenuBuilder.setDefaultRoles([...permittedRoles]);

        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(roleSelectMenuBuilder);

        await defer;
        await interaction.editReply({
          content: `Select roles which are able to use the ${commandName} command.`,
          components: [row]
        });
        return undefined;
      } else if (customId === ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID) {
        const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });

        guild.toggleAllowEveryoneToAddEmote();
        const { allowEveryoneToAddEmote } = guild;
        databaseManager.permittedRoleIdsDatabase.changeAllowEveryoneToAddEmote(guild.id, allowEveryoneToAddEmote);

        await defer;
        await interaction.editReply(
          `Everyone is ${booleanToAllowed(allowEveryoneToAddEmote)} to use add emote command now.`
        );
        return undefined;
      } else if (customId === ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID) {
        const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const emotes = guild.emoteMatcher.matchSingleArray(
          '',
          Platform.sevenNotInSet,
          undefined,
          undefined,
          undefined,
          undefined,
          true
        );
        if (emotes === undefined) {
          await defer;
          await interaction.editReply('No emotes have been added to this server yet.');
          return undefined;
        }

        const emoteMessageBuilder = new EmoteMessageBuilder(interaction, emotes, undefined, true);
        const reply = emoteMessageBuilder.first();

        await defer;
        if (reply === undefined) return undefined;
        await interaction.editReply(reply);
        return emoteMessageBuilder;
      } else if (customId === CONFIGURATION_GUILD_BUTTON_CUSTOM_ID) {
        const BROADCASTER_NAME_TEXT_INPUT = new TextInputBuilder()
          .setCustomId(BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID)
          .setStyle(TextInputStyle.Short)
          .setRequired(false);
        const BROADCASTER_NAME_TEXT_INPUT_LABEL = new LabelBuilder()
          .setLabel('Streamer Twitch username')
          .setDescription('The Twitch username of the streamer.')
          .setTextInputComponent(BROADCASTER_NAME_TEXT_INPUT);

        const SEVEN_TV_TEXT_INPUT = new TextInputBuilder()
          .setCustomId(SEVEN_TV_TEXT_INPUT_CUSTOM_ID)
          .setStyle(TextInputStyle.Short)
          .setRequired(false);
        const SEVEN_TV_TEXT_INPUT_LABEL = new LabelBuilder()
          .setLabel('7TV Emote Set Link')
          .setDescription("The URL of the streamer's 7TV emote set.")
          .setTextInputComponent(SEVEN_TV_TEXT_INPUT);

        const ASSIGN_EMOTE_SETS_MODAL = new ModalBuilder()
          .setCustomId(ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID)
          .setTitle('Configuration')
          .addLabelComponents(BROADCASTER_NAME_TEXT_INPUT_LABEL, SEVEN_TV_TEXT_INPUT_LABEL);

        if (guild.broadcasterName !== null) BROADCASTER_NAME_TEXT_INPUT.setValue(guild.broadcasterName);

        const { personalEmoteSets } = guild.personalEmoteMatcherConstructor;
        if (personalEmoteSets !== undefined) {
          if (personalEmoteSets.sevenTv !== null)
            SEVEN_TV_TEXT_INPUT.setValue(getSevenTvEmoteSetLinkFromSevenTvApiUlr(personalEmoteSets.sevenTv));
        }

        await interaction.showModal(ASSIGN_EMOTE_SETS_MODAL);
        return undefined;
      }

      const messageBuilderType = getMessageBuilderTypeFromCustomId(customId);
      const counter = getCounterFromCustomId(customId);
      const baseCustomId = getBaseCustomIdFromCustomId(customId);
      const interactionUserId = interaction.user.id;

      if (
        messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingList ||
        messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe
      ) {
        const { pingForPingListMessageBuilders, pingForPingMeMessageBuilders } = messageBuilderManager;

        const messageBuilders = (():
          | readonly Readonly<PingForPingListMessageBuilder>[]
          | readonly Readonly<PingForPingMeMessageBuilder>[]
          | undefined => {
          if (messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe)
            return pingForPingMeMessageBuilders;
          else return pingForPingListMessageBuilders;
        })();
        if (messageBuilders === undefined) {
          await interaction.deferUpdate();
          return undefined;
        }
        const messageBuilderIndex = messageBuilders.findIndex(
          (messageBuilder_: Readonly<PingForPingMeMessageBuilder> | Readonly<PingForPingListMessageBuilder>) =>
            messageBuilder_.counter === counter
        );
        if (messageBuilderIndex === -1) {
          await interaction.deferUpdate();
          return undefined;
        }

        const pingMessageBuilder =
          messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe
            ? pingForPingMeMessageBuilders[messageBuilderIndex]
            : pingForPingListMessageBuilders[messageBuilderIndex].currentPingForPingMeMessageBuilder;
        if (pingMessageBuilder === undefined) {
          await interaction.deferUpdate();
          return undefined;
        }
        const pingMessageBuilderInteraction = pingMessageBuilder.interaction;

        const { pingsDatabase } = databaseManager;
        let pingMessageBuilderReplies: PingForPingMeMessageBuilderReplies | undefined = undefined;
        if (baseCustomId === PING_ME_AS_WELL_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID) {
          pingMessageBuilderReplies = pingMessageBuilder.addUserId(pingsDatabase, interactionUserId);
        } else if (baseCustomId === REMOVE_ME_FROM_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID) {
          pingMessageBuilderReplies = pingMessageBuilder.removeUserId(pingsDatabase, interactionUserId);
        } else if (baseCustomId === DELETE_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID) {
          if (pingMessageBuilderInteraction.user.id !== interactionUserId) {
            await interaction.deferUpdate();
            return undefined;
          }

          pingMessageBuilderReplies = pingMessageBuilder.deletePing(pingsDatabase);
        } else {
          throw new Error('unknown button baseCustomId.');
        }

        const { buttonReply, reply, deletionEvent } = pingMessageBuilderReplies;
        if (buttonReply !== undefined) {
          await interaction.reply({ content: buttonReply, flags: MessageFlags.Ephemeral });
          return undefined;
        }

        await interaction.deferUpdate();
        if (reply === undefined) return undefined;
        else {
          await pingMessageBuilderInteraction.editReply(reply);

          if (deletionEvent) {
            pingMessageBuilder.cleanupPressedMapsJob.cancel();
            if (messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe)
              pingForPingMeMessageBuilders.splice(messageBuilderIndex, 1);
          }
        }
        return undefined;
      }

      const messageBuilders = (():
        | readonly Readonly<PingForPingListMessageBuilder>[]
        | readonly Readonly<TwitchClipMessageBuilder>[]
        | readonly Readonly<EmoteMessageBuilder>[]
        | readonly Readonly<MediaMessageBuilder>[]
        | readonly Readonly<QuoteMessageBuilder>[]
        | undefined => {
        if (messageBuilderType === PingForPingListMessageBuilder.messageBuilderType)
          return messageBuilderManager.pingForPingListMessageBuilders;
        if (messageBuilderType === TwitchClipMessageBuilder.messageBuilderType)
          return messageBuilderManager.twitchClipMessageBuilders;
        else if (messageBuilderType === EmoteMessageBuilder.messageBuilderType)
          return messageBuilderManager.emoteMessageBuilders;
        else if (messageBuilderType === MediaMessageBuilder.messageBuilderType)
          return messageBuilderManager.mediaMessageBuilders;
        else if (messageBuilderType === QuoteMessageBuilder.messageBuilderType)
          return messageBuilderManager.quoteMessageBuilders;
        else return undefined;
      })();
      if (messageBuilders === undefined) {
        await interaction.deferUpdate();
        return undefined;
      }

      const messageBuilderIndex = messageBuilders.findIndex(
        (
          messageBuilder_:
            | Readonly<TwitchClipMessageBuilder>
            | Readonly<EmoteMessageBuilder>
            | Readonly<MediaMessageBuilder>
            | Readonly<QuoteMessageBuilder>
            | Readonly<PingForPingListMessageBuilder>
        ) => messageBuilder_.counter === counter
      );
      if (messageBuilderIndex === -1) {
        await interaction.deferUpdate();
        return undefined;
      }

      const messageBuilder = messageBuilders[messageBuilderIndex];
      const messageBuilderInteraction = messageBuilder.interaction;
      if (messageBuilderInteraction.user.id !== interactionUserId) {
        await interaction.deferUpdate();
        return undefined;
      }

      let reply:
        | EmoteMessageBuilderTransformFunctionReturnType
        | TwitchClipMessageBuilderTransformFunctionReturnType
        | MediaMessageBuilderTransformFunctionReturnType
        | QuoteMessageBuilderTransformFunctionReturnType
        | PingForPingListMessageBuilderTransformFunctionReturnType
        | undefined = undefined;

      if (baseCustomId === PREVIOUS_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.previous();
      } else if (baseCustomId === NEXT_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.next();
      } else if (baseCustomId === FIRST_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.first();
      } else if (baseCustomId === LAST_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.last();
      } else if (baseCustomId === JUMP_TO_BUTTON_BASE_CUSTOM_ID) {
        // ! can't defer, when showing modal
        await interaction.showModal(messageBuilder.modal);
        return undefined;
      } else if (baseCustomId === SEND_CLIP_BUTTON_BASE_CUSTOM_ID) {
        const messageBuilder_ = messageBuilder as Readonly<TwitchClipMessageBuilder>;

        const { channelId } = interaction;
        let channel: TextChannel | undefined = undefined;

        try {
          channel = client.channels.cache.get(channelId) as TextChannel | undefined;
          if (channel === undefined) throw new Error('Channel not found.');
        } catch {
          await interaction.deferUpdate();
          return undefined;
        }

        const interactionGuild = interaction.guild;
        if (interactionGuild === null) {
          await interaction.deferUpdate();
          return undefined;
        }

        const botPermissionsInChannel = ((): Readonly<PermissionsBitField> => {
          if (user === undefined) throw new Error('Bot client user is empty.');

          const botAsMember = interactionGuild.members.cache.get(user.id);
          if (botAsMember === undefined) throw new Error('Bot is not in the guild.');

          const botPermissionsInChannel_ = channel.permissionsFor(botAsMember);
          return botPermissionsInChannel_;
        })();

        if (!botPermissionsInChannel.has('ViewChannel') || !botPermissionsInChannel.has('SendMessages')) {
          await interaction.deferUpdate();
          return undefined;
        }

        await channel.send({ ...messageBuilder_.currentWithSentBy(), allowedMentions: { repliedUser: false } });
        reply = undefined;
      } else if (baseCustomId === DELETE_EMOTE_BUTTON_BASE_CUSTOM_ID) {
        const messageBuilder_ = messageBuilder as Readonly<EmoteMessageBuilder>;
        const { currentAddedEmote } = messageBuilder_;

        if (currentAddedEmote !== undefined) {
          databaseManager.addedEmotesDatabase.delete(currentAddedEmote, guild.id);
          guild.personalEmoteMatcherConstructor.removeSevenTVEmoteNotInSet(currentAddedEmote);
          await guild.refreshEmoteMatcher();
          reply = messageBuilder_.markCurrentAsDeleted();
        } else {
          reply = undefined;
        }
      } else if (baseCustomId === DELETE_MEDIA_BUTTON_BASE_CUSTOM_ID) {
        const messageBuilder_ = messageBuilder as Readonly<MediaMessageBuilder>;
        const { currentMedia } = messageBuilder_;

        if (currentMedia !== undefined) {
          databaseManager.mediaDatabase.delete(interaction.user.id, currentMedia);
          reply = messageBuilder_.markCurrentAsDeleted();
        } else {
          reply = undefined;
        }
      } else if (baseCustomId === DELETE_QUOTE_BUTTON_BASE_CUSTOM_ID) {
        const messageBuilder_ = messageBuilder as Readonly<QuoteMessageBuilder>;
        const { currentQuote } = messageBuilder_;

        if (currentQuote !== undefined) {
          databaseManager.quoteDatabase.delete(interaction.user.id, currentQuote);
          reply = messageBuilder_.markCurrentAsDeleted();
        } else {
          reply = undefined;
        }
      } else if (baseCustomId === RENAME_MEDIA_BUTTON_BASE_CUSTOM_ID) {
        const { mediaDatabase } = databaseManager;

        const messageBuilder_ = messageBuilder as Readonly<MediaMessageBuilder>;
        const { currentMedia } = messageBuilder_;

        if (currentMedia === undefined) return undefined;
        const modalCustomId = `${RENAME_MEDIA_MODAL_BASE_CUSTOM_ID}${RENAME_MEDIA_MODAL_CUSTOM_ID_SEPARATOR}${RENAME_MEDIA_MODAL_COUNTER++}`;
        const modal = new ModalBuilder()
          .setCustomId(modalCustomId)
          .setTitle('Rename Media')
          .addLabelComponents(
            new LabelBuilder()
              .setLabel('New Name')
              .setDescription('The new name of the media.')
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId(RENAME_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID)
                  .setMaxLength(32)
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('namege')
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
        if (modalSubmitInteraction === undefined) return undefined;

        const userId = modalSubmitInteraction.user.id;
        const mediaName = modalSubmitInteraction.fields.getTextInputValue(RENAME_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID);
        if (mediaDatabase.mediaNameExists(userId, mediaName)) {
          await modalSubmitInteraction.reply({
            content: 'There already is a media added with this name.',
            flags: MessageFlags.Ephemeral
          });
          return undefined;
        }

        mediaDatabase.rename(userId, currentMedia.url, mediaName);
        await modalSubmitInteraction.reply({
          content: `Renamed media to ${mediaName}.`,
          flags: MessageFlags.Ephemeral
        });
        return undefined;
      } else if (baseCustomId === RENAME_QUOTE_BUTTON_BASE_CUSTOM_ID) {
        const { quoteDatabase } = databaseManager;

        const messageBuilder_ = messageBuilder as Readonly<QuoteMessageBuilder>;
        const { currentQuote } = messageBuilder_;

        if (currentQuote === undefined) return undefined;
        const modalCustomId = `${RENAME_QUOTE_MODAL_BASE_CUSTOM_ID}${RENAME_QUOTE_MODAL_CUSTOM_ID_SEPARATOR}${RENAME_QUOTE_MODAL_COUNTER++}`;
        const modal = new ModalBuilder()
          .setCustomId(modalCustomId)
          .setTitle('Rename Quote')
          .addLabelComponents(
            new LabelBuilder()
              .setLabel('New Name')
              .setDescription('The new name of the quote.')
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId(RENAME_QUOTE_MODAL_NAME_TEXT_INPUT_CUSTOM_ID)
                  .setMaxLength(32)
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('namege')
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
        if (modalSubmitInteraction === undefined) return undefined;

        const userId = modalSubmitInteraction.user.id;
        const quoteName = modalSubmitInteraction.fields.getTextInputValue(RENAME_QUOTE_MODAL_NAME_TEXT_INPUT_CUSTOM_ID);
        if (quoteDatabase.quoteNameExists(userId, quoteName)) {
          await modalSubmitInteraction.reply({
            content: 'There already is a quote added with this name.',
            flags: MessageFlags.Ephemeral
          });
          return undefined;
        }

        quoteDatabase.rename(userId, currentQuote.content, quoteName);
        await modalSubmitInteraction.reply({
          content: `Renamed quote to ${quoteName}.`,
          flags: MessageFlags.Ephemeral
        });
        return undefined;
      } else {
        throw new Error('unknown button baseCustomId.');
      }

      await interaction.deferUpdate();
      if (reply === undefined) return undefined;
      await messageBuilderInteraction.editReply(reply);
      return undefined;
    } catch (error) {
      logError(error, 'Error at buttonHandler');

      return undefined;
    }
  };
}
