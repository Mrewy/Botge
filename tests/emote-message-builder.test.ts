/** @format */

import { describe, expect, test } from 'vitest';

import type { ChatInputCommandInteraction } from 'discord.js';

import { getAllSubstrings } from 'src/command-handlers/shortest-unique-substrings.ts';
import { EmoteMessageBuilder } from 'src/message-builders/emote-message-builder.ts';
import type { AssetInfo } from 'src/types.ts';

const EMOTES_LENGTH = 4 as const; //at least 4

function getTestName(index: number): string {
  return `testName${index}`;
}

describe('EmoteMessageBuilder', () => {
  const chatInputCommandInteraction = {} as ChatInputCommandInteraction;
  const emotes = ((): readonly AssetInfo[] => {
    const emotes_: AssetInfo[] = [];

    for (let i = 0; i < EMOTES_LENGTH; i++) {
      const emote = { name: getTestName(i), platform: 'sevenNotInSet', zeroWidth: false } as AssetInfo;
      emotes_.push(emote);
    }

    return emotes_;
  })();
  const emoteMessageBuilder = new EmoteMessageBuilder(chatInputCommandInteraction, emotes, undefined, true);

  test('general', () => {
    expect(emoteMessageBuilder.counter).toBe(0);
    expect(emoteMessageBuilder.interaction).toBeDefined();
    expect(emoteMessageBuilder.modal).toBeDefined();
  });

  test('first', () => {
    expect(emoteMessageBuilder.first()).toBeDefined();
    expect(emoteMessageBuilder.jumpTo(0)).toBeUndefined();
    expect(emoteMessageBuilder.previous()).toBeUndefined();
  });

  test('last', () => {
    expect(emoteMessageBuilder.last()).toBeDefined();
    expect(emoteMessageBuilder.jumpTo(emotes.length - 1)).toBeUndefined();
    expect(emoteMessageBuilder.next()).toBeUndefined();
  });

  test('jumpToIdentifier exact, same jumpTo & jumpToIdentifier', () => {
    expect(emoteMessageBuilder.jumpTo(EMOTES_LENGTH - 2)).toBeDefined();
    expect(emoteMessageBuilder.jumpTo(EMOTES_LENGTH - 2)).toBeUndefined();

    expect(emoteMessageBuilder.jumpToIdentifier(getTestName(EMOTES_LENGTH - 1))).toBeDefined();
    expect(emoteMessageBuilder.jumpToIdentifier(getTestName(EMOTES_LENGTH - 1))).toBeUndefined();
  });

  test('jumpToIdentifier lowercase', () => {
    expect(emoteMessageBuilder.jumpToIdentifier(getTestName(1).toLowerCase())).toBeDefined();
  });

  test('jumpToIdentifier includes', () => {
    const identifier = getTestName(0);
    const allSubstrings = getAllSubstrings(identifier);

    for (const substring of allSubstrings) {
      expect(emoteMessageBuilder.jumpToIdentifier(substring)).toBeDefined();
      emoteMessageBuilder.last();
    }
  });

  test('jumpTo & jumpToIdentifier out of bounds', () => {
    expect(emoteMessageBuilder.jumpTo(-1)).toBeUndefined();
    expect(emoteMessageBuilder.jumpTo(EMOTES_LENGTH)).toBeUndefined();

    expect(emoteMessageBuilder.jumpToIdentifier('')).toBeUndefined();
    expect(emoteMessageBuilder.jumpToIdentifier(getTestName(EMOTES_LENGTH))).toBeUndefined();
  });

  test('markCurrentAsDeleted', () => {
    expect(emoteMessageBuilder.markCurrentAsDeleted()).toBeDefined();
    expect(emoteMessageBuilder.markCurrentAsDeleted()).toBeUndefined();

    expect(emoteMessageBuilder.currentAddedEmote).toBeUndefined();
  });

  test('random', () => {
    for (let i = 0; i < EMOTES_LENGTH; i++) expect(emoteMessageBuilder.random()).toBeDefined();
  });
});
