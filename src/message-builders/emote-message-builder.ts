/** @format */

import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type MessageActionRowComponentBuilder
} from 'discord.js';

import {
  emoteCdnUrlToEmoteApiCdnUrl,
  emoteCdnUrlToEmoteUrl
} from '../utils/message-builders/emote-cdn-url-to-emote-url.ts';
import { platformToString } from '../utils/platform-to-string.ts';
import { booleanToString } from '../utils/boolean-to-string.ts';

import type {
  AddedEmote,
  AssetInfo,
  EmoteMessageBuilderTransformFunctionReturnType,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder
} from '../types.ts';

import { Platform } from '../enums.ts';

import { BaseMessageBuilder, getCustomId } from './base.ts';

export const DELETE_EMOTE_BUTTON_BASE_CUSTOM_ID = 'deleteEmoteButton' as const;

export class EmoteMessageBuilder extends BaseMessageBuilder<AssetInfo, EmoteMessageBuilderTransformFunctionReturnType> {
  public static readonly messageBuilderType = 'Emote' as const;
  static #staticCounter = 0;
  readonly #extraRow: ReadonlyActionRowBuilderMessageActionRowComponentBuilder | undefined = undefined;
  readonly #shortestUniqueSubstrings: readonly string[] | undefined;
  readonly #markedAsDeletedArray: number[] | undefined = undefined;

  public constructor(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    emotes: readonly AssetInfo[],
    shortestUniqueSubstrings?: readonly string[],
    isAddedEmoteDeleteMode = false
  ) {
    const transformFunction = (assetInfo: AssetInfo): EmoteMessageBuilderTransformFunctionReturnType => {
      const { name, url, zeroWidth, platform, width, height } = assetInfo;

      const embed = new EmbedBuilder();

      if (this.#shortestUniqueSubstrings !== undefined)
        embed.addFields({
          name: 'Shortest Unique Substrings',
          value: this.#shortestUniqueSubstrings[this.currentIndex]
        });

      if (this.#markedAsDeletedArray !== undefined && this.#markedAsDeletedArray.includes(this.currentIndex))
        embed.setDescription('❌ DELETED ❌');

      embed
        .setColor('DarkButNotBlack')
        .setTitle(name)
        .setURL(emoteCdnUrlToEmoteUrl(assetInfo))
        .addFields(
          { name: 'Platform', value: platformToString(platform) },
          { name: 'Zero width', value: booleanToString(zeroWidth), inline: true },
          { name: 'Width', value: width?.toString() ?? 'N/A', inline: true },
          { name: 'Height', value: height?.toString() ?? 'N/A', inline: true }
        )
        .setImage(url)
        .setFooter({
          text: `${this.currentIndex + 1}/${this.arrayLength}.${isAddedEmoteDeleteMode ? ' Sorted alphabetically.' : shortestUniqueSubstrings === undefined ? ' Sorted by date added(newest first).' : ''}`
        });

      return {
        embeds: [embed],
        components: this.#extraRow !== undefined ? [this.row, this.#extraRow] : [this.row]
      };
    };

    const getIdentifierFunction = (assetInfo: AssetInfo): string => {
      return assetInfo.name;
    };

    super(
      EmoteMessageBuilder.#staticCounter++,
      EmoteMessageBuilder.messageBuilderType,
      interaction,
      emotes,
      transformFunction,
      getIdentifierFunction,
      'name'
    );

    if (isAddedEmoteDeleteMode) {
      this.#extraRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(
            getCustomId(DELETE_EMOTE_BUTTON_BASE_CUSTOM_ID, EmoteMessageBuilder.messageBuilderType, this.counter)
          )
          .setLabel('Delete')
          .setStyle(ButtonStyle.Danger)
      );
      this.#markedAsDeletedArray = [];
    }

    this.#shortestUniqueSubstrings = shortestUniqueSubstrings;
  }

  public get currentAddedEmote(): AddedEmote | undefined {
    if (this.#markedAsDeletedArray === undefined) return undefined;
    if (this.#markedAsDeletedArray.includes(this.currentIndex)) return undefined;

    const currentEmote = this.currentItem;
    if (currentEmote.platform !== Platform.sevenNotInSet) return undefined;

    const emoteCdnUrlToEmoteApiCdnUrl_ = emoteCdnUrlToEmoteApiCdnUrl(currentEmote);
    if (emoteCdnUrlToEmoteApiCdnUrl_ === undefined) return undefined;

    return {
      alias: currentEmote.name,
      url: emoteCdnUrlToEmoteApiCdnUrl_
    };
  }

  public markCurrentAsDeleted(): EmoteMessageBuilderTransformFunctionReturnType | undefined {
    if (this.#markedAsDeletedArray === undefined) return undefined;
    if (this.#markedAsDeletedArray.includes(this.currentIndex)) return undefined;

    this.#markedAsDeletedArray.push(this.currentIndex);
    return this.current();
  }
}
