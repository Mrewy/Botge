/** @format */

import {
  ButtonStyle,
  ButtonBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  type MessageActionRowComponentBuilder
} from 'discord.js';

import type {
  Quote,
  QuoteMessageBuilderTransformFunctionReturnType,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder
} from '../types.ts';

import { MEDIA_LIST_AND_QUOTE_LIST } from '../commands.ts';

import { BaseMessageBuilder, getCustomId } from './base.ts';

export const DELETE_QUOTE_BUTTON_BASE_CUSTOM_ID = 'deleteQuoteButton' as const;
export const RENAME_QUOTE_BUTTON_BASE_CUSTOM_ID = 'renameQuoteButton' as const;

export class QuoteMessageBuilder extends BaseMessageBuilder<Quote, QuoteMessageBuilderTransformFunctionReturnType> {
  public static readonly messageBuilderType = 'Quote' as const;
  static #staticCounter = 0;
  readonly #extraRow: ReadonlyActionRowBuilderMessageActionRowComponentBuilder;
  readonly #markedAsDeletedArray: number[] = [];
  readonly #sortedByText: string | undefined;

  public constructor(
    interaction: ChatInputCommandInteraction,
    quoteArray: readonly Quote[],
    sortedBy: string | undefined
  ) {
    const transformFunction = (quote: Quote): QuoteMessageBuilderTransformFunctionReturnType => {
      const { name, content, dateAdded } = quote;

      const embed = new EmbedBuilder();

      if (this.#markedAsDeletedArray.includes(this.currentIndex)) embed.setDescription('❌ DELETED ❌');

      embed
        .setColor('DarkButNotBlack')
        .setTitle(name)
        .addFields({ name: 'Date Added (UTC)', value: dateAdded.toUTCString() })
        .addFields({ name: 'Content', value: content })
        .setFooter({
          text: `${this.currentIndex + 1}/${this.arrayLength}. ${this.#sortedByText === MEDIA_LIST_AND_QUOTE_LIST.sortBy.alphabetical ? 'Sorted alphabetically' : `Sorted by ${this.#sortedByText}`}.`
        });

      return {
        embeds: [embed],
        components: [this.row, this.#extraRow]
      };
    };

    const getIdentifierFunction = (quote: Quote): string => {
      return quote.name;
    };

    super(
      QuoteMessageBuilder.#staticCounter++,
      QuoteMessageBuilder.messageBuilderType,
      interaction,
      quoteArray,
      transformFunction,
      getIdentifierFunction,
      'name'
    );

    this.#sortedByText = sortedBy ?? 'date added (newest first)';
    this.#extraRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(
          getCustomId(DELETE_QUOTE_BUTTON_BASE_CUSTOM_ID, QuoteMessageBuilder.messageBuilderType, this.counter)
        )
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(
          getCustomId(RENAME_QUOTE_BUTTON_BASE_CUSTOM_ID, QuoteMessageBuilder.messageBuilderType, this.counter)
        )
        .setLabel('Rename')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  public get currentQuote(): Quote | undefined {
    if (this.#markedAsDeletedArray.includes(this.currentIndex)) return undefined;

    const currentQuote = this.currentItem;
    return currentQuote;
  }

  public markCurrentAsDeleted(): QuoteMessageBuilderTransformFunctionReturnType | undefined {
    if (this.#markedAsDeletedArray.includes(this.currentIndex)) return undefined;

    this.#markedAsDeletedArray.push(this.currentIndex);
    return this.current();
  }
}
