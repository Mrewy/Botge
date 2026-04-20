/** @format */

import fetch, { type Response } from 'node-fetch';
import type { ChatInputCommandInteraction } from 'discord.js';

import { logError } from '../utils/log-error.ts';
import { GUILD_ID_CUTEDOG } from '../discord/guilds.ts';
import type { Guild } from '../discord/guild.ts';

type NumberOfCurrentPlayers = {
  readonly response: {
    readonly player_count: number;
  };
};

function getColor(percent: number): string {
  if (percent <= 39)
    return '\u001b[31m'; // red
  else if (percent <= 69)
    return '\u001b[33m'; // yellow
  else return '\u001b[34m'; // blue
}

function getReviewLabel(percent: number): string {
  if (percent <= 19) return '(Overwhelmingly Negative)';
  if (percent <= 39) return '(Mostly Negative)';
  if (percent <= 69) return '(Mixed)';
  if (percent <= 79) return '(Mostly Positive)';
  if (percent <= 94) return '(Very Positive)';
  return '(Overwhelmingly Positive)';
}

function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const RECENT_REVIEW_REGEX = /([0-9]+)% of the ([0-9,]+) user reviews in the last 30 days are positive\./;
const ALL_REVIEWS_REGEX = /([0-9]+)% of the ([0-9,]+) user reviews for this game are positive\./;

export function steamHandler(gameId: string) {
  return async function (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> {
    const defer = interaction.deferReply();
    try {
      const store = (async (): Promise<Response> => {
        return fetch(`https://store.steampowered.com/app/${gameId}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
      })();

      const numberOfCurrentPlayers = (async (): Promise<Response> => {
        return fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${gameId}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
      })();

      if (!(await store).ok) {
        await defer;
        await interaction.editReply('failed to get store page.');
        return;
      }
      if (!(await numberOfCurrentPlayers).ok) {
        await defer;
        await interaction.editReply('failed to get number of current players.');
        return;
      }

      const storeHtml = await (await store).text();
      const recentReviewsMatch = RECENT_REVIEW_REGEX.exec(storeHtml);
      const allReviewsMatch = ALL_REVIEWS_REGEX.exec(storeHtml);
      const playerCount = ((await (await numberOfCurrentPlayers).json()) as NumberOfCurrentPlayers).response
        .player_count;

      if (recentReviewsMatch === null) throw new Error('null recentReviewsMatch');
      if (allReviewsMatch === null) throw new Error('null allReviewsMatch');
      if (recentReviewsMatch.length < 3) throw new Error('recentReviewsMatch.length < 3');
      if (allReviewsMatch.length < 3) throw new Error('allReviewsMatch.length < 3');

      const recentReviewsPercent = parseInt(recentReviewsMatch[1], 10);
      const allReviewsPercent = parseInt(allReviewsMatch[1], 10);

      const recentReviewsColor = getColor(recentReviewsPercent);
      const allReviewsColor = getColor(allReviewsPercent);
      const recentReviewsLabel = getReviewLabel(recentReviewsPercent);
      const allReviewsLabel = getReviewLabel(allReviewsPercent);
      const reset = '\u001b[0m';

      const replyText =
        '```ansi\n' +
        `RECENT REVIEWS: \u001b[1m${recentReviewsColor}${recentReviewsPercent}% ${recentReviewsLabel}\u001b[0m ${reset} (${recentReviewsMatch[2]})\n` +
        `ALL REVIEWS: \u001b[1m${allReviewsColor}${allReviewsPercent}% ${allReviewsLabel}\u001b[0m ${reset} (${allReviewsMatch[2]})\n` +
        `PLAYERS RIGHT NOW: \u001b[1m\u001b[32m${numberWithCommas(playerCount)}\u001b[0m\n` + // Player count bold and green
        '```' +
        (guild.id === GUILD_ID_CUTEDOG
          ? "\n-# Disclaimer: This CuteDog_ server is filled with a bunch of sad man-children who would rather waste time bot-checking a game's Steam rating than actually getting better at the game itself."
          : '');

      await defer;
      await interaction.editReply(replyText);
    } catch (error) {
      logError(error, 'Error at steamHandler');

      await defer;
      await interaction.editReply('something went wrong.');
    }
  };
}
