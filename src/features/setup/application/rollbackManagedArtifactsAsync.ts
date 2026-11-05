import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { SetupChange } from '../../../types/ai.js';
import { assertSafePathAsync } from '../adapters/assertSafePathAsync.js';
import { readManagedRecordAsync } from '../adapters/readManagedRecordAsync.js';
import { hashArtifact } from '../utils/hashArtifact.js';

/*** Roll back the latest managed write only when current fingerprints are intact. */
export async function rollbackManagedArtifactsAsync(root: string): Promise<string> {
  const location = join(root, '.ankh/ai/backups');
  const ids = (await readdir(location)).sort();
  const id = ids.at(-1);
  if (id === undefined) throw new Error('No setup backup found.');
  const backup = join(location, id);
  const raw: unknown = JSON.parse(await readFile(join(backup, 'previous.json'), 'utf8'));
  if (!isBackup(raw)) throw new Error('Invalid backup manifest.');
  const record = await readManagedRecordAsync(root);
  for (const change of raw.changes) {
    if (change.action === 'unchanged') continue;
    const target = await assertSafePathAsync(root, change.path);
    const current = await readFile(target, 'utf8');
    if (record.files[change.path] !== hashArtifact(current))
      throw new Error('Cannot roll back modified file: ' + change.path);
  }
  for (const change of raw.changes) {
    const target = await assertSafePathAsync(root, change.path);
    if (change.action === 'create') await rm(target);
    if (change.action === 'update') {
      const temporary = target + '.ankh-' + randomUUID();
      await mkdir(dirname(target), { recursive: true });
      await writeFile(temporary, await readFile(join(backup, change.path)), { flag: 'wx' });
      await rename(temporary, target);
    }
  }
  const managed = join(root, '.ankh/ai/managed.json');
  await writeFile(managed, JSON.stringify({ schemaVersion: 1, files: raw.files }, null, 2) + '\n');
  await rm(backup, { recursive: true });
  return id;
}

/*** Validate backup metadata before interpreting any paths. */
function isBackup(
  value: unknown,
): value is { readonly files: Record<string, string>; readonly changes: SetupChange[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'files' in value &&
    typeof value.files === 'object' &&
    'changes' in value &&
    Array.isArray(value.changes) &&
    value.changes.every(
      (change: unknown) =>
        typeof change === 'object' &&
        change !== null &&
        'path' in change &&
        typeof change.path === 'string' &&
        'action' in change &&
        ['create', 'update', 'unchanged'].includes(String(change.action)),
    )
  );
}
