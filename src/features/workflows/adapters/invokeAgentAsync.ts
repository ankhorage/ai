import type { AgentId } from '../../../types/ai.js';
import { detectAgentAsync } from '../../agents/adapters/detectAgentAsync.js';
import { runProcessAsync } from './runProcessAsync.js';

/*** Invoke a supported real CLI, separating read-only and write-capable modes. */
export async function invokeAgentAsync(root: string, agent: AgentId, prompt: string, write: boolean): Promise<{ exitCode: number; output: string }> {
  const detected = await detectAgentAsync(agent);
  if (!detected.installed) throw new Error('Agent CLI not installed: ' + detected.binary);
  if (agent === 'codex') {
    return await runProcessAsync('codex', ['exec', '--sandbox', write ? 'workspace-write' : 'read-only', '-'], root, prompt);
  }
  if (agent === 'claude-code') {
    return await runProcessAsync('claude', ['-p', prompt, '--permission-mode', write ? 'acceptEdits' : 'plan'], root);
  }
  throw new Error('Headless execution not verified for ' + agent + '. Run its native UI using generated commands.');
}
