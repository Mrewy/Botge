/** @format */

import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';

import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import { MediaMessageBuilder } from '../message-builders/media-message-builder.ts';
import {
  getBaseCustomIdFromCustomId,
  getMessageBuilderTypeFromCustomId,
  getCounterFromCustomId,
  getCustomId,
  JUMP_TO_MODAL_BASE_CUSTOM_ID,
  JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID,
  JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID
} from '../message-builders/base.ts';

import type { MessageBuilderManager } from '../bot/message-builder-manager.ts';
import type { DatabaseManager } from '../bot/database-manager.ts';
import type { ApiManager } from '../bot/api-manager.ts';

import {
  getSevenTvApiUrlFromSevenTvEmoteSetLink,
  getBttvApiUrlFromBroadcasterName,
  getFfzApiUrlFromBroadcasterName
} from '../utils/interaction-handlers/get-api-url.ts';
import { booleanToEnabled } from '../utils/boolean-to-string.ts';
import { logError } from '../utils/log-error.ts';

import {
  ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID,
  BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID,
  SEVEN_TV_TEXT_INPUT_CUSTOM_ID,
  ASSIGN_GUILD_MODAL_CUSTOM_ID,
  GUILD_ID_TEXT_INPUT_CUSTOM_ID,
  EMOTE_BORDER_CONFIGURATION_MODAL_CUSTOM_ID,
  EMOTE_BORDER_ENABLED_CHECKBOX_CUSTOM_ID,
  EMOTE_BORDER_COLOR_TEXT_INPUT_CUSTOM_ID
} from './button.ts';

import { PersonalEmoteSets } from '../emote-matcher/personal-emote-sets.ts';

import type { Guild } from '../discord/guild.ts';

import { User } from '../discord/user.ts';

