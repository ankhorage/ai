import { randomUUID } from 'node:crypto';

import type { AiConfig, AiRun } from '../../../types/ai.js';
import { ensureWorkBranchAsync } from '../adapters/ensureWorkBranchAsync.js';
import { invokeAgentAsync } from '../adapters/invokeAgentAsync.js';
import { readPlanAsync } from '../adapters/readPlanAsync.js';
import { writeArtifactAsync } from '../adapters/writeArtifactAsync.js';

/*** Execute only an explicitly approved plan on an isolated feature branch. */
export async function executePlanAsync(
  root: string,
  config: AiConfig,
  id: string,
  approved: boolean,
): Promise<AiRun> {
  if (!approved) throw new Error('Explicit --approve is required for execution.');
  await ensureWorkBranchAsync(root);
  const plan = await readPlanAsync(root, id);
  if (plan.status === 'executed')
    throw new Error('Plan is already executed; create a new plan for more changes.');
  const prompt = [
    'Execute the following approved implementation plan. Respect AGENTS.md and all applicable .agents/skills.',
    'Keep changes scoped to the goal and provide exact validation evidence. Do not commit, push or open PRs.',
    'Goal: ' + plan.goal,
    'Plan:\n' + plan.instructions,
  ].join('\n\n');
  await writeArtifactAsync(root, 'plans/' + id + '.json', { ...plan, status: 'approved' });
  const result = await invokeAgentAsync(root, config.defaultAgent, prompt, true);
  const run: AiRun = {
    schemaVersion: 1,
    id: randomUUID(),
    command: 'execute',
    agent: config.defaultAgent,
    planId: id,
    createdAt: new Date().toISOString(),
    output: result.output,
    exitCode: result.exitCode,
  };
  await writeArtifactAsync(root, 'runs/' + run.id + '.json', run);
  if (result.exitCode === 0)
    await writeArtifactAsync(root, 'plans/' + id + '.json', { ...plan, status: 'executed' });
  return run;
}
