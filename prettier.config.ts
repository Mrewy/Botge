/** @format */

import type { Config } from 'prettier';

const config: Readonly<Config> = {
  endOfLine: 'lf',
  experimentalOperatorPosition: 'start',
  experimentalTernaries: true,
  insertPragma: true,
  objectWrap: 'preserve',
  plugins: ['prettier-plugin-sh'],
  printWidth: 100,
  quoteProps: 'consistent',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false
};

export default config;
