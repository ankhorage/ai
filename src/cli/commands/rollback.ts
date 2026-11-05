import { rollbackManagedArtifactsAsync } from '../../features/setup/application/rollbackManagedArtifactsAsync.js';

/*** Restore previously AI-managed setup files without changing the user-owned manifest. */
export async function rollback(
  root: string,
  _argv: readonly string[],
  output: (text: string) => void,
): Promise<number> {
  const id = await rollbackManagedArtifactsAsync(root);
  output('Rolled back managed setup batch ' + id + '. User-owned ai.yaml remains unchanged.\n');
  return 0;
}
