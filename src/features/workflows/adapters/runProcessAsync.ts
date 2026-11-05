import { spawn } from 'node:child_process';

/*** Run an explicitly selected executable without a shell and with bounded output/time. */
export async function runProcessAsync(
  binary: string,
  args: readonly string[],
  root: string,
  stdin: string | null = null,
): Promise<{ exitCode: number; output: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(binary, [...args], {
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env: process.env,
    });
    const chunks: Buffer[] = [];
    const maxBytes = 4 * 1024 * 1024;
    const timeout = setTimeout(() => child.kill('SIGTERM'), 20 * 60 * 1000);
    let total = 0;
    let limited = false;
    child.stdout.on('data', (data: Buffer) => {
      total += data.length;
      if (total <= maxBytes) chunks.push(data);
      else {
        limited = true;
        child.kill('SIGTERM');
      }
    });
    child.stderr.on('data', (data: Buffer) => {
      total += data.length;
      if (total <= maxBytes) chunks.push(data);
      else {
        limited = true;
        child.kill('SIGTERM');
      }
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        exitCode: limited ? 2 : (code ?? 1),
        output:
          Buffer.concat(chunks).toString('utf8') + (limited ? '\nOUTPUT_LIMIT_EXCEEDED\n' : ''),
      });
    });
    child.stdin.on('error', () => undefined);
    child.stdin.end(stdin ?? '');
  });
}
