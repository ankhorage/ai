import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { detectAgentAsync } from '../../features/agents/adapters/detectAgentAsync.js';
import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';
import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { inspectManagedArtifactsAsync } from '../../features/setup/application/inspectManagedArtifactsAsync.js';
import { buildManagedArtifacts } from '../../features/setup/domain/buildManagedArtifacts.js';

/*** Check actual prerequisites and distinguish errors from optional integrations. */
export async function doctor(
  root: string,
  _argv: readonly string[],
  output: (text: string) => void,
): Promise<number> {
  const config = await readConfigAsync(root);
  if (config === null) {
    output('FAIL Missing .ankh/ai.yaml; run ankh ai init.\n');
    return 2;
  }
  const agents = await Promise.all(config.agents.map((agent) => detectAgentAsync(agent)));
  const artifacts = await inspectManagedArtifactsAsync(root, buildManagedArtifacts(config));
  const problems = [
    ...agents
      .filter((agent) => !agent.installed)
      .map((agent) => 'Agent executable missing: ' + agent.binary),
    ...artifacts
      .filter((change) => change.action !== 'unchanged')
      .map((change) => 'Drift: ' + change.action + ' ' + change.path),
  ];
  const defaultAgent = agentCatalog.find((agent) => agent.id === config.defaultAgent);
  if (defaultAgent?.execution !== 'supported')
    problems.push('Default agent is not supported for headless workflow execution.');
  try {
    await access(join(root, 'AGENTS.md'));
  } catch {
    problems.push(
      'AGENTS.md missing. Run ankh devtools agents sync for managed Ankhorage repositories.',
    );
  }
  try {
    await access(join(root, '.agents/skills'));
  } catch {
    problems.push(
      'Repository-local skills missing. Run ankh devtools skills sync when applicable.',
    );
  }
  if (config.workflow === 'bmad')
    output(
      'INFO BMAD configured; upstream BMAD installation and party mode must be verified in the provider UI.\n',
    );
  for (const problem of problems) output('WARN ' + problem + '\n');
  if (problems.length === 0) output('PASS AI setup is consistent for selected agents.\n');
  return problems.length > 0 ? 2 : 0;
}
