import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile, symlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { AiConfig } from '../../../types/ai.js';
import { buildManagedArtifacts } from '../domain/buildManagedArtifacts.js';
import { applyManagedArtifactsAsync } from './applyManagedArtifactsAsync.js';
import { inspectManagedArtifactsAsync } from './inspectManagedArtifactsAsync.js';
import { rollbackManagedArtifactsAsync } from './rollbackManagedArtifactsAsync.js';

const config: AiConfig = {
  schemaVersion: 1,
  project: { name: 'demo', architecture: 'hexagonal', languages: ['typescript'], packageManagers: ['bun'] },
  agents: ['codex'],
  defaultAgent: 'codex',
  workflow: 'standard',
  security: { requireExecutionApproval: true, requireReview: true, protectMain: true },
};

test('setup is idempotent and refuses unmanaged user edits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ankh-ai-test-'));
  try {
    const artifacts = buildManagedArtifacts(config);
    expect(artifacts.length).toBe(7);
    expect((await applyManagedArtifactsAsync(root, artifacts, true)).every((change) => change.action === 'create')).toBe(true);
    expect((await applyManagedArtifactsAsync(root, artifacts, false)).every((change) => change.action === 'create')).toBe(true);
    expect((await inspectManagedArtifactsAsync(root, artifacts)).every((change) => change.action === 'unchanged')).toBe(true);
    const first = artifacts.at(1);
    if (first === undefined) throw new Error('Missing test artifact.');
    await writeFile(join(root, first.path), 'custom user instructions');
    expect((await inspectManagedArtifactsAsync(root, artifacts)).some((change) => change.action === 'conflict')).toBe(true);
    expect((await applyManagedArtifactsAsync(root, artifacts, false)).some((change) => change.action === 'conflict')).toBe(true);
    expect(await readFile(join(root, first.path), 'utf8')).toBe('custom user instructions');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('updates and rollback preserve previously managed content', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ankh-ai-test-'));
  try {
    const artifacts = buildManagedArtifacts(config);
    await applyManagedArtifactsAsync(root, artifacts, false);
    const [original] = artifacts;
    if (original === undefined) throw new Error('Missing test artifact.');
    const changed = artifacts.map((artifact) => artifact.path === original.path ?
      { ...artifact, content: 'new generated commands\n' } : artifact);
    const update = await applyManagedArtifactsAsync(root, changed, false);
    expect(update.filter((change) => change.action === 'update').length).toBe(1);
    await rollbackManagedArtifactsAsync(root);
    expect(await readFile(join(root, original.path), 'utf8')).toBe(original.content);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('refuses to manage symlinked parent directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ankh-ai-test-'));
  const external = await mkdtemp(join(tmpdir(), 'ankh-ai-external-'));
  try {
    await mkdir(join(root, '.agents'), { recursive: true });
    await symlink(external, join(root, '.agents/skills'));
    const error = await inspectManagedArtifactsAsync(root, buildManagedArtifacts(config)).then(
      () => null,
      (reason: unknown) => String(reason),
    );
    expect(error).toContain('symlink');
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});
