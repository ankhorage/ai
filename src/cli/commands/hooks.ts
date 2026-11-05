import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { enableSessionHooksAsync } from '../../features/integrations/application/enableSessionHooksAsync.js';
import { inventory } from './inventory.js';

/*** Safely register approved lifecycle hooks using the provider's verified native schema. */
export async function hooks(root: string, argv: readonly string[], output: (text: string) => void): Promise<number> {
  if (argv[0] !== 'enable') return await inventory(root, 'hooks', output);
  const config = await readConfigAsync(root);
  if (config === null) throw new Error('Run ankh ai init first.');
  const approved = argv.includes('--approve');
  const changes = await enableSessionHooksAsync(root, config, approved);
  for (const change of changes) output((approved ? 'Applied ' : 'Would ') + change.action + ' ' + change.path + '\n');
  output('Hooks may execute commands with your user permissions on each agent session.\n');
  if (!approved) output('Preview only. Re-run with --approve to register the trusted SessionStart hook.\n');
  return 0;
}
