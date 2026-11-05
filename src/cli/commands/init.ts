import { basename } from 'node:path';
import { createInterface } from 'node:readline/promises';

import { inspectProjectAsync } from '@ankhorage/project-detector/node';

import type { AiConfig, AgentId, WorkflowId } from '../../types/ai.js';
import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';
import { applyManagedArtifactsAsync } from '../../features/setup/application/applyManagedArtifactsAsync.js';
import { inspectManagedArtifactsAsync } from '../../features/setup/application/inspectManagedArtifactsAsync.js';
import { buildManagedArtifacts } from '../../features/setup/domain/buildManagedArtifacts.js';
import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { writeConfigAsync } from '../../features/config/adapters/writeConfigAsync.js';
import { detectAgentAsync } from '../../features/agents/adapters/detectAgentAsync.js';

/*** Inspect project evidence and guide an approval-gated AI setup. */
export async function init(
  root: string, argv: readonly string[], output: (text: string) => void,
): Promise<number> {
  if (await readConfigAsync(root) !== null) throw new Error('AI is already initialized. Run ankh ai sync instead.');
  const dryRun = argv.includes('--dry-run');
  const yes = argv.includes('--yes');
  const available = await Promise.all(agentCatalog.map((agent) => detectAgentAsync(agent.id)));
  const known = available.filter((agent) => agent.installed).map((agent) => agent.id);
  const explicit = readOption(argv, '--agents');
  const workflowFlag = readOption(argv, '--workflow');
  const selected = explicit === null ? known : explicit.split(',').map((id) => id.trim());
  const agents = selected.filter((id): id is AgentId => agentCatalog.some((entry) => entry.id === id));
  if (agents.length !== selected.length || new Set(agents).size !== agents.length) throw new Error('Invalid --agents list (codex,claude-code,cursor,gemini).');
  if (workflowFlag !== null && workflowFlag !== 'standard' && workflowFlag !== 'bmad') throw new Error('Invalid --workflow (standard or bmad).');
  const ui = process.stdin.isTTY && !yes && !dryRun ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  try {
    output('Ankhorage AI Setup\n');
    output('Detected installed agents: ' + (known.join(', ') || 'none') + '\n');
    const chosen = ui === null ? agents : chooseAgents(await ui.question('Agents (comma-separated, default ' + agents.join(',') + '): '), agents);
    if (chosen.length === 0) throw new Error('Choose at least one agent. Use --agents codex,claude-code for headless init.');
    const workflowValue = ui === null ? (workflowFlag ?? 'standard') : (await ui.question('Methodology [standard/bmad] (standard): ')).trim() || (workflowFlag ?? 'standard');
    if (workflowValue !== 'standard' && workflowValue !== 'bmad') throw new Error('Invalid workflow.');
    const detection = await inspectProjectAsync(root);
    if (!detection.complete) throw new Error('Project inspection incomplete; refusing to persist incomplete metadata.');
    const config: AiConfig = {
      schemaVersion: 1,
      project: {
        name: detection.packages[0]?.name ?? basename(root),
        architecture: 'unspecified',
        languages: detection.detection.languages.map((language) => language.id),
        packageManagers: detection.detection.packageManagers,
      },
      agents: chosen,
      defaultAgent: chosen[0]!,
      workflow: workflowValue as WorkflowId,
      security: { requireExecutionApproval: true, requireReview: true, protectMain: true },
    };
    const artifacts = buildManagedArtifacts(config);
    const changes = await inspectManagedArtifactsAsync(root, artifacts);
    output('Project: ' + config.project.name + ' [' + config.project.languages.join(', ') + ']\n');
    output('Agents: ' + chosen.join(', ') + ' | Workflow: ' + config.workflow + '\n');
    for (const change of changes) output('  ' + change.action + ' ' + change.path + '\n');
    if (changes.some((change) => change.action === 'conflict')) throw new Error('Existing custom files conflict; nothing was written.');
    if (dryRun) { output('Dry run: no files written.\n'); return 0; }
    const confirmed = yes || (ui !== null && (await ui.question('Apply setup? [y/N] ')).trim().toLowerCase() === 'y');
    if (!confirmed) { output('Setup cancelled. Use --yes for non-interactive setup.\n'); return 0; }
    await writeConfigAsync(root, config);
    await applyManagedArtifactsAsync(root, artifacts, false);
    output('AI setup applied. Run ankh ai doctor and ankh ai cheatsheet.\n');
    output('Canonical AGENTS.md and shared repository skills remain owned by @ankhorage/devtools.\n');
    if (config.workflow === 'bmad') output('BMAD selected; install and configure the upstream BMAD tooling separately. No BMAD installation is implied.\n');
    return 0;
  } finally {
    ui?.close();
  }
}

/*** Parse a value following one CLI option. */
function readOption(argv: readonly string[], key: string): string | null {
  const index = argv.indexOf(key);
  return index < 0 ? null : argv[index + 1] ?? null;
}

/*** Validate the agent list entered in the interactive wizard. */
function chooseAgents(text: string, defaults: readonly AgentId[]): AgentId[] {
  if (!text.trim()) return [...defaults];
  const ids = text.split(',').map((id) => id.trim());
  if (new Set(ids).size !== ids.length || ids.some((id) => !agentCatalog.some((agent) => agent.id === id))) throw new Error('Invalid agent selection.');
  return ids as AgentId[];
}
