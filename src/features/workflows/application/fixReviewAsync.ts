import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AiConfig, AiRun } from '../../../types/ai.js';
import { ensureWorkBranchAsync } from '../adapters/ensureWorkBranchAsync.js';
import { invokeAgentAsync } from '../adapters/invokeAgentAsync.js';
import { writeArtifactAsync } from '../adapters/writeArtifactAsync.js';

/*** Fix findings from a persisted review only after explicit approval. */
export async function fixReviewAsync(root: string, config: AiConfig, approved: boolean): Promise<AiRun> {
  if (!approved) throw new Error('Explicit --approve is required for fixes.');
  await ensureWorkBranchAsync(root);
  const review: AiRun = JSON.parse(await readFile(join(root, '.ankh/ai/reviews/latest.json'), 'utf8')) as AiRun;
  if (review.command !== 'review' || review.exitCode !== 0) throw new Error('A successful review is required before fixing findings.');
  const prompt = 'Fix only actionable findings from the following review. Follow AGENTS.md and relevant skills. Do not commit or push.\n\n' + review.output;
  const result = await invokeAgentAsync(root, config.defaultAgent, prompt, true);
  const run: AiRun = {
    schemaVersion: 1,
    id: randomUUID(),
    command: 'fix',
    agent: config.defaultAgent,
    createdAt: new Date().toISOString(),
    output: result.output,
    exitCode: result.exitCode,
  };
  await writeArtifactAsync(root, 'runs/' + run.id + '.json', run);
  return run;
}
