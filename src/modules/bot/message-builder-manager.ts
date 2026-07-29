/** @format */

import type { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import type { PingForPingMeMessageBuilder } from '../message-builders/ping-for-ping-me-message-builder.ts';
import type { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import type { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import type { MediaMessageBuilder } from '../message-builders/media-message-builder.ts';
import type { QuoteMessageBuilder } from '../message-builders/quote-message-builder.ts';

const CLEANUP_MINUTES = 10 as const;

export class MessageBuilderManager {
  readonly #pingForPingListMessageBuilders: Readonly<PingForPingListMessageBuilder>[] = [];
  readonly #pingForPingMeMessageBuilders: Readonly<PingForPingMeMessageBuilder>[] = [];
  readonly #twitchClipMessageBuilders: Readonly<TwitchClipMessageBuilder>[] = [];
  readonly #emoteMessageBuilders: Readonly<EmoteMessageBuilder>[] = [];
  readonly #mediaMessageBuilders: Readonly<MediaMessageBuilder>[] = [];
  readonly #quoteMessageBuilders: Readonly<QuoteMessageBuilder>[] = [];

  public get pingForPingListMessageBuilders(): Readonly<PingForPingListMessageBuilder>[] {
    return this.#pingForPingListMessageBuilders;
  }
  public get pingForPingMeMessageBuilders(): Readonly<PingForPingMeMessageBuilder>[] {
    return this.#pingForPingMeMessageBuilders;
  }
  public get twitchClipMessageBuilders(): Readonly<TwitchClipMessageBuilder>[] {
    return this.#twitchClipMessageBuilders;
  }
  public get emoteMessageBuilders(): Readonly<EmoteMessageBuilder>[] {
    return this.#emoteMessageBuilders;
  }
  public get mediaMessageBuilders(): Readonly<MediaMessageBuilder>[] {
    return this.#mediaMessageBuilders;
  }
  public get quoteMessageBuilders(): Readonly<QuoteMessageBuilder>[] {
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
      | Readonly<PingForPingListMessageBuilder>
      | Readonly<TwitchClipMessageBuilder>
      | Readonly<EmoteMessageBuilder>
      | Readonly<MediaMessageBuilder>
      | Readonly<QuoteMessageBuilder>
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
