import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { applyManagedArtifactsAsync } from '../../features/setup/application/applyManagedArtifactsAsync.js';
import { buildManagedArtifacts } from '../../features/setup/domain/buildManagedArtifacts.js';

/*** Synchronize AI-owned files without overwriting user modifications. */
export async function sync(
  root: string,
  argv: readonly string[],
  output: (text: string) => void,
): Promise<number> {
  const config = await readConfigAsync(root);
  if (config === null) throw new Error('Run ankh ai init first.');
  const changes = await applyManagedArtifactsAsync(
    root,
    buildManagedArtifacts(config),
    argv.includes('--dry-run'),
  );
  changes.forEach((change) => output(change.action + ' ' + change.path + '\n'));
  if (changes.some((change) => change.action === 'conflict')) {
    output('Refused to overwrite external edits. Resolve the conflicts manually.\n');
    return 2;
  }
  return 0;
}
