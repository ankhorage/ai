import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ManagedRecord } from '../../../types/ai.js';

/*** Read fingerprints of files previously written by Ankhorage AI. */
export async function readManagedRecordAsync(root: string): Promise<ManagedRecord> {
  try {
    const value: unknown = JSON.parse(await readFile(join(root, '.ankh/ai/managed.json'), 'utf8'));
    if (typeof value !== 'object' || value === null || !('schemaVersion' in value) || value.schemaVersion !== 1 ||
        !('files' in value) || typeof value.files !== 'object' || value.files === null || Array.isArray(value.files)) {
      throw new Error('Invalid managed.json: refusing to overwrite unknown state.');
    }
    const { files } = value;
    if (Object.values(files).some((hash) => typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash))) throw new Error('Invalid managed fingerprints.');
    return { schemaVersion: 1, files: files as Record<string, string> };
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return { schemaVersion: 1, files: {} };
    throw error;
  }
}
