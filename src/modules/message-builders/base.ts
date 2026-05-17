/** @format */

import {
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type MessageActionRowComponentBuilder
} from 'discord.js';

import type {
  AssetInfo,
  EmoteMessageBuilderTransformFunctionReturnType,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder,
  ReadonlyModalBuilder,
  TwitchClip,
  TwitchClipMessageBuilderTransformFunctionReturnType,
  Ping,
  PingForPingListMessageBuilderTransformFunctionReturnType
} from '../../types.ts';

export const PREVIOUS_BUTTON_BASE_CUSTOM_ID = 'previousButton' as const;
export const NEXT_BUTTON_BASE_CUSTOM_ID = 'nextButton' as const;
export const FIRST_BUTTON_BASE_CUSTOM_ID = 'firstButton' as const;
export const LAST_BUTTON_BASE_CUSTOM_ID = 'lastButton' as const;
export const JUMP_TO_BUTTON_BASE_CUSTOM_ID = 'jumpToButton' as const;
export const JUMP_TO_MODAL_BASE_CUSTOM_ID = 'jumpToModal' as const;
export const JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID = 'jumpToTextInput' as const;
export const JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID = 'jumpToIdentifierTextInput' as const;

const BUTTON_CUSTOM_ID_SPLITTER = '-' as const;

/**
 * Get the base custom ID of the {@link ButtonBuilder} or {@link ModalBuilder}.
 *
 * @remarks
 * The base custom ID is the ID for the functionality of the Builder.
 *
 * @example
 * getBaseCustomIdFromCustomId('previousButtonEmote7') = 'previousButton'
 *
 * @param customId - The full custom ID
 * @returns The base custom ID
 */
export function getBaseCustomIdFromCustomId(customId: string): string {
  return customId.split(BUTTON_CUSTOM_ID_SPLITTER)[0];
}

/**
 * Get the messageBuilder type of the {@link ButtonBuilder} or {@link ModalBuilder}.
 *
 * @remarks
 * The messageBuilder type is the type of the Builder.
 *
 * @example
 * getMessageBuilderTypeFromCustomId('previousButtonEmote7') = 'Emote'
 *
 * @param customId - The full custom ID
 * @returns The messageBuilder type
 */
export function getMessageBuilderTypeFromCustomId(customId: string): string {
  return customId.split(BUTTON_CUSTOM_ID_SPLITTER)[1];
}

/**
 * Get the counter of the {@link ButtonBuilder} or {@link ModalBuilder}.
 *
 * @remarks
 * The counter is index of the Builder in its corresponding array.
 *
 * @example
 * getCounterFromCustomId('previousButtonEmote7') = '7'
 *
 * @param customId - The full custom ID
 * @returns The counter
 */
export function getCounterFromCustomId(customId: string): number {
  return Number(customId.split(BUTTON_CUSTOM_ID_SPLITTER)[2]);
}

/**
 * Constructs the full custom ID of the {@link ButtonBuilder} or {@link ModalBuilder}.
 *
 * @remarks
 * The full custom ID is an always unique identifier.
 *
 * @example
 * getCustomId('previousButton', 'Emote', 7) = 'previousButtonEmote7'
 *
 * @see the functions above.
 *
 * @param baseCustomId - The base custom ID of the Builder
 * @param messageBuilderType - The messageBuilder type of the Builder
 * @param counter - The counter of the Builder
 * @returns The full custom ID
 */
export function getCustomId(baseCustomId: string, messageBuilderType: string, counter: number): string {
  return `${baseCustomId}${BUTTON_CUSTOM_ID_SPLITTER}${messageBuilderType}${BUTTON_CUSTOM_ID_SPLITTER}${counter}`;
}

function randomNumberInInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * A class to manage building list-like messages.
 *
 * @remarks The class defines the common parts of message builders, such as navigation buttons and navigation popups.
 *
 * @privateRemarks This is peak object-oriented code.
 *
 * @typeParam ArrayItemType - The type of the objects in the list.
 * @typeParam TransformFunctionReturnType - The Discord-sendable, display-form type of the objects in the list.
 */
export class BaseMessageBuilder<
  ArrayItemType = AssetInfo | TwitchClip | Ping,
  TransformFunctionReturnType =
    | TwitchClipMessageBuilderTransformFunctionReturnType
    | EmoteMessageBuilderTransformFunctionReturnType
    | PingForPingListMessageBuilderTransformFunctionReturnType
