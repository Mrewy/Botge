/** @format */

import { describe, expect, test } from 'vitest';

import type { ChatInputCommandInteraction } from 'discord.js';

import { getAllSubstrings } from 'src/handlers/command-handlers/shortest-unique-substrings.ts';
import { TwitchClipMessageBuilder } from 'src/modules/message-builders/twitch-clip-message-builder.ts';
import type { TwitchClip } from 'src/types.ts';

const TWITCH_CLIPS_LENGTH = 4 as const; //at least 4

function getTestTitle(index: number): string {
  return `testTitle${index}`;
}

describe('TwitchClipMessageBuilder', () => {
  const chatInputCommandInteraction = {} as ChatInputCommandInteraction;
  const twitchClips = ((): readonly TwitchClip[] => {
    const twitchClips_: TwitchClip[] = [];

    for (let i = 0; i < TWITCH_CLIPS_LENGTH; i++) {
      const twitchClip = {
        title: getTestTitle(i),
        view_count: 1,
        creator_name: 'testCreator',
        game_id: 'testGameId',
        created_at: 'testCreatedAt'
      } as TwitchClip;
      twitchClips_.push(twitchClip);
    }

    return twitchClips_;
  })();

  const twitchClipMessageBuilder = new TwitchClipMessageBuilder(
    chatInputCommandInteraction,
    twitchClips,
    false
  );

  test('jumpToIdentifier exact', () => {
    twitchClipMessageBuilder.first();

    expect(twitchClipMessageBuilder.jumpToIdentifier(getTestTitle(1))).toBeDefined();
  });

  test('jumpToIdentifier lowercase', () => {
    expect(twitchClipMessageBuilder.jumpToIdentifier(getTestTitle(2).toLowerCase())).toBeDefined();
  });

  test('jumpToIdentifier includes', () => {
    const identifier = getTestTitle(0);
    const allSubstrings = getAllSubstrings(identifier);

    for (const substring of allSubstrings) {
      expect(twitchClipMessageBuilder.jumpToIdentifier(substring)).toBeDefined();
      twitchClipMessageBuilder.last();
    }
  });
});
