import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { stringify } from 'yaml';

import type { AiConfig } from '../../../types/ai.js';

/*** Create the user-owned configuration exactly once; never overwrite edits. */
export async function writeConfigAsync(root: string, config: AiConfig): Promise<void> {
  await mkdir(join(root, '.ankh'), { recursive: true });
  await writeFile(join(root, '.ankh/ai.yaml'), stringify(config), {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });
}
