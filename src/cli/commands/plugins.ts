import { detectAgentAsync } from '../../features/agents/adapters/detectAgentAsync.js';
import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { planPluginInstall } from '../../features/integrations/domain/planPluginInstall.js';
import { runProcessAsync } from '../../features/workflows/adapters/runProcessAsync.js';
import { inventory } from './inventory.js';

/*** Install a trusted native plugin only after an explicit project-scoped approval. */
export async function plugins(
  root: string,
  argv: readonly string[],
  output: (text: string) => void,
): Promise<number> {
  if (argv[0] !== 'install') return await inventory(root, 'plugins', output);
  const [, agentText, source] = argv;
  if (!agentText || !source)
    throw new Error('Usage: ankh ai plugins install <claude-code|gemini> <source> [--approve]');
  const config = await readConfigAsync(root);
  if (config === null) throw new Error('Run ankh ai init first.');
  const agent = config.agents.find((name) => name === agentText);
  if (agent === undefined)
    throw new Error('Agent is not configured for this project: ' + agentText);
  const plan = planPluginInstall(agent, source);
  output('Native install: ' + plan.binary + ' ' + plan.argv.join(' ') + '\n');
  output(
    'Security: third-party code will be downloaded and executed with the current user permissions.\n',
  );
  if (!argv.includes('--approve')) {
    output('Preview only. Re-run with --approve after verifying the source.\n');
    return 0;
  }
  const installed = await detectAgentAsync(agent);
  if (!installed.installed) throw new Error('Agent CLI is not installed: ' + installed.binary);
  const result = await runProcessAsync(plan.binary, plan.argv, root);
  output(result.output + '\n');
  return result.exitCode;
}
