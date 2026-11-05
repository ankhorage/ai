import type { AgentDescriptor } from '../../../types/ai.js';

/*** Describe supported adapters without claiming platform feature parity. */
export const agentCatalog = [
  {
    id: 'codex',
    displayName: 'OpenAI Codex',
    binary: 'codex',
    interactive: true,
    execution: 'supported',
    features: ['skills', 'mcp', 'hooks'],
  },
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    binary: 'claude',
    interactive: true,
    execution: 'supported',
    features: ['skills', 'commands', 'mcp', 'hooks', 'plugins'],
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    binary: 'agent',
    interactive: true,
    execution: 'unsupported',
    features: ['skills', 'commands', 'mcp', 'plugins'],
  },
  {
    id: 'gemini',
    displayName: 'Gemini CLI',
    binary: 'gemini',
    interactive: true,
    execution: 'supported',
    features: ['commands', 'mcp', 'hooks'],
  },
] as const satisfies readonly AgentDescriptor[];
