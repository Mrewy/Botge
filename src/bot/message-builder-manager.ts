/** @format */

import type { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import type { PingForPingMeMessageBuilder } from '../message-builders/ping-for-ping-me-message-builder.ts';
import type { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import type { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import type { MediaMessageBuilder } from '../message-builders/media-message-builder.ts';
import type { QuoteMessageBuilder } from '../message-builders/quote-message-builder.ts';

const CLEANUP_MINUTES = 10 as const;

export class MessageBuilderManager {
  readonly #pingForPingListMessageBuilders: PingForPingListMessageBuilder[] = [];
  readonly #pingForPingMeMessageBuilders: PingForPingMeMessageBuilder[] = [];
  readonly #twitchClipMessageBuilders: TwitchClipMessageBuilder[] = [];
  readonly #emoteMessageBuilders: EmoteMessageBuilder[] = [];
  readonly #mediaMessageBuilders: MediaMessageBuilder[] = [];
  readonly #quoteMessageBuilders: QuoteMessageBuilder[] = [];

  public get pingForPingListMessageBuilders(): PingForPingListMessageBuilder[] {
    return this.#pingForPingListMessageBuilders;
  }
  public get pingForPingMeMessageBuilders(): PingForPingMeMessageBuilder[] {
    return this.#pingForPingMeMessageBuilders;
  }
  public get twitchClipMessageBuilders(): TwitchClipMessageBuilder[] {
    return this.#twitchClipMessageBuilders;
  }
  public get emoteMessageBuilders(): EmoteMessageBuilder[] {
    return this.#emoteMessageBuilders;
  }
  public get mediaMessageBuilders(): MediaMessageBuilder[] {
    return this.#mediaMessageBuilders;
  }
  public get quoteMessageBuilders(): QuoteMessageBuilder[] {
    return this.#quoteMessageBuilders;
  }

  public cleanupMessageBuilders(): void {
    const timeNow = Date.now();

    this.#cleanupMessageBuilders(this.#pingForPingListMessageBuilders, timeNow);
    this.#cleanupPingMessageBuilders(timeNow);

    this.#cleanupMessageBuilders(this.#twitchClipMessageBuilders, timeNow);
    this.#cleanupMessageBuilders(this.#emoteMessageBuilders, timeNow);
    this.#cleanupMessageBuilders(this.#mediaMessageBuilders, timeNow);
    this.#cleanupMessageBuilders(this.#quoteMessageBuilders, timeNow);
  }

  #cleanupMessageBuilders(
    messageBuilders: (
      | PingForPingListMessageBuilder
      | TwitchClipMessageBuilder
      | EmoteMessageBuilder
      | MediaMessageBuilder
      | QuoteMessageBuilder
    )[],
    timeNow: number
  ): void {
    for (const [index, messageBuilder] of messageBuilders.entries()) {
      const difference = timeNow - messageBuilder.interaction.createdAt.getTime();

      if (difference > CLEANUP_MINUTES * 60000) {
        messageBuilders.splice(index, 1);
        this.#cleanupMessageBuilders(messageBuilders, timeNow);
        return;
      }
    }
  }

  #cleanupPingMessageBuilders(timeNow: number): void {
    for (const [index, pingMessageBuilder] of this.#pingForPingMeMessageBuilders.entries()) {
      const difference = timeNow - pingMessageBuilder.interaction.createdAt.getTime();

      if (difference > CLEANUP_MINUTES * 60000) {
        pingMessageBuilder.cleanupPressedMapsJob.cancel();
        this.#pingForPingMeMessageBuilders.splice(index, 1);
        this.#cleanupPingMessageBuilders(timeNow);
        return;
      }
    }
  }
}
