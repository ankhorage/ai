import { runProcessAsync } from './runProcessAsync.js';

/*** Refuse agent writes on protected branches and outside Git worktrees. */
export async function ensureWorkBranchAsync(root: string): Promise<void> {
  const result = await runProcessAsync('git', ['branch', '--show-current'], root);
  const name = result.output.trim();
  if (result.exitCode !== 0 || !name || name === 'main' || name === 'master') {
    throw new Error(
      'Execution requires a dedicated feature branch, not main/master or detached HEAD.',
    );
  }
}
