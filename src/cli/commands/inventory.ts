import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';
import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';

type InventoryKind = 'skills' | 'mcp' | 'plugins' | 'hooks';

/*** Inventory project-local skills, MCP, plugins and hook locations without side effects. */
export async function inventory(root: string, kind: InventoryKind, output: (text: string) => void): Promise<number> {
  const config = await readConfigAsync(root);
  if (config === null) throw new Error('Run ankh ai init first.');
  for (const path of inventoryPaths(kind)) {
    const exists = await access(join(root, path)).then(() => true, () => false);
    output((exists ? 'present ' : 'missing ') + path + '\n');
  }
  for (const agent of agentCatalog.filter((item) => config.agents.includes(item.id))) {
    const features: readonly string[] = agent.features;
    output(agent.id + ': ' + (features.includes(kind) ? 'platform supports capability' : 'not declared') + '\n');
  }
  output('No remote installations were performed. Review each provider configuration and trust permissions separately.\n');
  return 0;
}

/*** Locate the known native provider configuration paths for one category. */
function inventoryPaths(kind: InventoryKind): readonly string[] {
  switch (kind) {
    case 'skills': return ['.agents/skills', '.claude/skills', '.cursor/skills', '.gemini/skills'];
    case 'mcp': return ['.mcp.json', '.cursor/mcp.json', '.codex/config.toml', '.gemini/settings.json'];
    case 'plugins': return ['.claude/plugins', '.cursor/plugins'];
    case 'hooks': return ['.claude/settings.json', '.codex/hooks.json', '.gemini/settings.json'];
  }
}
