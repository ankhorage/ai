import { basename } from 'node:path';
import { createInterface, type Interface } from 'node:readline/promises';

import { inspectProjectAsync } from '@ankhorage/project-detector/node';

import { detectAgentAsync } from '../../features/agents/adapters/detectAgentAsync.js';
import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';
import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { writeConfigAsync } from '../../features/config/adapters/writeConfigAsync.js';
import { applyManagedArtifactsAsync } from '../../features/setup/application/applyManagedArtifactsAsync.js';
import { inspectManagedArtifactsAsync } from '../../features/setup/application/inspectManagedArtifactsAsync.js';
import { buildManagedArtifacts } from '../../features/setup/domain/buildManagedArtifacts.js';
import type { AgentId, AiConfig, SetupChange, WorkflowId } from '../../types/ai.js';

interface SetupSelection {
  readonly agents: readonly AgentId[];
  readonly workflow: WorkflowId;
}

/*** Inspect project evidence and guide an approval-gated AI setup. */
export async function init(
  root: string,
  argv: readonly string[],
  output: (text: string) => void,
): Promise<number> {
  const existing = await readConfigAsync(root);
  if (existing !== null) throw new Error('AI is already initialized. Run ankh ai sync instead.');
  const dryRun = argv.includes('--dry-run');
  const yes = argv.includes('--yes');
  const available = await Promise.all(agentCatalog.map((agent) => detectAgentAsync(agent.id)));
  const known = available.filter((agent) => agent.installed).map((agent) => agent.id);
  const ui =
    process.stdin.isTTY && !yes && !dryRun
      ? createInterface({ input: process.stdin, output: process.stdout })
      : null;
  try {
    output('Ankhorage AI Setup\n');
    output('Detected installed agents: ' + (known.join(', ') || 'none') + '\n');
    const selection = await selectSetupAsync(argv, known, ui);
    const config = await buildSetupConfigAsync(root, selection);
    const artifacts = buildManagedArtifacts(config);
    const changes = await inspectManagedArtifactsAsync(root, artifacts);
    showSetupPreview(output, config, changes);
    if (changes.some((change) => change.action === 'conflict')) {
      throw new Error('Existing custom files conflict; nothing was written.');
    }
    if (dryRun) {
      output('Dry run: no files written.\n');
      return 0;
    }
    const approved = yes || (await confirmSetupAsync(ui));
    if (!approved) {
      output('Setup cancelled. Use --yes for non-interactive setup.\n');
      return 0;
    }
    await applyManagedArtifactsAsync(root, artifacts, false);
    await writeConfigAsync(root, config);
    output('AI setup applied. Run ankh ai doctor and ankh ai cheatsheet.\n');
    output(
      'Canonical AGENTS.md and shared repository skills remain owned by @ankhorage/devtools.\n',
    );
    reportMethodology(output, config.workflow);
    return 0;
  } finally {
    ui?.close();
  }
}

/*** Capture agent and methodology choices in interactive or noninteractive mode. */
async function selectSetupAsync(
  argv: readonly string[],
  known: readonly AgentId[],
  ui: Interface | null,
): Promise<SetupSelection> {
  const agentFlag = readOption(argv, '--agents');
  const workflowFlag = readOption(argv, '--workflow') ?? 'standard';
  if (workflowFlag !== 'standard' && workflowFlag !== 'bmad') throw new Error('Invalid workflow.');
  const defaults = agentFlag === null ? [...known] : parseAgents(agentFlag);
  const agents =
    ui === null
      ? defaults
      : parseAgents(
          (
            await ui.question('Agents (comma-separated, default ' + defaults.join(',') + '): ')
          ).trim() || defaults.join(','),
        );
  if (agents.length === 0)
    throw new Error('Choose at least one agent using --agents codex,claude-code.');
  const rawWorkflow =
    ui === null
      ? workflowFlag
      : (await ui.question('Methodology [standard/bmad] (' + workflowFlag + '): ')).trim() ||
        workflowFlag;
  if (rawWorkflow !== 'standard' && rawWorkflow !== 'bmad') throw new Error('Invalid workflow.');
  return { agents, workflow: rawWorkflow };
}

/*** Inspect actual project metadata without executing untrusted project scripts. */
async function buildSetupConfigAsync(root: string, selection: SetupSelection): Promise<AiConfig> {
  const detection = await inspectProjectAsync(root);
  if (!detection.complete)
    throw new Error('Project inspection incomplete; refusing to persist incomplete metadata.');
  const [defaultAgent] = selection.agents;
  if (defaultAgent === undefined) throw new Error('An AI agent is required.');
  return {
    schemaVersion: 1,
    project: {
      name: detection.packages[0]?.name ?? basename(root),
      architecture: 'unspecified',
      languages: detection.detection.languages.map((language) => language.id),
      packageManagers: detection.detection.packageManagers,
    },
    agents: selection.agents,
    defaultAgent,
    workflow: selection.workflow,
    security: { requireExecutionApproval: true, requireReview: true, protectMain: true },
  };
}

/*** Ask for explicit consent after showing the complete setup diff. */
async function confirmSetupAsync(ui: Interface | null): Promise<boolean> {
  if (ui === null) return false;
  return (await ui.question('Apply setup? [y/N] ')).trim().toLowerCase() === 'y';
}

/*** Parse CLI option values without allowing missing arguments. */
function readOption(argv: readonly string[], key: string): string | null {
  const index = argv.indexOf(key);
  if (index < 0) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error('Missing value for ' + key);
  return value;
}

/*** Resolve configured AI identifiers from the supported catalog. */
function parseAgents(value: string): AgentId[] {
  const names = value.split(',').map((item) => item.trim());
  if (new Set(names).size !== names.length) throw new Error('Duplicate agent selection.');
  return names.map((name) => {
    const agent = agentCatalog.find((entry) => entry.id === name);
    if (agent === undefined) throw new Error('Invalid agent selection: ' + name);
    return agent.id;
  });
}

/*** Show project evidence and proposed file writes before requesting consent. */
function showSetupPreview(
  output: (text: string) => void,
  config: AiConfig,
  changes: readonly SetupChange[],
): void {
  output('Project: ' + config.project.name + ' [' + config.project.languages.join(', ') + ']\\n');
  output('Agents: ' + config.agents.join(', ') + ' | Workflow: ' + config.workflow + '\\n');
  changes.forEach((change) => output('  ' + change.action + ' ' + change.path + '\\n'));
}

/*** Report upstream methodology installation requirements without pretending it ran. */
function reportMethodology(output: (text: string) => void, workflow: WorkflowId): void {
  if (workflow !== 'bmad') return;
  output('BMAD selected. Install upstream BMAD explicitly via ankh ai bmad install --approve.\\n');
}
