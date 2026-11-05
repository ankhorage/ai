import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';
import { detectAgentAsync } from '../../features/agents/adapters/detectAgentAsync.js';

/*** Show the real availability and declared feature support of AI adapters. */
export async function agents(_root: string, _argv: readonly string[], output: (text: string) => void): Promise<number> {
  const rows = await Promise.all(agentCatalog.map(async (agent) => ({ ...agent, ...(await detectAgentAsync(agent.id)) })));
  for (const row of rows) output(row.displayName + ': ' + (row.installed ? 'installed' : 'not installed') + ' | headless: ' + row.execution + ' | features: ' + row.features.join(', ') + '\n');
  return 0;
}
