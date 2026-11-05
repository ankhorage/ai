import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

import type { AiConfig } from '../../../types/ai.js';
import { validateConfig } from '../application/validateConfig.js';

/*** Read and validate user-owned YAML configuration without running project code. */
export async function readConfigAsync(root: string): Promise<AiConfig | null> {
  try {
    const text = await readFile(join(root, '.ankh/ai.yaml'), 'utf8');
    return validateConfig(parse(text) as unknown);
  } catch (error: unknown) {
    if (isMissing(error)) return null;
    throw error;
  }
}

/*** Distinguish absent configuration from malformed or inaccessible configuration. */
function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
