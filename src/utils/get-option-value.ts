/** @format */

import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';

export function getOptionValue<T = string | number | boolean>(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  optionName: string,
  transformFunction?: (param: string) => T
): T | undefined {
  const optionValue = interaction.options.get(optionName)?.value;
  if (optionValue === undefined) return undefined;

  let optionValue_: string | T = String(optionValue).trim();
  if (transformFunction !== undefined) optionValue_ = transformFunction(optionValue_);

  return optionValue_ as T;
}

export function getOptionValueWithoutUndefined<T = string | number>(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  optionName: string,
  transformFunction?: (param: string) => T
): T {
  const optionValue = getOptionValue<T>(interaction, optionName, transformFunction);

  if (optionValue === undefined) throw new Error(`Undefined ${optionName} option value.`);
  return optionValue;
}
