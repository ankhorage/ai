#!/usr/bin/env bun
import { runCliAsync } from './runCliAsync.js';

const result = await runCliAsync(process.argv.slice(2), {
  cwd: process.cwd(),
  writeStdout: (text) => process.stdout.write(text),
  writeStderr: (text) => process.stderr.write(text),
});
process.exitCode = result;
