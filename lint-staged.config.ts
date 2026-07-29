/** @format */

import type { Configuration } from 'lint-staged';

const configuration: Readonly<Configuration> = {
  '!(*.png)': 'cspell --no-summary --no-progress',
  '*': 'cspell --no-summary --no-progress',
  '*.ts': 'eslint --flag unstable_native_nodejs_ts_config --concurrency=auto',
  '*.md': 'markdownlint-cli2'
};

export default configuration;
