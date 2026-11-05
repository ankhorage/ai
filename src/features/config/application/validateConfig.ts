import { agentCatalog } from '../../agents/domain/agentCatalog.js';
import type { AiConfig, AgentId, WorkflowId } from '../../../types/ai.js';

/*** Validate untrusted project configuration at the application boundary. */
export function validateConfig(input: unknown): AiConfig {
  if (!record(input) || input.schemaVersion !== 1) throw new Error('Unsupported AI schemaVersion (expected 1).');
  if (!record(input.project)) throw new Error('project must be an object.');
  if (typeof input.project.name !== 'string' || !input.project.name.trim()) throw new Error('project.name is required.');
  if (typeof input.project.architecture !== 'string') throw new Error('project.architecture must be a string.');
  const languages = readStrings(input.project.languages, 'project.languages');
  const packageManagers = readStrings(input.project.packageManagers, 'project.packageManagers');
  if (!Array.isArray(input.agents) || input.agents.length === 0) throw new Error('agents must be a non-empty array.');
  const validAgents: readonly string[] = agentCatalog.map((agent) => agent.id);
  const agents = readStrings(input.agents, 'agents');
  if (new Set(agents).size !== agents.length || agents.some((a) => !validAgents.includes(a))) throw new Error('Invalid or duplicated agent ID.');
  if (typeof input.defaultAgent !== 'string' || !agents.includes(input.defaultAgent)) throw new Error('defaultAgent must be selected.');
  if (input.workflow !== 'standard' && input.workflow !== 'bmad') throw new Error('workflow must be standard or bmad.');
  if (!record(input.security) || input.security.requireExecutionApproval !== true || input.security.protectMain !== true ||
      typeof input.security.requireReview !== 'boolean') throw new Error('Unsafe security settings: approvals and main protection are mandatory.');
  return {
    schemaVersion: 1,
    project: { name: input.project.name, architecture: input.project.architecture, languages, packageManagers },
    agents: agents as AgentId[],
    defaultAgent: input.defaultAgent as AgentId,
    workflow: input.workflow as WorkflowId,
    security: {
      requireExecutionApproval: true,
      requireReview: input.security.requireReview,
      protectMain: true,
    },
  };
}

/*** Check plain records without trusting prototypes. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/*** Reject unsafe arrays and non-string entries. */
function readStrings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error(label + ' must be a string array.');
  return value as string[];
}
