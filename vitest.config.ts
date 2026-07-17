/** @format */

import { defineConfig, type ViteUserConfig } from 'vitest/config';

const viteUserConfig: Readonly<ViteUserConfig> = defineConfig({
  resolve: { tsconfigPaths: true },
  test: { name: { label: 'Testge', color: 'cyan' }, logHeapUsage: true }
});

export default viteUserConfig;
