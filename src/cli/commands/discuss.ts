import { randomUUID } from 'node:crypto';

import { invokeAgentAsync } from '../../features/workflows/adapters/invokeAgentAsync.js';
import { writeArtifactAsync } from '../../features/workflows/adapters/writeArtifactAsync.js';
import type { AiConfig, AiRun } from '../../types/ai.js';

/*** Ask the configured agent for a read-only multi-perspective design discussion. */
export async function discuss(root: string, config: AiConfig, goal: string): Promise<AiRun> {
  if (config.workflow === 'bmad')
    throw new Error(
      'Native BMAD party mode must run through a verified installed upstream BMAD workflow; this adapter cannot claim BMAD execution.',
    );
  if (!goal.trim()) throw new Error('Topic required: ankh ai discuss "..."');
  const prompt = [
    'Discuss the topic from architect, implementer, QA and security perspectives. Do not modify files.',
    'This is a single-agent roundtable, not a claim of multiple independent AI agents.',
    'Read AGENTS.md and relevant project skills. Show disagreements, assumptions and recommendations.',
    'Topic: ' + goal,
  ].join('\n\n');
  const result = await invokeAgentAsync(root, config.defaultAgent, prompt, false);
  const run: AiRun = {
    schemaVersion: 1,
    id: randomUUID(),
    command: 'discuss',
    agent: config.defaultAgent,
    createdAt: new Date().toISOString(),
    output: result.output,
    exitCode: result.exitCode,
  };
  await writeArtifactAsync(root, 'runs/' + run.id + '.json', run);
  return run;
}
