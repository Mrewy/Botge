/** @format */

import { existsSync, readFileSync } from 'node:fs';

export type Config = {
  readonly discord: { readonly token: string };
  readonly bot: { readonly name: string };
  readonly ollama: {
    readonly baseUrl: string;
    readonly model: string;
    readonly embeddingModel: string;
    readonly options: {
      readonly temperature: number;
      readonly num_ctx: number;
      readonly top_p: number;
    };
    readonly systemPrompts: {
      readonly scoreReplyOpportunity: string;
      readonly generateReply: string;
    };
  };
  readonly chroma: { readonly url: string };
  readonly behavior: {
    readonly replyScoreThreshold: number;
    readonly contextWindow: number;
    readonly evaluationChance: number;
    readonly cooldownSeconds: number;
    readonly ragResults: number;
    readonly ragWindowSize: number;
  };
  readonly activeChatChannels: readonly string[];
};

// Shape of botge.config.json: everything except secrets, with system prompts
// stored as arrays of lines where "{name}" is replaced by the bot name.
type OllamaConfigJson = Omit<Config, 'discord' | 'ollama'> & {
  readonly ollama: Omit<Config['ollama'], 'systemPrompts'> & {
    readonly systemPrompts: {
      readonly scoreReplyOpportunity: readonly string[];
      readonly generateReply: readonly string[];
    };
  };
};

function required(key: string): string {
  const value = process.env[key];

  if (value === undefined) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

function loadConfig(): Config {
  const BOTGE_CONFIG_PATH = 'botge.config.json' as const;
  if (!existsSync(BOTGE_CONFIG_PATH)) throw new Error(`No ${BOTGE_CONFIG_PATH} found.`);

  const ollamaConfig = JSON.parse(readFileSync(BOTGE_CONFIG_PATH, 'utf8')) as OllamaConfigJson;

  const prompt = (lines: readonly string[]): string =>
    lines.join('\n').replaceAll('{name}', ollamaConfig.bot.name);

  return {
    discord: { token: required('DISCORD_TOKEN') },
    bot: ollamaConfig.bot,
    ollama: {
      baseUrl: ollamaConfig.ollama.baseUrl,
      model: ollamaConfig.ollama.model,
      // Embedding model is versioned separately from the chat model.
      // Changing this requires re-running: node backfill.js reset <channelId>
      embeddingModel: ollamaConfig.ollama.embeddingModel,
      options: ollamaConfig.ollama.options,
      systemPrompts: {
        scoreReplyOpportunity: prompt(ollamaConfig.ollama.systemPrompts.scoreReplyOpportunity),
        generateReply: prompt(ollamaConfig.ollama.systemPrompts.generateReply)
      }
    },
    chroma: ollamaConfig.chroma,
    behavior: ollamaConfig.behavior,
    activeChatChannels: ollamaConfig.activeChatChannels
  };
}

export const config: Config = loadConfig();
