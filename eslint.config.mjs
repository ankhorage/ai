import { createConfig } from '@ankhorage/devtools/eslint';

export default createConfig({
  files: ['src/**/*.ts'],
  project: ['./tsconfig.json'],
  tsconfigRootDir: import.meta.dirname,
});
