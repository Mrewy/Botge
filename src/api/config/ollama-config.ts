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

// Shape of ollama.config.json: everything except secrets, with system prompts
// stored as arrays of lines where "{name}" is replaced by the bot name.
type OllamaConfigJson = Omit<Config, 'discord' | 'ollama'> & {
  readonly ollama: Omit<Config['ollama'], 'systemPrompts'> & {
    readonly systemPrompts: {
      readonly scoreReplyOpportunity: readonly string[];
      readonly generateReply: readonly string[];
    };
  };
};

const OLLAMA_CONFIG_PATH = 'ollama.config.json';

function required(key: string): string {
  const value = process.env[key];

  if (value === undefined) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

function loadConfig(): Config {
  if (!existsSync(OLLAMA_CONFIG_PATH)) throw new Error(`No ${OLLAMA_CONFIG_PATH} found.`);

  const json = JSON.parse(readFileSync(OLLAMA_CONFIG_PATH, 'utf8')) as OllamaConfigJson;
  const { name } = json.bot;
  const prompt = (lines: readonly string[]): string => lines.join('\n').replaceAll('{name}', name);

  return {
    discord: { token: required('DISCORD_TOKEN') },
    bot: json.bot,
    ollama: {
      baseUrl: json.ollama.baseUrl,
      model: json.ollama.model,
      // Embedding model is versioned separately from the chat model.
      // Changing this requires re-running: node backfill.js reset <channelId>
      embeddingModel: json.ollama.embeddingModel,
      options: json.ollama.options,
      systemPrompts: {
        scoreReplyOpportunity: prompt(json.ollama.systemPrompts.scoreReplyOpportunity),
        generateReply: prompt(json.ollama.systemPrompts.generateReply)
      }
    },
    chroma: json.chroma,
    behavior: json.behavior,
    activeChatChannels: json.activeChatChannels
  };
}

export const config: Config = loadConfig();
