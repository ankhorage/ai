import { expect, test } from 'bun:test';

import metadata from '../../package.json' with { type: 'json' };
import provider from './index.js';
import { runCliAsync } from './runCliAsync.js';

test('provider commands and declared metadata are aligned', () => {
  const expected = new Set(provider.commands.map((command) => command.capability));
  const actual = new Set(metadata.ankh.capabilities.map((capability) => capability.id));
  expect(actual).toEqual(expected);
  expect(provider.handlers.length).toBe(provider.commands.length);
});

test('standalone help and cheatsheet work without installed agents', async () => {
  const messages: string[] = [];
  const context = {
    cwd: process.cwd(),
    writeStdout: (text: string) => messages.push(text),
    writeStderr: (text: string) => messages.push(text),
  };
  expect(await runCliAsync([], context)).toBe(0);
  expect(await runCliAsync(['cheatsheet', '--format', 'json'], context)).toBe(0);
  expect(messages.join('')).toContain('ankh ai plan');
});
