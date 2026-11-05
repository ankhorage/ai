import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { ManagedArtifact, SetupChange } from '../../../types/ai.js';
import { assertSafePathAsync } from '../adapters/assertSafePathAsync.js';
import { readManagedRecordAsync } from '../adapters/readManagedRecordAsync.js';
import { inspectManagedArtifactsAsync } from './inspectManagedArtifactsAsync.js';
import { hashArtifact } from '../utils/hashArtifact.js';

/*** Apply an approved setup atomically per file with fingerprint and backup protection. */
export async function applyManagedArtifactsAsync(root: string, artifacts: readonly ManagedArtifact[], dryRun: boolean): Promise<readonly SetupChange[]> {
  const changes = await inspectManagedArtifactsAsync(root, artifacts);
  if (dryRun || changes.every((change) => change.action === 'unchanged')) return changes;
  if (changes.some((change) => change.action === 'conflict')) return changes;
  const existing = await readManagedRecordAsync(root);
  const updated = Object.fromEntries(artifacts.map((artifact) => [artifact.path, hashArtifact(artifact.content)]));
  const backupId = randomUUID();
  const backupRoot = join(root, '.ankh/ai/backups', backupId);
  await mkdir(backupRoot, { recursive: true });
  const previous = changes.filter((change) => change.action === 'update');
  await Promise.all(previous.map(async (change) => {
    const source = await assertSafePathAsync(root, change.path);
    const target = join(backupRoot, change.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await readFile(source));
  }));
  await writeFile(join(backupRoot, 'previous.json'), JSON.stringify({
    schemaVersion: 1,
    files: existing.files,
    changes,
  }, null, 2) + '\n');
  for (const artifact of artifacts) {
    const change = changes.find((item) => item.path === artifact.path);
    if (change?.action === 'unchanged') continue;
    const path = await assertSafePathAsync(root, artifact.path);
    await mkdir(dirname(path), { recursive: true });
    const temporary = path + '.ankh-' + randomUUID();
    await writeFile(temporary, artifact.content, { mode: 0o600, flag: 'wx' });
    await rename(temporary, path);
  }
  const managedPath = join(root, '.ankh/ai/managed.json');
  await mkdir(dirname(managedPath), { recursive: true });
  const temporary = managedPath + '.' + randomUUID();
  await writeFile(temporary, JSON.stringify({ schemaVersion: 1, files: { ...existing.files, ...updated } }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  await rename(temporary, managedPath);
  return changes;
}
