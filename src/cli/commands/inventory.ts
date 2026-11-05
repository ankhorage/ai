import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';

/*** Inventory project-local skills, MCP, plugins and hook locations without side effects. */
export async function inventory(
  root: string,
  kind: 'skills' | 'mcp' | 'plugins' | 'hooks',
  output: (text: string) => void,
): Promise<number> {
  const config = await readConfigAsync(root);
  if (config === null) throw new Error('Run ankh ai init first.');
  const candidates: Record<typeof kind, readonly string[]> = {
    skills: ['.agents/skills', '.claude/skills', '.cursor/skills', '.gemini/skills'],
    mcp: ['.mcp.json', '.cursor/mcp.json', '.codex/config.toml', '.gemini/settings.json'],
    plugins: ['.claude/plugins', '.cursor/plugins'],
    hooks: ['.claude/settings.json', '.codex/hooks.json', '.gemini/settings.json'],
  };
  for (const path of candidates[kind]) {
    const exists = await access(join(root, path)).then(() => true, () => false);
    output((exists ? 'present ' : 'missing ') + path + '\n');
  }
  for (const agent of agentCatalog.filter((item) => config.agents.includes(item.id)))
    output(agent.id + ': ' + (supports(agent.features, kind) ? 'platform supports capability' : 'not declared') + '\n');
  output('No remote installations were performed. Review each provider configuration and trust permissions separately.\n');
  return 0;
}

/*** Check a provider feature from a common readonly string vocabulary. */
function supports(features: readonly string[], kind: string): boolean {
  return features.includes(kind);
}
