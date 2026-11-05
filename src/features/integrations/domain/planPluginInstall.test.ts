import { expect, test } from 'bun:test';

import { planPluginInstall } from './planPluginInstall.js';

test('plans native Claude plugin installation at project scope', () => {
  expect(planPluginInstall('claude-code', 'reviewer@official').argv).toEqual([
    'plugin', 'install', 'reviewer@official', '--scope', 'project',
  ]);
});

test('plans Gemini extension installation using explicit GitHub source', () => {
  const plan = planPluginInstall('gemini', 'https://github.com/example/my-extension');
  expect(plan.binary).toBe('gemini');
  expect(plan.argv).toContain('--consent');
});

test('rejects unverified providers and unsafe plugin sources', () => {
  expect(() => planPluginInstall('cursor', 'https://github.com/example/my-extension')).toThrow();
  expect(() => planPluginInstall('claude-code', '--danger')).toThrow();
  expect(() => planPluginInstall('gemini', 'https://evil.example/owner/repo')).toThrow();
});
