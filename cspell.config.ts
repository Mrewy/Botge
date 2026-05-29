/** @format */

import { defineConfig, type CSpellSettings } from 'cspell';

const cSpellSettings: Readonly<CSpellSettings> = defineConfig({
  version: '0.2',
  language: 'en',
  readonly: true,
  description: 'botgeCSpell',

  useGitignore: true,
  enableGlobDot: true,
  caseSensitive: false,
  allowCompoundWords: true,
  validateDirectives: true,
  ignoreRandomStrings: true,

  dictionaries: [],
  ignorePaths: [
    '.devcontainer/devcontainer-lock.json',
    '.git/gk',
    '.git/hooks',
    '.git/info',
    '.git/logs',
    '.git/objects',
    '.git/refs',
    '.git/config',
    '.git/description',
    '.git/FETCH_HEAD',
    '.git/HEAD',
    '.git/index',
    '.git/ORIG_HEAD',
    '.git/packed-refs',
    'docs/CHANGELOG.md'
  ],

  words: [
    // Words
    'metadatas',
    'unforgeable',

    // Names
    'Botge',
    'Mrewy',
    'gentlebob',
    'widepogcrazy',
    'TimotronPrime',
    'ravenuy',

    'CuteDog',
    'zackrawrr',

    // Lib
    'tpad',
    'hstack',
    'libwebp',
    'ffprobe',
    'noprint',
    'nokey',

    'nomic',
    'mxbai',
    'hnsw',

    // Extensions
    'moby',
    'eamodio',
    'buildx',
    'esbenp',
    'jmrog',
    'alefragnani',
    'Anson',
    'dbaeumer',
    'ahmadalli',
    'joshbolduc',
    'vsicons',
    'kohler',

    // Other
    'FrankerFaceZ',
    'BetterTTV',
    'Meilisearch',
    'getmeili',
    'Meili',
    'DeepL',
    'BTTV',
    'Ollama',
    'ARPG',
    'chromadb',
    'CNTREC',
    'RRGGBB',
    'tsgo',
    'tsdoc',
    'vitest'
  ],
  ignoreWords: [
    // ? Ge - rename later
    'guildge',
    'clipsge',
    'namege',
    'testge',
    'userge',

    // Random
    'KHTML',
    'jtvnw',
    '01FDMJPSF8000CJ4MDR2FNZEQ3',

    // Other
    'pingme',
    'doesnt',
    'nums'
  ]
});

export default cSpellSettings;
