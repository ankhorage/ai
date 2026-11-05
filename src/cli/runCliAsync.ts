import { resolve } from 'node:path';

import { agents } from './commands/agents.js';
import { mcp } from './commands/mcp.js';
import { bmad } from './commands/bmad.js';
import { cheatsheet } from './commands/cheatsheet.js';
import { doctor } from './commands/doctor.js';
import { init } from './commands/init.js';
import { inventory } from './commands/inventory.js';
import { rollback } from './commands/rollback.js';
import { status } from './commands/status.js';
import { sync } from './commands/sync.js';
import { workflow } from './commands/workflow.js';

export interface AiCliContext {
  readonly cwd: string;
  readonly writeStdout: (text: string) => void;
  readonly writeStderr: (text: string) => void;
}

/*** Dispatch the canonical Ankh AI commands via the same standalone/provider boundary. */
export async function runCliAsync(argv: readonly string[], context: AiCliContext): Promise<number> {
  const [command, ...rest] = argv;
  const root = resolve(context.cwd);
  const output = context.writeStdout;
  try {
    switch (command) {
      case 'init': return await init(root, rest, output);
      case 'sync': return await sync(root, rest, output);
      case 'rollback': return await rollback(root, rest, output);
      case 'status': return await status(root, rest, output);
      case 'doctor': return await doctor(root, rest, output);
      case 'cheatsheet': return await cheatsheet(root, rest, output);
      case 'agents': return await agents(root, rest, output);
      case 'mcp': return await mcp(root, rest, output);
      case 'bmad': return await bmad(root, rest, output);
      case 'skills':
      case 'plugins':
      case 'hooks': return await inventory(root, command, output);
      case 'plan':
      case 'execute':
      case 'review':
      case 'fix':
      case 'ship':
      case 'discuss': return await workflow(root, command, rest, output);
      default:
        output('Ankhorage AI\n\nUsage: ankh ai <command> [arguments]\nCommands: init, sync, rollback, status, doctor, cheatsheet, agents, skills, mcp, plugins, hooks, bmad, plan, execute, review, fix, ship, discuss\n');
        return command === undefined || command === '--help' || command === 'help' ? 0 : 1;
    }
  } catch (error: unknown) {
    context.writeStderr('AI error: ' + (error instanceof Error ? error.message : String(error)) + '\n');
    return 1;
  }
}
