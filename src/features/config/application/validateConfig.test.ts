import { expect, test } from 'bun:test';

import { validateConfig } from './validateConfig.js';

const base = {
  schemaVersion: 1,
  project: {
    name: 'demo',
    architecture: 'hexagonal',
    languages: ['typescript'],
    packageManagers: ['bun'],
  },
  agents: ['codex', 'claude-code'],
  defaultAgent: 'codex',
  workflow: 'standard',
  security: { requireExecutionApproval: true, requireReview: true, protectMain: true },
};

test('accepts complete project config', () => {
  const config = validateConfig(base);
  expect(config.project.name).toBe('demo');
  expect(config.agents).toEqual(['codex', 'claude-code']);
});

test('rejects disabled approvals and unknown agents', () => {
  expect(() =>
    validateConfig({ ...base, security: { ...base.security, requireExecutionApproval: false } }),
  ).toThrow();
  expect(() => validateConfig({ ...base, agents: ['codex', 'impostor'] })).toThrow();
  expect(() => validateConfig({ ...base, agents: ['codex', 'codex'] })).toThrow();
});

test('rejects invalid schema and missing defaults', () => {
  expect(() => validateConfig({ ...base, schemaVersion: 2 })).toThrow();
  expect(() => validateConfig({ ...base, defaultAgent: 'gemini' })).toThrow();
});
