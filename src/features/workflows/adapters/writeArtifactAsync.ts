import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/*** Persist structured workflow evidence using atomic temporary-file replacement. */
export async function writeArtifactAsync(root: string, relative: string, artifact: unknown): Promise<void> {
  const path = join(root, '.ankh/ai', relative);
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + '.' + randomUUID();
  await writeFile(temporary, JSON.stringify(artifact, null, 2) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  await rename(temporary, path);
}
