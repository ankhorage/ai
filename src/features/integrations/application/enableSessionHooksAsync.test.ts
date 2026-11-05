import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from 'bun:test';

import type { AiConfig } from '../../../types/ai.js';
import { applyManagedArtifactsAsync } from '../../setup/application/applyManagedArtifactsAsync.js';
import { buildManagedArtifacts } from '../../setup/domain/buildManagedArtifacts.js';
import { enableSessionHooksAsync } from './enableSessionHooksAsync.js';

const config: AiConfig = {
  schemaVersion: 1,
  project: {
    name: 'test',
    architecture: 'hexagonal',
    languages: ['typescript'],
    packageManagers: ['bun'],
  },
  agents: ['claude-code', 'gemini'],
  defaultAgent: 'claude-code',
  workflow: 'standard',
  security: { requireExecutionApproval: true, requireReview: true, protectMain: true },
};

test('SessionStart hook preview is non-destructive, merge-preserving and idempotent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ankh-ai-hooks-'));
  try {
    await applyManagedArtifactsAsync(root, buildManagedArtifacts(config), false);
    await mkdir(join(root, '.claude'), { recursive: true });
    await writeFile(
      join(root, '.claude/settings.json'),
      JSON.stringify({ permissions: { allow: ['Read'] } }),
    );
    expect((await enableSessionHooksAsync(root, config, false)).length).toBe(2);
    const before = JSON.parse(
      await readFile(join(root, '.claude/settings.json'), 'utf8'),
    ) as unknown;
    expect(before).toEqual({ permissions: { allow: ['Read'] } });
    const applied = await enableSessionHooksAsync(root, config, true);
    expect(applied.every((change) => change.action !== 'unchanged')).toBe(true);
    const after = JSON.parse(
      await readFile(join(root, '.claude/settings.json'), 'utf8'),
    ) as unknown;
    expect(after).toMatchObject({
      permissions: { allow: ['Read'] },
      hooks: { SessionStart: [{}] },
    });
    expect(
      (await enableSessionHooksAsync(root, config, true)).every(
        (change) => change.action === 'unchanged',
      ),
    ).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
