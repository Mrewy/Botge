/** @format */

import type { Config } from 'prettier';

const config: Readonly<Config> = {
  endOfLine: 'lf',
  insertPragma: true,
  plugins: ['prettier-plugin-sh'],
  printWidth: 120,
  quoteProps: 'consistent',
  semi: true,
  singleQuote: true,
  trailingComma: 'none'
};

export default config;
