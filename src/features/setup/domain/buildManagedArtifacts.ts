import type { AiConfig, ManagedArtifact, WorkflowCommand } from '../../../types/ai.js';

/*** Render deterministic provider-specific commands from one canonical workflow vocabulary. */
export function buildManagedArtifacts(config: AiConfig): readonly ManagedArtifact[] {
  const commands: readonly WorkflowCommand[] = ['plan', 'execute', 'review', 'fix', 'ship', 'discuss'];
  const generated = config.agents.flatMap((agent) => commands.map((command) => {
    const descriptor = [
      'Use the project canonical AGENTS.md and select relevant .agents/skills before editing.',
      'The canonical workflow is ankh ai ' + command + '.',
      'Inspect the actual capabilities with ankh ai doctor and ankh ai cheatsheet.',
      'Never claim that a step, test, review or delivery happened without verifying evidence.',
      'Do not bypass execution approval, repository security rules or branch protection.',
    ].join(' ');
    const label = 'ankh-' + command;
    const markdown = '---\nname: ' + label + '\ndescription: Run Ankhorage ' + command + ' workflow using the canonical CLI.\n---\n\n# ' + label + '\n\n' + descriptor + '\n\nInvoke: `ankh ai ' + command + '` (with task arguments as appropriate).\n';
    if (agent === 'codex') return { path: '.agents/skills/' + label + '/SKILL.md', content: markdown };
    if (agent === 'claude-code') return { path: '.claude/skills/' + label + '/SKILL.md', content: markdown };
    if (agent === 'cursor') return { path: '.cursor/commands/' + label + '.md', content: '# ' + label + '\n\n' + descriptor + '\n' };
    return { path: '.gemini/commands/' + label + '.toml', content: 'description = "Ankhorage ' + command + ' workflow"\nprompt = "' + descriptor.replaceAll('"', '\\"') + '"\n' };
  }));
  return [
    {
      path: '.ankh/ai/COMMANDS.md',
      content: '# Ankhorage AI commands\n\n' + commands.map((command) => '- `ankh ai ' + command + '`').join('\n') + '\n\nUse `ankh ai cheatsheet` for the live inventory.\n',
    },
    ...generated,
  ];
}
