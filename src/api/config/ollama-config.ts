/** @format */

export type Config = {
  readonly discord: { readonly token: string };
  readonly bot: { readonly name: string };
  readonly ollama: { readonly baseUrl: string; readonly model: string; readonly embeddingModel: string };
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

function required(key: string): string {
  const value = process.env[key];

  if (value === undefined) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config: Config = {
  discord: {
    token: required('DISCORD_TOKEN')
  },
  bot: {
    name: optional('BOT_NAME', 'Botge')
  },
  ollama: {
    baseUrl: optional('OLLAMA_BASE_URL', 'http://localhost:11434'),
    model: optional('OLLAMA_MODEL', 'gemma4:26b'),
    // Embedding model is versioned separately from the chat model.
    // Changing this requires re-running: node backfill.js reset <channelId>
    embeddingModel: optional('EMBEDDING_MODEL', 'nomic-embed-text')
  },
  chroma: {
    url: optional('CHROMA_URL', 'http://chromadb:8000')
  },
  behavior: {
    replyScoreThreshold: Number(optional('REPLY_SCORE_THRESHOLD', '2')),
    contextWindow: Number(optional('CONTEXT_WINDOW', '30')),
    evaluationChance: Number(optional('EVALUATION_CHANCE', '0.8')),
    cooldownSeconds: Number(optional('COOLDOWN_SECONDS', '60')),
    ragResults: Number(optional('RAG_RESULTS', '5')),
    // Messages to include before and after each semantic hit
    ragWindowSize: Number(optional('RAG_WINDOW_SIZE', '2'))
  },
  activeChatChannels: ['251211223012474880']
};
