import { agentCatalog } from '../../features/agents/domain/agentCatalog.js';
import { readConfigAsync } from '../../features/config/adapters/readConfigAsync.js';

/*** Render a searchable/exportable command contract from configured capabilities. */
export async function cheatsheet(
  root: string,
  argv: readonly string[],
  output: (text: string) => void,
): Promise<number> {
  const config = await readConfigAsync(root);
  const commands = [
    ['init', 'Interactive setup (--yes, --dry-run, --agents, --workflow)'],
    ['sync', 'Reconcile AI-owned agent command files (--dry-run)'],
    ['rollback', 'Revert latest AI-managed setup changes'],
    ['status', 'Show configured agent installations and drift (--json)'],
    ['doctor', 'Validate agentic prerequisites'],
    ['plan "goal"', 'Generate persistent read-only AI implementation plan'],
    ['execute <uuid> --approve', 'Execute approved plan on a feature branch'],
    ['review', 'Read-only agent review, store evidence'],
    ['fix --approve', 'Fix findings from the latest review on a feature branch'],
    ['ship --approve', 'Validate repository and prepare delivery'],
    ['discuss "topic"', 'Multi-perspective discussion (not upstream BMAD party mode)'],
    ['agents', 'Show agent capabilities and installation status'],
    ['skills', 'List generated AI workflow skills'],
    ['mcp', 'Inspect MCP configuration'],
    [
      'mcp add <name> <https-url> --approve',
      'Register an approved remote MCP endpoint in native configs',
    ],
    ['bmad install --approve', 'Launch approved official stable BMAD v6.12 installer'],
    ['bmad status', 'Inspect installed BMAD runtime'],
    ['bmad party', 'Instructions to launch upstream native Party Mode'],
    ['plugins', 'Report plugin support by agent'],
    ['hooks', 'Inspect native hook configuration'],
    ['cheatsheet', 'This command (--format json|markdown)'],
  ];
  const data = {
    workflow: config?.workflow ?? null,
    agents: agentCatalog.filter((agent) => config?.agents.includes(agent.id) ?? true),
    commands: commands.map(([command, description]) => ({
      command: 'ankh ai ' + command,
      description,
    })),
  };
  const format = argv.includes('--format') ? argv[argv.indexOf('--format') + 1] : 'text';
  if (format === 'json') output(JSON.stringify(data, null, 2) + '\n');
  else if (format === 'markdown')
    output(
      '# Ankh AI Cheatsheet\n\n' +
        data.commands
          .map((command) => '- `' + command.command + '` — ' + command.description)
          .join('\n') +
        '\n',
    );
  else
    output(
      'Ankhorage AI commands\n' +
        data.commands
          .map((command) => command.command.padEnd(33) + command.description)
          .join('\n') +
        '\n',
    );
  return 0;
}
