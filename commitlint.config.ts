/** @format */

import type { UserConfig } from '@commitlint/types';

const userConfig: Readonly<UserConfig> = {
  extends: ['@commitlint/config-conventional'],
  formatter: '@commitlint/format',
  helpUrl:
    'https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/config-conventional/README.md'
};

export default userConfig;
