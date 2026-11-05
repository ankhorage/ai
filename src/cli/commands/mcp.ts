import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';
import { addMcpAsync } from '../../features/integrations/application/addMcpAsync.js';
import { inventory } from './inventory.js';

/*** Manage approved HTTPS MCP endpoints across selected native agent formats. */
export async function mcp(root: string, argv: readonly string[], output: (text: string) => void): Promise<number> {
  if (argv[0] !== 'add') return await inventory(root, 'mcp', output);
  const [_, name, url] = argv;
  if (!name || !url) throw new Error('Usage: ankh ai mcp add <name> <https-url> [--approve]');
  const config = await readConfigAsync(root);
  if (config === null) throw new Error('Run ankh ai init first.');
  const approved = argv.includes('--approve');
  const paths = await addMcpAsync(root, config, name, url, approved);
  for (const path of paths) output((approved ? 'Applied ' : 'Would ') + path.action + ' ' + path.path + '\n');
  if (!approved) output('Preview only. Re-run with --approve to register this trusted endpoint.\n');
  return 0;
}
