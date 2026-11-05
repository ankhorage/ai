import { readFile } from 'node:fs/promises';

import type { ManagedArtifact, SetupChange } from '../../../types/ai.js';
import { assertSafePathAsync } from '../adapters/assertSafePathAsync.js';
import { readManagedRecordAsync } from '../adapters/readManagedRecordAsync.js';
import { hashArtifact } from '../utils/hashArtifact.js';

/*** Compute idempotent setup changes and reject edits not owned by this tool. */
export async function inspectManagedArtifactsAsync(
  root: string,
  artifacts: readonly ManagedArtifact[],
): Promise<readonly SetupChange[]> {
  const record = await readManagedRecordAsync(root);
  const paths = artifacts.map((artifact) => artifact.path);
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate managed artifact path.');
  return await Promise.all(
    artifacts.map(async (artifact): Promise<SetupChange> => {
      const file = await assertSafePathAsync(root, artifact.path);
      try {
        const current = await readFile(file, 'utf8');
        if (hashArtifact(current) === hashArtifact(artifact.content))
          return { path: artifact.path, action: 'unchanged' };
        return {
          path: artifact.path,
          action: record.files[artifact.path] === hashArtifact(current) ? 'update' : 'conflict',
        };
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'ENOENT'
        )
          return { path: artifact.path, action: 'create' };
        throw error;
      }
    }),
  );
}