> {
  readonly #counter: number;
  readonly #interaction: ChatInputCommandInteraction | ButtonInteraction;
  readonly #array: readonly ArrayItemType[];
  /** The navigation buttons */
  readonly #row: ReadonlyActionRowBuilderMessageActionRowComponentBuilder;
  /** The navigation popups */
  readonly #modal: ReadonlyModalBuilder;
  readonly #transformFunction: (arrayItem: ArrayItemType) => TransformFunctionReturnType;
  readonly #getIdentifierFunction: ((arrayItem: ArrayItemType) => string) | undefined;
  #currentIndex: number;

  protected constructor(
    counter: number,
    messageBuilderType: string,
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    array: readonly ArrayItemType[],
    transformFunction: (arrayItem: ArrayItemType) => TransformFunctionReturnType,
    getIdentifierFunction: ((arrayItem: ArrayItemType) => string) | undefined,
    identifierName: string | undefined
  ) {
    this.#counter = counter;
    this.#interaction = interaction;
    this.#array = array;
    this.#transformFunction = transformFunction;
    this.#getIdentifierFunction = getIdentifierFunction;
    this.#currentIndex = -1; // ! -1 because of first element

    this.#row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(getCustomId(FIRST_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('First')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(getCustomId(PREVIOUS_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(getCustomId(JUMP_TO_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Jump to')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(getCustomId(NEXT_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(getCustomId(LAST_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Last')
        .setStyle(ButtonStyle.Secondary)
    );

    this.#modal = new ModalBuilder()
      .setCustomId(getCustomId(JUMP_TO_MODAL_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
      .setTitle('Jump to')
      .addLabelComponents(
        new LabelBuilder()
          .setLabel('Jump to index')
          .setDescription('If empty it jumps to a random index.')
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId(getCustomId(JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
              .setMaxLength(6)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('random')
              .setRequired(false)
          )
      );

    if (identifierName !== undefined && getIdentifierFunction !== undefined) {
      this.#modal.addLabelComponents(
        new LabelBuilder()
          .setLabel(`Jump to ${identifierName}`)
          .setDescription(`The ${identifierName} of the item you wish to jump to.`)
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId(getCustomId(JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
              .setMaxLength(20)
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
      );
    }
  }

  public get counter(): number {
    return this.#counter;
  }
  public get interaction(): ChatInputCommandInteraction | ButtonInteraction {
    return this.#interaction;
  }
  public get modal(): ReadonlyModalBuilder {
    return this.#modal;
  }

  protected get row(): ReadonlyActionRowBuilderMessageActionRowComponentBuilder {
    return this.#row;
  }
  protected get currentIndex(): number {
    return this.#currentIndex;
  }
  protected get currentItem(): ArrayItemType {
    return this.#array[this.#currentIndex];
  }
  protected get arrayLength(): number {
    return this.#array.length;
  }

  public previous(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex <= 0) return undefined;

    this.#currentIndex--;
    return this.current();
  }

  public next(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex >= this.#array.length - 1) return undefined;

    this.#currentIndex++;
    return this.current();
  }

  public first(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex === 0) return undefined;

    this.#currentIndex = 0;
    return this.current();
  }

  public last(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex === this.#array.length - 1) return undefined;

    this.#currentIndex = this.#array.length - 1;
    return this.current();
  }

  public random(): TransformFunctionReturnType | undefined {
    if (this.#array.length === 1) return undefined;

    const randomNumberInInterval_ = ((): number => {
      let randomNumber = randomNumberInInterval(0, this.#array.length - 1);
      while (randomNumber === this.#currentIndex) randomNumber = randomNumberInInterval(0, this.#array.length - 1);

      return randomNumber;
    })();

    this.#currentIndex = randomNumberInInterval_;
    return this.current();
  }

  public jumpTo(jumpTo: number): TransformFunctionReturnType | undefined {
    if (jumpTo > this.#array.length - 1) return undefined;
    else if (jumpTo < 0) return undefined;

    if (this.#currentIndex === jumpTo) return undefined;
    this.#currentIndex = jumpTo;
    return this.current();
  }

  public jumpToIdentifier(jumpTo: string): TransformFunctionReturnType | undefined {
    if (jumpTo === '' || this.#getIdentifierFunction === undefined) return undefined;

    for (const [index, arrayItem] of this.#array.entries()) {
      const identifier = this.#getIdentifierFunction(arrayItem);

      if (identifier === jumpTo) {
        if (this.#currentIndex === index) return undefined;

        this.#currentIndex = index;
        return this.current();
      }
    }

    for (const [index, arrayItem] of this.#array.entries()) {
      const identifier = this.#getIdentifierFunction(arrayItem);

      if (identifier.toLowerCase() === jumpTo.toLowerCase()) {
        if (this.#currentIndex === index) return undefined;

        this.#currentIndex = index;
        return this.current();
      }
    }

    for (const [index, arrayItem] of this.#array.entries()) {
      const identifier = this.#getIdentifierFunction(arrayItem);

      if (identifier.toLowerCase().includes(jumpTo.toLowerCase())) {
        if (this.#currentIndex === index) return undefined;

        this.#currentIndex = index;
        return this.current();
      }
    }

    return undefined;
  }

  /**
   * Gets the current element.
   *
   * @remarks Discord-sendable.
   *
   * @returns The current element transformed
   */
  protected current(): TransformFunctionReturnType {
    return this.#transformFunction(this.#array[this.#currentIndex]);
  }
}
