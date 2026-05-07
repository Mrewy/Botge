/** @format */

import { defineConfig, globalIgnores, type Config } from 'eslint/config';

const globalConfig: readonly Readonly<Config>[] = defineConfig([
  {
    name: 'globalLanguageOptions',
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        ecmaVersion: 'latest',
        ecmaFeatures: {
          impliedStrict: true
        }
      }
    }
  },
  {
    name: 'globalLinterOptions',
    linterOptions: {
      noInlineConfig: true
    }
  },
  globalIgnores(
    [
      '.github/',
      '.husky/_/',
      'assets/',
      'data/',
      'dist/',
      'docs/',
      'chroma-data/',
      'meili-data/',
      'nginx/cache/',
      'tmp/'
    ],
    'globalIgnores'
  )
]);

import { plugin, parser, configs } from 'typescript-eslint';
import js from '@eslint/js';
import tsdoc from 'eslint-plugin-tsdoc';

const config: readonly Readonly<Config>[] = defineConfig([
  ...globalConfig,
  {
    name: 'ts',
    files: ['**/*.ts'],
    plugins: {
      'typescript-eslint': plugin,
      'js': js,
      'tsdoc': tsdoc
    },
    languageOptions: {
      parser: parser
    },
    extends: [js.configs.recommended, configs.all, configs.stylisticTypeChecked, configs.strictTypeChecked],

    rules: {
      '@typescript-eslint/adjacent-overload-signatures': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/no-type-alias': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^guild$' }],

      '@typescript-eslint/prefer-readonly-parameter-types': [
        'warn',
        {
          allow: [
            { from: 'lib', name: 'Array' },
            { from: 'package', name: 'RequestInit', package: 'node-fetch' },
            { from: 'package', name: ['Meilisearch', 'Index'], package: 'meilisearch' },
            {
              from: 'package',
              name: [
                'Interaction',
                'ChatInputCommandInteraction',
                'ButtonInteraction',
                'AutocompleteInteraction',
                'ModalSubmitInteraction',
                'RoleSelectMenuInteraction',
                'Client',
                'GuildEmoji',
                'Role',
                'GuildMember',
                'Guild',
                'TextChannel',
                'GuildBasedChannel',
                'Message',
                'MessageContextMenuCommandInteraction'
              ],
              package: 'discord.js'
            },
            { from: 'package', name: 'VoiceConnection', package: '@discordjs/voice' },
            { from: 'package', name: 'SqlJsStatic', package: 'sql.js' }
          ]
        }
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/strict-void-return': 'off', // generally useful.

      'eqeqeq': 'error',
      'strict': ['error', 'never'],
      'tsdoc/syntax': 'error',

      'array-callback-return': 'error',

      'no-await-in-loop': 'off', // ?
      'no-constructor-return': 'error',
      'no-duplicate-imports': 'error',
      'no-inner-declarations': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unassigned-vars': 'warn', // ?
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-use-before-define': 'off', // ! @typescript-eslint
      'no-useless-assignment': 'warn', // ?

      'require-atomic-updates': 'error',
      'block-scoped-var': 'error',
      'guard-for-in': 'error',
      'new-cap': 'error',

      'no-alert': 'error',
      'no-array-constructor': 'off', // ! @typescript-eslint
      'no-bitwise': ['error', { allow: ['&'] }],
      'no-caller': 'error',
      'no-empty': 'off', // ?
      'no-empty-function': 'off', // ! @typescript-eslint
      'no-eq-null': 'error',
      'no-eval': 'off', // TODO
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implicit-globals': 'error',
      'no-implied-eval': 'off', // ! @typescript-eslint
      'no-invalid-this': 'off', // ! @typescript-eslint
      'no-iterator': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'off', // ! @typescript-eslint
      'no-multi-assign': 'error',
      'no-new': 'off', // ?
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-object-constructor': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'error',
      'no-proto': 'error',
      'no-restricted-exports': 'error',
      'no-restricted-globals': 'error',
      'no-restricted-imports': 'off', // ! @typescript-eslint
      'no-restricted-properties': 'error',
      'no-restricted-syntax': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-shadow': 'off', // ! @typescript-eslint
      'no-throw-literal': 'error',
      'no-unused-expressions': 'off', // ! @typescript-eslint
      'no-useless-call': 'error',
      'no-useless-constructor': 'off', // ! @typescript-eslint
      'no-useless-rename': 'error',
      'no-useless-return': 'off', // TODO: conflict @typescript-eslint
      'no-var': 'error',
      'no-with': 'error',

      'prefer-const': 'error',
      'prefer-named-capture-group': 'off', // ?
      'prefer-object-has-own': 'error',
      'prefer-promise-reject-errors': 'off', // ! @typescript-eslint
      'prefer-regex-literals': 'error',
      'prefer-rest-params': 'error',
      'preserve-caught-error': 'error',

      'radix': 'error',
      'require-await': 'off', // ! @typescript-eslint
      'require-unicode-regexp': 'off', // ?
      'symbol-description': 'error'
    }
  }
]);

export default config;
