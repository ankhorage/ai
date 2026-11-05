import { lstat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

/*** Reject path traversal and symlinks anywhere inside a managed destination. */
export async function assertSafePathAsync(root: string, relative: string): Promise<string> {
  const absoluteRoot = resolve(root);
  const absolute = resolve(absoluteRoot, relative);
  if (absolute === absoluteRoot || !absolute.startsWith(absoluteRoot + sep)) throw new Error('Unsafe managed path: ' + relative);
  const parts = relative.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) throw new Error('Invalid managed path: ' + relative);
  const prefixes = parts.map((_part, index) => join(absoluteRoot, ...parts.slice(0, index + 1)));
  await Promise.all(prefixes.map(async (candidate) => {
    try {
      const info = await lstat(candidate);
      if (info.isSymbolicLink()) throw new Error('Refusing managed symlink: ' + candidate);
      if (candidate === absolute && !info.isFile()) throw new Error('Managed destination is not a file: ' + candidate);
      if (candidate !== absolute && !info.isDirectory()) throw new Error('Managed parent is not a directory: ' + candidate);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return;
      throw error;
    }
  }));
  return absolute;
}