export function modalSubmitHandler(
  guilds: readonly Readonly<Guild>[],
  users: Readonly<User>[],
  guild: Readonly<Guild> | undefined,
  messageBuilderManager: Readonly<MessageBuilderManager>,
  databaseManager: Readonly<DatabaseManager>,
  apiManager: Readonly<ApiManager>
) {
  return async (interaction: ModalSubmitInteraction): Promise<void> => {
    const { customId } = interaction;
    const deferReply =
      customId === ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID ||
      customId === ASSIGN_GUILD_MODAL_CUSTOM_ID ||
      customId === EMOTE_BORDER_CONFIGURATION_MODAL_CUSTOM_ID
        ? interaction.deferReply({ flags: MessageFlags.Ephemeral })
        : undefined;

    try {
      if (customId === ASSIGN_GUILD_MODAL_CUSTOM_ID) {
        const { usersDatabase } = databaseManager;

        const guildId = interaction.fields.getTextInputValue(GUILD_ID_TEXT_INPUT_CUSTOM_ID).trim();
        const userId = interaction.user.id;

        const guild_ = guilds.find((guildge) => guildge.id === guildId);
        if (guild_ === undefined) {
          await deferReply;
          await interaction.editReply('There is no server with this ID in the database. Previous settings unchanged.');
          return;
        }

        let user = users.find((user_) => user_.id === userId);
        if (user !== undefined) {
          await deferReply;
          if (user.guild?.id === guildId) {
            await interaction.editReply('Nothing changed.');
          } else {
            usersDatabase.changeGuildId(userId, guildId);
            user.changeGuild(guild_);
            await interaction.editReply('Changed guild.');
          }
          return;
        }

        user = new User(userId, guild_, undefined, undefined);
        users.push(user);
        usersDatabase.changeGuildId(userId, guildId);
        await deferReply;
        await interaction.editReply('Changed guild.');
        return;
      }

      if (guild === undefined) return;

      if (customId === ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID) {
        const { broadcasterNameAndPersonalEmoteSetsDatabase } = databaseManager;
        const { twitchApi } = apiManager;

        const { id } = guild;

        let broadcasterName: string | null = interaction.fields
          .getTextInputValue(BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID)
          .trim();
        let sevenTv: string | null = interaction.fields.getTextInputValue(SEVEN_TV_TEXT_INPUT_CUSTOM_ID).trim();
        let bttv: string | null = null;
        let ffz: string | null = null;
        let reply = '';

        if (broadcasterName === '') broadcasterName = null;
        if (sevenTv === '') sevenTv = null;
        else {
          const sevenTvApiUrlMessage = await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTv);
          const { type } = sevenTvApiUrlMessage;

          if (type === 'success') {
            const { ownerUsername } = sevenTvApiUrlMessage;

            if (
              broadcasterName !== null &&
              ownerUsername !== undefined &&
              broadcasterName.toLowerCase() !== ownerUsername.toLowerCase()
            ) {
              await deferReply;
              await interaction.editReply('Broadcaster name and 7TV emote set owner does not match.');
              return;
            }

            sevenTv = sevenTvApiUrlMessage.url;
          } else if (type === 'feedback') {
            reply += sevenTvApiUrlMessage.message;
          } else {
            await deferReply;
            await interaction.editReply(sevenTvApiUrlMessage.message);
            return;
          }
        }

        if (broadcasterName !== null) {
          const bttvApiUrlMessage = await getBttvApiUrlFromBroadcasterName(broadcasterName, twitchApi);
          const bttvApiUrlMessageType = bttvApiUrlMessage.type;

          if (bttvApiUrlMessageType === 'success') {
            bttv = bttvApiUrlMessage.url;
          } else if (bttvApiUrlMessageType === 'feedback') {
            reply += `\n${bttvApiUrlMessage.message}`;
          } else {
            await deferReply;
            await interaction.editReply(bttvApiUrlMessage.message);
            return;
          }

          const ffzApiUrlMessage = await getFfzApiUrlFromBroadcasterName(broadcasterName);
          const ffzApiUrlMessageType = ffzApiUrlMessage.type;

          if (ffzApiUrlMessageType === 'success') {
            ffz = ffzApiUrlMessage.url;
          } else if (ffzApiUrlMessageType === 'feedback') {
            reply += `\n${ffzApiUrlMessage.message}`;
          } else {
            await deferReply;
            await interaction.editReply(ffzApiUrlMessage.message);
            return;
          }
        }

        if (broadcasterName !== null && guild.broadcasterName !== broadcasterName) {
          await guild.changeBroadcasterNameAndRefreshClips(twitchApi, broadcasterName);
          broadcasterNameAndPersonalEmoteSetsDatabase.changeBroadcasterName(id, broadcasterName);

          reply += '\nRefreshed clips based on broadcaster name.';
        }

        if (sevenTv !== null || bttv !== null || ffz !== null) {
          const oldPersonalEmoteSets = guild.personalEmoteMatcherConstructor.personalEmoteSets;
          const personalEmoteSets = new PersonalEmoteSets(sevenTv, bttv, ffz);
          await guild.changePersonalEmoteSetsAndRefreshEmoteMatcher(personalEmoteSets);
          broadcasterNameAndPersonalEmoteSetsDatabase.changePersonalEmoteSets(id, personalEmoteSets);

          if (
            (sevenTv !== null && oldPersonalEmoteSets !== undefined && oldPersonalEmoteSets.sevenTv !== sevenTv) ||
            (oldPersonalEmoteSets === undefined && sevenTv !== null)
          )
            reply += '\nChanged 7TV Emote set.';

          if (
            (bttv !== null && oldPersonalEmoteSets !== undefined && oldPersonalEmoteSets.bttv !== bttv) ||
            (oldPersonalEmoteSets === undefined && bttv !== null)
          )
            reply += '\nFound BTTV Emote set from broadcaster name and changed to it.';

          if (
            (ffz !== null && oldPersonalEmoteSets !== undefined && oldPersonalEmoteSets.ffz !== ffz) ||
            (oldPersonalEmoteSets === undefined && ffz !== null)
          )
            reply += '\nFound FFZ Emote set from broadcaster name and changed to it.';
        }

        reply = reply.trim();
        reply = reply === '' ? 'Nothing changed.' : reply;
        await deferReply;
        await interaction.editReply(reply);
        return;
      } else if (customId === EMOTE_BORDER_CONFIGURATION_MODAL_CUSTOM_ID) {
        const { usersDatabase } = databaseManager;

        const userId = interaction.user.id;

        const emoteBorderColorRegex = /^[0-9A-Fa-f]{6}$/;
        //const emoteBorderOpacityRegex = /^(?:0\.[1-9]|1\.0)$/;

        let reply = '';

        const emoteBorderEnabled = interaction.fields.getCheckbox(EMOTE_BORDER_ENABLED_CHECKBOX_CUSTOM_ID);

        const emoteBorderColor = ((): string | undefined => {
          const emoteBorderColor_ = interaction.fields
            .getTextInputValue(EMOTE_BORDER_COLOR_TEXT_INPUT_CUSTOM_ID)
            .trim();

          return emoteBorderColor_ !== '' ? emoteBorderColor_ : undefined;
        })();
        if (emoteBorderColor !== undefined && !emoteBorderColorRegex.test(emoteBorderColor))
          reply += 'The format of the emote border color is incorrect. Format: RRGGBB';

        /*
        const emoteBorderOpacity = ((): string | undefined => {
          const emoteBorderOpacity_ = interaction.fields
            .getTextInputValue(EMOTE_BORDER_OPACITY_TEXT_INPUT_CUSTOM_ID)
            .trim();

          return emoteBorderOpacity_ !== '' ? emoteBorderOpacity_ : undefined;
        })();
        if (emoteBorderOpacity !== undefined && !emoteBorderOpacityRegex.test(emoteBorderOpacity))
          reply += '\nThe format of the emote border opacity is incorrect. Format: a number between 0.1 and 1.0';
        */

        reply = reply.trim();
        if (reply !== '') {
          await deferReply;
          await interaction.editReply(reply);
          return;
        }

        let user = users.find((user_) => user_.id === userId);
        if (user !== undefined) {
          if (user.enableEmoteBorder !== emoteBorderEnabled) {
            reply += `${booleanToEnabled(emoteBorderEnabled)} emote border.`;
            user.changeEnableEmoteBorder(emoteBorderEnabled);
            usersDatabase.changeEnableEmoteBorder(user.id, emoteBorderEnabled);
          }

          if (emoteBorderColor !== undefined && user.emoteBorderColor !== emoteBorderColor) {
            reply += '\nChanged emote border color.';
            user.changeEmoteBorderColor(emoteBorderColor);
            usersDatabase.changeEmoteBorderColor(user.id, emoteBorderColor);
          }

          /*
          if (emoteBorderOpacity !== undefined && user.emoteBorderOpacity !== emoteBorderOpacity) {
            reply += '\nChanged emote border opacity.';
            user.changeEmoteBorderOpacity(emoteBorderOpacity);
            usersDatabase.changeEmoteBorderOpacity(user.id, emoteBorderOpacity);
          }
          */

          await deferReply;
          reply = reply.trim();
          await interaction.editReply(reply !== '' ? reply : 'Nothing changed.');
          return;
        }

        if (!emoteBorderEnabled && emoteBorderColor === undefined) {
          await deferReply;
          await interaction.editReply('Nothing changed.');
          return;
        }

        user = new User(userId, undefined, emoteBorderEnabled, emoteBorderColor);
        users.push(user);

        if (emoteBorderEnabled) {
          reply += 'Enabled emote border.';
          usersDatabase.changeEnableEmoteBorder(userId, emoteBorderEnabled);
        }
        if (emoteBorderColor !== undefined) {
          reply += '\nChanged emote border color.';
          usersDatabase.changeEmoteBorderColor(userId, emoteBorderColor);
        }

        /*
        if (emoteBorderOpacity !== undefined) {
          reply += '\nChanged emote border opacity.';
          usersDatabase.changeEmoteBorderColor(userId, emoteBorderOpacity);
        }
        */

        await deferReply;
        reply = reply.trim();
        await interaction.editReply(reply !== '' ? reply : 'Nothing changed.');
        return;
      }

      const messageBuilderType = getMessageBuilderTypeFromCustomId(customId);
      const messageBuilders = (():
        | readonly Readonly<PingForPingListMessageBuilder>[]
        | readonly Readonly<TwitchClipMessageBuilder>[]
        | readonly Readonly<EmoteMessageBuilder>[]
        | readonly Readonly<MediaMessageBuilder>[]
        | undefined => {
        if (messageBuilderType === PingForPingListMessageBuilder.messageBuilderType)
          return messageBuilderManager.pingForPingListMessageBuilders;
        else if (messageBuilderType === TwitchClipMessageBuilder.messageBuilderType)
          return messageBuilderManager.twitchClipMessageBuilders;
        else if (messageBuilderType === EmoteMessageBuilder.messageBuilderType)
          return messageBuilderManager.emoteMessageBuilders;
        else if (messageBuilderType === MediaMessageBuilder.messageBuilderType)
          return messageBuilderManager.mediaMessageBuilders;
        return undefined;
      })();
      if (messageBuilders === undefined) return;

      const counter = getCounterFromCustomId(customId);
      const messageBuilderIndex = messageBuilders.findIndex(
        (
          messageBuilder:
            | Readonly<TwitchClipMessageBuilder>
            | Readonly<EmoteMessageBuilder>
            | Readonly<PingForPingListMessageBuilder>
            | Readonly<MediaMessageBuilder>
        ) => messageBuilder.counter === counter
      );
      if (messageBuilderIndex === -1) return;

      const messageBuilder = messageBuilders[messageBuilderIndex];
      const messageBuilderInteraction = messageBuilder.interaction;

      const defer = interaction.deferUpdate();
      const baseCustomId = getBaseCustomIdFromCustomId(customId);
      if (baseCustomId !== JUMP_TO_MODAL_BASE_CUSTOM_ID) return;

      const jumpToTextInputValue = interaction.fields
        .getTextInputValue(getCustomId(JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID, messageBuilderType, messageBuilder.counter))
        .trim();

      let jumpToIdentifierTextInputValue: string | undefined = undefined;
      try {
        jumpToIdentifierTextInputValue = interaction.fields
          .getTextInputValue(
            getCustomId(JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID, messageBuilderType, messageBuilder.counter)
          )
          .trim();
      } catch {}

      if (
        jumpToTextInputValue !== '' &&
        jumpToIdentifierTextInputValue !== undefined &&
        jumpToIdentifierTextInputValue !== ''
      ) {
        // can't set both
        await defer;
        return;
      }

      if (jumpToIdentifierTextInputValue !== undefined && jumpToIdentifierTextInputValue !== '') {
        const reply = messageBuilder.jumpToIdentifier(jumpToIdentifierTextInputValue);
        await defer;

        if (reply === undefined) return;
        await messageBuilderInteraction.editReply(reply);
        return;
      }

      if (jumpToTextInputValue === '') {
        const reply = messageBuilder.random();
        await defer;

        if (reply === undefined) return;
        await messageBuilderInteraction.editReply(reply);
        return;
      }

      const jumpToTextInputValueNumber = Number(jumpToTextInputValue);
      if (Number.isNaN(jumpToTextInputValueNumber)) {
        await defer;
        return;
      }

      const reply = messageBuilder.jumpTo(jumpToTextInputValueNumber - 1);
      await defer;

      if (reply === undefined) return;
      await messageBuilderInteraction.editReply(reply);
    } catch (error) {
      logError(error, 'Error at modalSubmitHandler');

      if (deferReply !== undefined) {
        await deferReply;
        await interaction.editReply('Something went wrong. Please try again later.');
      }
    }
  };
}
