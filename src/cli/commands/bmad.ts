import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

/*** Integrate the official stable BMAD installer without claiming ownership of upstream workflows. */
export async function bmad(root: string, argv: readonly string[], output: (text: string) => void): Promise<number> {
  const command = argv[0] ?? 'status';
  if (command === 'status') {
    const installed = await access(join(root, '_bmad')).then(() => true, () => false);
    output('BMAD runtime: ' + (installed ? 'present' : 'missing') + '\n');
    output('Stable: v6.12 (npx bmad-method@6.12 install); v7 remains preview.\n');
    return installed ? 0 : 2;
  }
  if (command === 'party') {
    output('Open your configured AI coding tool and invoke its installed /bmad-party-mode skill.\n');
    output('Native BMAD Party Mode runs inside the upstream tool; this command does not simulate a multi-agent session.\n');
    return 0;
  }
  if (command !== 'install') throw new Error('Usage: ankh ai bmad [status|install --approve|party]');
  if (!argv.includes('--approve')) {
    output('Will launch official BMAD v6.12 interactive installer using npx bmad-method@6.12 install.\n');
    output('This downloads and executes third-party code. Inspect https://github.com/bmad-code-org/BMAD-METHOD before approving.\n');
    return 0;
  }
  if (!process.stdin.isTTY) throw new Error('BMAD installer requires an interactive terminal.');
  return await new Promise((resolve, reject) => {
    const processHandle = spawn('npx', ['bmad-method@6.12', 'install'], { cwd: root, shell: false, stdio: 'inherit' });
    processHandle.once('error', reject);
    processHandle.once('close', (exitCode) => resolve(exitCode ?? 1));
  });
}
