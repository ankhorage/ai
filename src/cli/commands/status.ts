import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { detectAgentAsync } from '../../features/agents/adapters/detectAgentAsync.js';
import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';
import { inspectManagedArtifactsAsync } from '../../features/setup/application/inspectManagedArtifactsAsync.js';
import { buildManagedArtifacts } from '../../features/setup/domain/buildManagedArtifacts.js';

/*** Report actual agent availability and AI-managed project drift. */
export async function status(root: string, argv: readonly string[], output: (text: string) => void): Promise<number> {
  const config = await readConfigAsync(root);
  if (config === null) { output('Not initialized. Run ankh ai init.\n'); return 2; }
  const installed = await Promise.all(config.agents.map((id) => detectAgentAsync(id)));
  const drift = await inspectManagedArtifactsAsync(root, buildManagedArtifacts(config));
  const report = {
    project: config.project,
    workflow: config.workflow,
    defaultAgent: config.defaultAgent,
    agents: installed.map((agent) => ({
      ...agent,
      execution: agentCatalog.find((entry) => entry.id === agent.id)?.execution ?? 'unsupported',
    })),
    files: drift,
  };
  output(argv.includes('--json') ? JSON.stringify(report, null, 2) + '\n' : [
    'Project: ' + config.project.name + ' (' + config.workflow + ')',
    'Default agent: ' + config.defaultAgent,
    ...report.agents.map((agent) => agent.id + ': ' + (agent.installed ? 'installed' : 'missing') + ' / ' + agent.execution),
    'Managed files: ' + drift.length + '; drift: ' + drift.filter((change) => change.action !== 'unchanged').length,
    ...drift.filter((change) => change.action !== 'unchanged').map((change) => '  ' + change.action + ' ' + change.path),
  ].join('\n') + '\n');
  return drift.some((change) => change.action === 'conflict') ? 2 : 0;
}
