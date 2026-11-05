import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { createPlanAsync } from '../../features/workflows/application/createPlanAsync.js';
import { executePlanAsync } from '../../features/workflows/application/executePlanAsync.js';
import { fixReviewAsync } from '../../features/workflows/application/fixReviewAsync.js';
import { reviewAsync } from '../../features/workflows/application/reviewAsync.js';
import type { WorkflowCommand } from '../../types/ai.js';
import { discuss } from './discuss.js';
import { ship } from './ship.js';

/*** Dispatch persistent AI workflows with explicit approval enforcement. */
export async function workflow(
  root: string,
  command: WorkflowCommand,
  args: readonly string[],
  output: (text: string) => void,
): Promise<number> {
  const config = await readConfigAsync(root);
  if (config === null) throw new Error('Run ankh ai init first.');
  if (command === 'ship') return await ship(root, config, args, output);
  if (command === 'plan') {
    const plan = await createPlanAsync(root, config, args.join(' '));
    output(
      'Plan ' +
        plan.id +
        '\n' +
        plan.instructions +
        '\nRun ankh ai execute ' +
        plan.id +
        ' --approve to implement.\n',
    );
    return 0;
  }
  if (command === 'execute') {
    const id = args.find((arg) => !arg.startsWith('--'));
    if (!id) throw new Error('Plan ID required.');
    const run = await executePlanAsync(root, config, id, args.includes('--approve'));
    output('Execution ' + run.id + ' exit=' + run.exitCode + '\n' + run.output + '\n');
    return run.exitCode;
  }
  if (command === 'review') {
    const run = await reviewAsync(root, config);
    output('Review ' + run.id + ' exit=' + run.exitCode + '\n' + run.output + '\n');
    return run.exitCode;
  }
  if (command === 'fix') {
    const run = await fixReviewAsync(root, config, args.includes('--approve'));
    output('Fix ' + run.id + ' exit=' + run.exitCode + '\n' + run.output + '\n');
    return run.exitCode;
  }
  const run = await discuss(root, config, args.join(' '));
  output('Discussion ' + run.id + ' exit=' + run.exitCode + '\n' + run.output + '\n');
  return run.exitCode;
}
