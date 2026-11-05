import { createKnipConfig } from '@ankhorage/devtools/knip';

export default createKnipConfig({
  entry: ['src/index.ts', 'src/cli/index.ts', 'src/cli/bin.ts', 'paradox.config.ts'],
  ignoreFiles: ['eslint.config.mjs', '.prettierrc.js'],
});
