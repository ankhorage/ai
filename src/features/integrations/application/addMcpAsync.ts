import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { AiConfig, AgentId } from '../../../types/ai.js';
import { assertSafePathAsync } from '../../setup/adapters/assertSafePathAsync.js';

interface McpCandidate {
  readonly path: string;
  readonly before: string | null;
  readonly after: string;
}

/*** Preview and safely register one explicit HTTPS MCP endpoint in selected agent configs. */
export async function addMcpAsync(
  root: string,
  config: AiConfig,
  name: string,
  urlText: string,
  approved: boolean,
): Promise<readonly { readonly path: string; readonly action: 'create' | 'update' }[]> {
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(name)) throw new Error('MCP server name must use lowercase letters, digits and hyphens.');
  const url = new URL(urlText);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('MCP endpoint must be HTTPS without embedded credentials, query parameters or fragments.');
  }
  const candidates = await Promise.all(config.agents.map(async (agent) => await buildCandidate(root, agent, name, url.href)));
  const report = candidates.map((candidate) => ({ path: candidate.path, action: candidate.before === null ? 'create' as const : 'update' as const }));
  if (!approved) return report;
  const backupRoot = join(root, '.ankh/ai/mcp-backups', new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID());
  await mkdir(backupRoot, { recursive: true });
  for (const candidate of candidates) {
    if (candidate.before !== null) {
      const target = join(backupRoot, candidate.path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, candidate.before, { mode: 0o600 });
    }
  }
  await writeFile(join(backupRoot, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
  for (const candidate of candidates) {
    const target = await assertSafePathAsync(root, candidate.path);
    const current = await readIfPresent(target);
    if (current !== candidate.before) throw new Error('MCP config changed during operation: ' + candidate.path);
    await mkdir(dirname(target), { recursive: true });
    const temporary = target + '.ankh-' + randomUUID();
    await writeFile(temporary, candidate.after, { flag: 'wx', mode: 0o600 });
    await rename(temporary, target);
  }
  return report;
}

/*** Generate a provider-native MCP candidate without executing remote code. */
async function buildCandidate(root: string, agent: AgentId, name: string, url: string): Promise<McpCandidate> {
  const path = agent === 'claude-code' ? '.mcp.json' : agent === 'cursor' ? '.cursor/mcp.json' :
    agent === 'codex' ? '.codex/config.toml' : '.gemini/settings.json';
  const target = await assertSafePathAsync(root, path);
  const before = await readIfPresent(target);
  if (agent === 'codex') {
    const heading = '[mcp_servers.' + name + ']';
    if (before?.includes(heading)) throw new Error('MCP server already exists in ' + path + ': ' + name);
    return { path, before, after: (before ?? '').trimEnd() + '\n\n' + heading + '\nurl = ' + JSON.stringify(url) + '\n' };
  }
  const config: unknown = before === null ? {} : JSON.parse(before);
  if (!record(config)) throw new Error('Invalid object in ' + path);
  const existing = config.mcpServers;
  if (existing !== undefined && !record(existing)) throw new Error('Invalid mcpServers in ' + path);
  const servers = existing === undefined ? {} : existing;
  if (Object.hasOwn(servers, name)) throw new Error('MCP server already exists in ' + path + ': ' + name);
  const entry = agent === 'gemini' ? { httpUrl: url } : agent === 'claude-code' ? { type: 'http', url } : { url };
  return {
    path, before,
    after: JSON.stringify({ ...config, mcpServers: { ...servers, [name]: entry } }, null, 2) + '\n',
  };
}

/*** Read optional existing config for safe merge planning. */
async function readIfPresent(path: string): Promise<string | null> {
  try { return await readFile(path, 'utf8'); }
  catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return null;
    throw error;
  }
}

/*** Narrow parsed JSON to a plain object. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
