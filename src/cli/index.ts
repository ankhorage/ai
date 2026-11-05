import metadata from '../../package.json' with { type: 'json' };

import type { AnkhRuntimeCommandProvider } from '@ankhorage/ankh';

import { runCliAsync } from './runCliAsync.js';

const names = [
  'init', 'sync', 'rollback', 'status', 'doctor', 'cheatsheet', 'agents',
  'skills', 'mcp', 'plugins', 'hooks', 'plan', 'execute', 'review', 'fix', 'ship', 'discuss',
] as const;

const provider = {
  id: '@ankhorage/ai',
  category: 'ai',
  version: metadata.version,
  capabilities: names.map((name) => ({
    id: 'ai.' + name,
    owner: '@ankhorage/ai',
    access: ['invoke'] as const,
    binding: { kind: 'action' as const, bindableAs: ['target'] as const },
    label: 'AI ' + name,
    description: 'Ankhorage AI ' + name,
  })),
  commands: names.map((name) => ({ path: [name], capability: 'ai.' + name, summary: 'Ankhorage AI ' + name })),
  handlers: names.map((name) => ({
    path: [name],
    handler: async (request: { argv: readonly string[]; context: { cwd: string; writeStdout(text: string): void; writeStderr(text: string): void } }) =>
      ({ exitCode: await runCliAsync([name, ...request.argv], request.context) }),
  })),
} satisfies AnkhRuntimeCommandProvider;

export default provider;
