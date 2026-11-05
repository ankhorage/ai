import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { AiConfig } from '../../../types/ai.js';
import { addMcpAsync } from './addMcpAsync.js';

const config: AiConfig = {
  schemaVersion: 1,
  project: { name: 'demo', architecture: 'hexagonal', languages: ['typescript'], packageManagers: ['bun'] },
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
    await expect(readFile(join(root, '.mcp.json'), 'utf8')).rejects.toThrow();
    const applied = await addMcpAsync(root, config, 'docs', 'https://example.com/mcp', true);
    expect(applied.length).toBe(4);
    expect(JSON.parse(await readFile(join(root, '.mcp.json'), 'utf8')).mcpServers.docs.url).toBe('https://example.com/mcp');
    expect((await readFile(join(root, '.codex/config.toml'), 'utf8'))).toContain('[mcp_servers.docs]');
    await expect(addMcpAsync(root, config, 'docs', 'https://example.com/mcp', true)).rejects.toThrow(/already exists/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('rejects URL credentials and insecure transports', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ankh-ai-mcp-'));
  try {
    await expect(addMcpAsync(root, config, 'docs', 'http://example.com', false)).rejects.toThrow(/HTTPS/);
    await expect(addMcpAsync(root, config, 'docs', 'https://user:pass@example.com', false)).rejects.toThrow(/credentials/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
