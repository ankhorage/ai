import { randomUUID } from 'node:crypto';

import type { AiConfig, AiPlan } from '../../../types/ai.js';
import { invokeAgentAsync } from '../adapters/invokeAgentAsync.js';
import { writeArtifactAsync } from '../adapters/writeArtifactAsync.js';

/*** Generate a persistent plan from an actual read-only AI CLI invocation. */
export async function createPlanAsync(root: string, config: AiConfig, goal: string): Promise<AiPlan> {
  if (!goal.trim()) throw new Error('A goal is required: ankh ai plan "..."');
  const prompt = [
    'You are planning a code change, not implementing it. Do not modify files.',
    'Read AGENTS.md and choose relevant repository-local skills. Follow Ankhorage project architecture.',
    'Return a concrete implementation plan with scope, files, testing, risks and acceptance criteria.',
    'Goal: ' + goal,
  ].join('\n\n');
  const result = await invokeAgentAsync(root, config.defaultAgent, prompt, false);
  if (result.exitCode !== 0 || !result.output.trim()) throw new Error('Agent planning failed:\n' + result.output);
  const plan: AiPlan = {
    schemaVersion: 1,
    kind: 'ankh-ai-plan',
    id: randomUUID(),
    goal,
    agent: config.defaultAgent,
    createdAt: new Date().toISOString(),
    instructions: result.output,
    status: 'proposed',
  };
  await writeArtifactAsync(root, 'plans/' + plan.id + '.json', plan);
  return plan;
}
