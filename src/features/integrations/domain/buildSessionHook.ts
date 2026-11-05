import type { AgentId } from '../../../types/ai.js';

/*** Generate provider-native session hook registration without running shell commands. */
export function buildSessionHook(agent: AgentId): { readonly path: string; readonly command: string; readonly entry: object } {
  if (agent === 'claude-code') {
    const command = 'bun .ankh/ai/hooks/session-start.ts --claude';
    return { path: '.claude/settings.json', command,
      entry: { hooks: [{ type: 'command', command }] } };
  }
  if (agent === 'gemini') {
    const command = 'bun .ankh/ai/hooks/session-start.ts --gemini';
    return { path: '.gemini/settings.json', command,
      entry: { hooks: [{ type: 'command', name: 'ankhorage-ai-session-start', command }] } };
  }
  throw new Error('No verified SessionStart hook schema for ' + agent);
}
