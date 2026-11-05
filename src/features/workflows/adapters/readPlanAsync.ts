import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AiPlan } from '../../../types/ai.js';

/*** Load a stored plan by an opaque path-safe identifier. */
export async function readPlanAsync(root: string, id: string): Promise<AiPlan> {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid plan ID.');
  const value: unknown = JSON.parse(
    await readFile(join(root, '.ankh/ai/plans', id + '.json'), 'utf8'),
  );
  if (
    typeof value !== 'object' ||
    value === null ||
    !('kind' in value) ||
    value.kind !== 'ankh-ai-plan' ||
    !('instructions' in value) ||
    typeof value.instructions !== 'string' ||
    !('status' in value) ||
    !['proposed', 'approved', 'executed'].includes(String(value.status))
  ) {
    throw new Error('Invalid stored plan.');
  }
  return value as AiPlan;
}
