import { createKnipConfig } from '@ankhorage/devtools/knip';

export default createKnipConfig({
  entry: ['paradox.config.ts'],
  ignoreFiles: ['eslint.config.mjs', '.prettierrc.js'],
});
