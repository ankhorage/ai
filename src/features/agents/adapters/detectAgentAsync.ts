import { access, constants } from 'node:fs/promises';
import { delimiter, join } from 'node:path';

import { agentCatalog } from '../domain/agentCatalog.js';
import type { AgentId } from '../../../types/ai.js';

/*** Detect an installed agent CLI using PATH without executing the binary. */
export async function detectAgentAsync(agentId: AgentId): Promise<{ id: AgentId; installed: boolean; binary: string }> {
  const agent = agentCatalog.find((entry) => entry.id === agentId);
  if (agent === undefined) throw new Error('Unknown agent: ' + agentId);
  const directories = (process.env.PATH ?? '').split(delimiter).filter(Boolean);
  const suffixes = process.platform === 'win32' ? ['', '.exe', '.cmd'] : [''];
  const candidates = directories.flatMap((directory) => suffixes.map((suffix) => join(directory, agent.binary + suffix)));
  const matches = await Promise.all(candidates.map(async (candidate) => {
    try {
      await access(candidate, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }));
  return { id: agentId, installed: matches.includes(true), binary: agent.binary };
}
