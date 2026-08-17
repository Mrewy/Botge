/** @format */

import type { Config } from 'prettier';
import * as prettierPluginSh from 'prettier-plugin-sh';

const config: Readonly<Config> = {
  endOfLine: 'lf',
  experimentalOperatorPosition: 'start',
  experimentalTernaries: true,
  insertPragma: true,
  objectWrap: 'collapse',
  plugins: [prettierPluginSh],
  printWidth: 100,
  quoteProps: 'consistent',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false
};

export default config;
