/** @format */

import { EmbedBuilder, type ChatInputCommandInteraction, type ButtonInteraction } from 'discord.js';

import { daysAndHoursAndMinutesToMilliseconds } from '../command-handlers/ping-me.ts';

import { booleanToString } from '../utils/boolean-to-string.ts';

import type { PingForPingListMessageBuilderTransformFunctionReturnType } from '../types.ts';

import type { PingForPingMeMessageBuilder } from './ping-for-ping-me-message-builder.ts';

import { BaseMessageBuilder } from './base.ts';

/*
export const PING_ME_AS_WELL_BUTTON_FOR_PING_LIST_BASE_CUSTOM_ID = 'pingMeAsWellButtonForPingList';
export const REMOVE_ME_FROM_PING_BUTTON_FOR_PING_LIST_BASE_CUSTOM_ID = 'removeMeFromPingButtonForPingList';
export const DELETE_PING_BUTTON_FOR_PING_LIST_BASE_CUSTOM_ID = 'deletePingButtonForPingList';
*/

const UNKNOWN_USER = 'unknown user' as const;

export class PingForPingListMessageBuilder extends BaseMessageBuilder<
  Readonly<PingForPingMeMessageBuilder>,
  PingForPingListMessageBuilderTransformFunctionReturnType
> {
  public static readonly messageBuilderType = 'PingForPingList' as const;
  static #staticCounter = 0;
  readonly #markedAsDeletedArray: number[];

  public constructor(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    pingForPingMeMessageBuilders: readonly Readonly<PingForPingMeMessageBuilder>[],
    timezone: string | undefined
  ) {
    const transformFunction = (
      pingForPingMeMessageBuilder: Readonly<PingForPingMeMessageBuilder>
    ): PingForPingListMessageBuilderTransformFunctionReturnType => {
      const { ping } = pingForPingMeMessageBuilder;
      const { time, days, hours, minutes, message, userIdRemoved } = ping;

      const embed = new EmbedBuilder();
      if (this.#markedAsDeletedArray.includes(this.currentIndex)) embed.setDescription('❌ DELETED ❌');

      const pingDate = ((): Date => {
        const pingDate_ = new Date(time + daysAndHoursAndMinutesToMilliseconds(days ?? 0, hours ?? 0, minutes ?? 0));
        if (timezone === undefined) return pingDate_;

        const [operator] = timezone;
        const timezone_: readonly number[] = timezone
          .slice(1)
          .split(':')
          .map((hoursOrMinutes_) => Number(hoursOrMinutes_));

        timezone_.forEach((hoursOrMinutes, i) => {
          if (hoursOrMinutes === 0) return;

          const eval_ = Number(
            eval(`${i === 0 ? pingDate_.getHours() : pingDate_.getMinutes()} ${operator} ${hoursOrMinutes}`)
          );
          if (i === 0) pingDate_.setHours(eval_);
          else pingDate_.setMinutes(eval_);
        });

        return pingDate_;
      })();

      const { userId, channelId, userIds } = ping;
      const channelName = interaction.guild?.channels.cache.find((channel_) => channel_.id === channelId)?.name;
      const userIdDisplayName = interaction.guild?.members.cache.find((member_) => member_.id === userId)?.displayName;
      const userIdsDisplayNamesJoined = (
        userIds !== null
          ? userIds.map(
              (userId_) =>
                interaction.guild?.members.cache.find((member_) => member_.id === userId_)?.displayName ?? UNKNOWN_USER
            )
          : []
      ).join(', ');

      embed
        .setColor('DarkButNotBlack')
        .setTitle(`${pingDate.toUTCString()}${timezone ?? ''} by ${userIdDisplayName ?? UNKNOWN_USER}`)
        .addFields(
          { name: 'Message', value: message ?? '-' },
          { name: 'Channel', value: channelName ?? 'unknown channel', inline: true },
          { name: 'Pings', value: userIdsDisplayNamesJoined !== '' ? userIdsDisplayNamesJoined : '-', inline: true },
          {
            name: 'Original command user removed from ping',
            value: booleanToString(userIdRemoved ?? false),
            inline: true
          }
        )
        .setFooter({
          text: `${this.currentIndex + 1}/${this.arrayLength}.`
        });

      return {
        embeds: [embed],
        components: [this.row]
      };
    };

    super(
      PingForPingListMessageBuilder.#staticCounter++,
      PingForPingListMessageBuilder.messageBuilderType,
      interaction,
      pingForPingMeMessageBuilders,
      transformFunction,
      undefined,
      undefined
    );

    this.#markedAsDeletedArray = [];
  }

  public get currentPingForPingMeMessageBuilder(): Readonly<PingForPingMeMessageBuilder> | undefined {
    if (this.#markedAsDeletedArray.includes(this.currentIndex)) return undefined;

    return this.currentItem;
  }

  public markCurrentAsDeleted(): PingForPingListMessageBuilderTransformFunctionReturnType | undefined {
    if (this.#markedAsDeletedArray.includes(this.currentIndex)) return undefined;

    this.#markedAsDeletedArray.push(this.currentIndex);
    return this.current();
  }
}
