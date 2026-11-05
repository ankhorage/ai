import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from 'bun:test';

import type { AiConfig } from '../../../types/ai.js';
import { addMcpAsync } from './addMcpAsync.js';

const config: AiConfig = {
  schemaVersion: 1,
  project: {
    name: 'demo',
    architecture: 'hexagonal',
    languages: ['typescript'],
    packageManagers: ['bun'],
  },
  agents: ['claude-code', 'codex', 'gemini', 'cursor'],
  defaultAgent: 'codex',
  workflow: 'standard',
  security: { requireExecutionApproval: true, requireReview: true, protectMain: true },
};

test('MCP preview is non-destructive and approval writes native configs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ankh-ai-mcp-'));
  try {
    const preview = await addMcpAsync(root, config, 'docs', 'https://example.com/mcp', false);
    expect(preview.length).toBe(4);
    const missing = await readFile(join(root, '.mcp.json'), 'utf8').then(
      () => false,
      () => true,
    );
    expect(missing).toBe(true);
    const applied = await addMcpAsync(root, config, 'docs', 'https://example.com/mcp', true);
    expect(applied.length).toBe(4);
    expect(JSON.parse(await readFile(join(root, '.mcp.json'), 'utf8')) as unknown).toEqual({
      mcpServers: { docs: { type: 'http', url: 'https://example.com/mcp' } },
    });
    expect(await readFile(join(root, '.codex/config.toml'), 'utf8')).toContain(
      '[mcp_servers.docs]',
    );
    const duplicate = await addMcpAsync(root, config, 'docs', 'https://example.com/mcp', true).then(
      () => null,
      (reason: unknown) => String(reason),
    );
    expect(duplicate).toContain('already exists');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects URL credentials and insecure transports', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ankh-ai-mcp-'));
  try {
    const insecure = await addMcpAsync(root, config, 'docs', 'http://example.com', false).then(
      () => null,
      (reason: unknown) => String(reason),
    );
    expect(insecure).toContain('HTTPS');
    const credentials = await addMcpAsync(
      root,
      config,
      'docs',
      '***example.com',
      false,
    ).then(
      () => null,
      (reason: unknown) => String(reason),
    );
    expect(credentials).toContain('credentials');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
