import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',
  docs: {
    title: '@ankhorage/ai',
    description: 'Universal agentic project setup and AI workflows for Ankhorage.',
  },
  package: {
    root: '.',
    entrypoints: ['src/index.ts'],
  },
  output: { dir: './paradox' },
});
