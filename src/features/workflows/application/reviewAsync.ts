import { randomUUID } from 'node:crypto';

import type { AiConfig, AiRun } from '../../../types/ai.js';
import { invokeAgentAsync } from '../adapters/invokeAgentAsync.js';
import { writeArtifactAsync } from '../adapters/writeArtifactAsync.js';

/*** Review the actual workspace through a read-only AI CLI invocation. */
export async function reviewAsync(root: string, config: AiConfig): Promise<AiRun> {
  const prompt = [
    'Perform a read-only independent code review of the current working tree and branch diff.',
    'Read AGENTS.md and the relevant repository-local skills. Never modify files.',
    'Prioritize correctness, architecture, security, regressions, public API, tests and changesets.',
    'Report findings with severity, file/line evidence, and actionable fixes. If none, explicitly state no findings.',
  ].join('\n\n');
  const result = await invokeAgentAsync(root, config.defaultAgent, prompt, false);
  const run: AiRun = {
    schemaVersion: 1,
    id: randomUUID(),
    command: 'review',
    agent: config.defaultAgent,
    createdAt: new Date().toISOString(),
    output: result.output,
    exitCode: result.exitCode,
  };
  await writeArtifactAsync(root, 'reviews/latest.json', run);
  await writeArtifactAsync(root, 'reviews/' + run.id + '.json', run);
  return run;
}
