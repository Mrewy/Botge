/** @format */

import type { Configuration } from 'lint-staged';

const configuration: Configuration = {
  '!(*.png)': 'cspell',
  '*': 'cspell',
  '*.ts': 'eslint --flag unstable_native_nodejs_ts_config --concurrency=auto',
  '*.md': 'markdownlint-cli2'
};

export default configuration;
