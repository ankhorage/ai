import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AiConfig, AiRun } from '../../types/ai.js';
import { ensureWorkBranchAsync } from '../../features/workflows/adapters/ensureWorkBranchAsync.js';
import { runProcessAsync } from '../../features/workflows/adapters/runProcessAsync.js';

/*** Validate repository quality gates and optionally open an issue-linked PR. */
export async function ship(
  root: string, config: AiConfig, argv: readonly string[], output: (text: string) => void,
): Promise<number> {
  await ensureWorkBranchAsync(root);
  if (config.security.requireReview) {
    const review = await readFile(join(root, '.ankh/ai/reviews/latest.json'), 'utf8').then((text) => JSON.parse(text) as AiRun, () => null);
    if (review?.command !== 'review' || review.exitCode !== 0) throw new Error('A successful ankh ai review is required before ship.');
    output('AI review evidence found. Human review of findings remains required.\n');
  }
  const scripts = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  const checks = ['build', 'check-types', 'lint', 'knip:check', 'test', 'format:check'];
  for (const name of checks) {
    if (scripts.scripts?.[name] === undefined) throw new Error('Required validation script is missing: ' + name);
    output('Running bun run ' + name + '\n');
    const result = await runProcessAsync('bun', ['run', name], root);
    if (result.exitCode !== 0) { output(result.output + '\n'); throw new Error('Validation failed: ' + name); }
  }
  if (!argv.includes('--approve')) {
    output('Validation passed. Use --approve --title "feat(scope): ..." --issue <number> to create a PR.\n');
    return 0;
  }
  const title = valueOf(argv, '--title');
  const issue = valueOf(argv, '--issue');
  if (!title || !/^(feat|fix|docs|refactor|perf|test|build|ci|chore)(\([a-z0-9-]+\))?!?: .+/.test(title)) throw new Error('A conventional --title is required.');
  if (!issue || !/^\d+$/.test(issue)) throw new Error('A numeric --issue is required for linked delivery.');
  const status = await runProcessAsync('git', ['status', '--porcelain'], root);
  if (status.exitCode !== 0 || status.output.trim()) throw new Error('Worktree must be clean and committed before PR creation.');
  const body = '## Summary\n\nDelivered through Ankhorage AI workflow.\n\n## Validation\n\n' +
    checks.map((check) => '- [x] `bun run ' + check + '`').join('\n') +
    '\n\n## Review\n\n- AI review artifact inspected; findings require human disposition.\n\nCloses #' + issue;
  const result = await runProcessAsync('gh', ['pr', 'create', '--title', title, '--body', body, '--assignee', 'artiphishle'], root);
  output(result.output + '\n');
  return result.exitCode;
}

/*** Read a single CLI option value without shell interpretation. */
function valueOf(argv: readonly string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index === -1 ? null : argv[index + 1] ?? null;
}
