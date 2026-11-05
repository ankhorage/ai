import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { AiConfig } from '../../../types/ai.js';
import { assertSafePathAsync } from '../../setup/adapters/assertSafePathAsync.js';
import { buildManagedArtifacts } from '../../setup/domain/buildManagedArtifacts.js';
import { hashArtifact } from '../../setup/utils/hashArtifact.js';
import { buildSessionHook } from '../domain/buildSessionHook.js';

interface HookCandidate {
  readonly path: string;
  readonly before: string | null;
  readonly after: string;
  readonly action: 'create' | 'update' | 'unchanged';
}

/*** Preview or enable safe project-local SessionStart guidance hooks. */
export async function enableSessionHooksAsync(root: string, config: AiConfig, approved: boolean): Promise<readonly HookCandidate[]> {
  await validateHookSourceAsync(root, config);
  const targets = config.agents.filter((agent) => agent === 'claude-code' || agent === 'gemini');
  const candidates = await Promise.all(targets.map(async (agent) => await buildCandidateAsync(root, agent)));
  if (!approved) return candidates;
  const backup = join(root, '.ankh/ai/hook-backups', new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID());
  await mkdir(backup, { recursive: true });
  for (const candidate of candidates) {
    if (candidate.before !== null && candidate.action === 'update') {
      const destination = join(backup, candidate.path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, candidate.before, { mode: 0o600 });
    }
  }
  for (const candidate of candidates) {
    if (candidate.action === 'unchanged') continue;
    const path = await assertSafePathAsync(root, candidate.path);
    const current = await readOptionalAsync(path);
    if (current !== candidate.before) throw new Error('Hook settings changed during setup: ' + candidate.path);
    await mkdir(dirname(path), { recursive: true });
    const temporary = path + '.ankh-' + randomUUID();
    await writeFile(temporary, candidate.after, { mode: 0o600, flag: 'wx' });
    await rename(temporary, path);
  }
  return candidates;
}

/*** Create a merged provider-native hook config while retaining user-owned settings. */
async function buildCandidateAsync(root: string, agent: 'claude-code' | 'gemini'): Promise<HookCandidate> {
  const hook = buildSessionHook(agent);
  const path = await assertSafePathAsync(root, hook.path);
  const before = await readOptionalAsync(path);
  const input: unknown = before === null ? {} : JSON.parse(before);
  if (!record(input)) throw new Error('Invalid hook settings in ' + hook.path);
  const hooks = input.hooks === undefined ? {} : input.hooks;
  if (!record(hooks)) throw new Error('Invalid hooks object in ' + hook.path);
  const previous = hooks.SessionStart === undefined ? [] : hooks.SessionStart;
  if (!Array.isArray(previous)) throw new Error('Invalid SessionStart hooks in ' + hook.path);
  const existing = previous.some((group: unknown) => JSON.stringify(group).includes(hook.command));
  if (existing) return { path: hook.path, before, after: before ?? '', action: 'unchanged' };
  return {
    path: hook.path,
    before,
    action: before === null ? 'create' : 'update',
    after: JSON.stringify({ ...input, hooks: { ...hooks, SessionStart: [...previous, hook.entry] } }, null, 2) + '\n',
  };
}

/*** Ensure hook script is generated and unchanged before installing executable registrations. */
async function validateHookSourceAsync(root: string, config: AiConfig): Promise<void> {
  const artifact = buildManagedArtifacts(config).find((entry) => entry.path === '.ankh/ai/hooks/session-start.ts');
  if (artifact === undefined) throw new Error('The managed session hook script is missing from the setup manifest.');
  const path = await assertSafePathAsync(root, artifact.path);
  const actual = await readOptionalAsync(path);
  if (actual === null || hashArtifact(actual) !== hashArtifact(artifact.content)) {
    throw new Error('Session hook script is absent or modified. Run ankh ai sync before enabling hooks.');
  }
}

/*** Read optional settings without masking other filesystem errors. */
async function readOptionalAsync(path: string): Promise<string | null> {
  try { return await readFile(path, 'utf8'); }
  catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return null;
    throw error;
  }
}

/*** Restrict untrusted JSON to objects suitable for merging. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
