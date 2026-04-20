/** @format */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { createHash } from 'crypto';

import { REST, Routes } from 'discord.js';

import { commands } from '../../discord/commands.ts';

const { APP_ID, DISCORD_TOKEN } = process.env;

export async function updateCommands(lockFilePath: string): Promise<void> {
  if (DISCORD_TOKEN === undefined || APP_ID === undefined) throw new Error('DISCORD_TOKEN and APP_ID required.');

  const currentCommands = ((): string | undefined => {
    if (!existsSync(lockFilePath)) return undefined;
    return readFileSync(lockFilePath, 'utf8');
  })();
  const newCommands = createHash('md5').update(JSON.stringify(commands)).digest('hex');

  if (currentCommands !== undefined && currentCommands === newCommands) {
    console.log('No commands change detected.');
    return;
  }

  console.log('Discord commands updating.');

  writeFileSync(lockFilePath, newCommands, { encoding: 'utf8', flag: 'w' });

  const rest: Readonly<REST> = new REST().setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(APP_ID), { body: commands });

  console.log('Discord commands updated.');
}
