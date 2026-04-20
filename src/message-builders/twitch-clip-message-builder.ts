/** @format */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type MessageActionRowComponentBuilder
} from 'discord.js';

import { getPingableUserId } from '../utils/message-builders/get-pingable-user-id.ts';

import type {
  TwitchClip,
  TwitchClipMessageBuilderTransformFunctionReturnType,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder
} from '../types.ts';

import { BaseMessageBuilder, getCustomId } from './base.ts';

export const SEND_CLIP_BUTTON_BASE_CUSTOM_ID = 'sendClipButton' as const;

const { EMBED_SERVER_TWITCH } = process.env;

export class TwitchClipMessageBuilder extends BaseMessageBuilder<
  TwitchClip,
  TwitchClipMessageBuilderTransformFunctionReturnType
> {
  public static readonly messageBuilderType = 'Clip' as const;
  static #staticCounter = 0;
  readonly #extraRow: ReadonlyActionRowBuilderMessageActionRowComponentBuilder | undefined = undefined;

  public constructor(interaction: ChatInputCommandInteraction, twitchClips: readonly TwitchClip[], ephemeral: boolean) {
    // if (EMBED_SERVER_TWITCH === undefined) throw new Error('EMBED_SERVER_TWITCH undefined');
    // ! no env file in test
    // there is now env file regardless if its test. rework needed.

    const transformFunction = (twitchClip: TwitchClip): TwitchClipMessageBuilderTransformFunctionReturnType => {
      const { id } = twitchClip;
      const content = `${EMBED_SERVER_TWITCH}${id}\n${this.currentIndex + 1}/${this.arrayLength}`;

      return {
        content: content,
        components: this.#extraRow !== undefined ? [this.row, this.#extraRow] : [this.row]
      };
    };

    const getIdentifierFunction = (twitchClip: TwitchClip): string => {
      return twitchClip.title;
    };

    super(
      TwitchClipMessageBuilder.#staticCounter++,
      TwitchClipMessageBuilder.messageBuilderType,
      interaction,
      twitchClips,
      transformFunction,
      getIdentifierFunction,
      'title'
    );

    if (ephemeral) {
      this.#extraRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(
            getCustomId(SEND_CLIP_BUTTON_BASE_CUSTOM_ID, TwitchClipMessageBuilder.messageBuilderType, this.counter)
          )
          .setLabel('Send')
          .setStyle(ButtonStyle.Success)
      );
    }
  }

  public currentWithSentBy(): TwitchClipMessageBuilderTransformFunctionReturnType {
    const current = this.current();
    const [contentUrl] = current.content.split('\n');

    return {
      content: `${contentUrl}\nSent by: ${getPingableUserId(this.interaction.user.id)}`
    };
  }
}
