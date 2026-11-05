import type { AgentId, AiConfig, AiProjectMetadata } from '../../../types/ai.js';
import { agentCatalog } from '../../agents/domain/agentCatalog.js';

/*** Validate untrusted project configuration at the application boundary. */
export function validateConfig(input: unknown): AiConfig {
  if (!record(input) || input.schemaVersion !== 1) {
    throw new Error('Unsupported AI schemaVersion (expected 1).');
  }
  const project = validateProject(input.project);
  const agents = validateAgents(input.agents);
  const defaultAgent = agents.find((agent) => agent === input.defaultAgent);
  if (defaultAgent === undefined) throw new Error('defaultAgent must be selected.');
  if (input.workflow !== 'standard' && input.workflow !== 'bmad') {
    throw new Error('workflow must be standard or bmad.');
  }
  return {
    schemaVersion: 1,
    project,
    agents,
    defaultAgent,
    workflow: input.workflow,
    security: validateSecurity(input.security),
  };
}

/*** Validate explicit project choices independently from detected evidence. */
function validateProject(input: unknown): AiProjectMetadata {
  if (!record(input)) throw new Error('project must be an object.');
  const { name, architecture, languages, packageManagers } = input;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('project.name is required.');
  }
  if (typeof architecture !== 'string') {
    throw new Error('project.architecture must be a string.');
  }
  return {
    name,
    architecture,
    languages: readStrings(languages, 'project.languages'),
    packageManagers: readStrings(packageManagers, 'project.packageManagers'),
  };
}

/*** Resolve supported agent IDs without an unsafe type assertion. */
function validateAgents(input: unknown): AgentId[] {
  const names = readStrings(input, 'agents');
  if (names.length === 0 || new Set(names).size !== names.length) {
    throw new Error('agents must be a non-empty array without duplicates.');
  }
  return names.map((name) => {
    const agent = agentCatalog.find((entry) => entry.id === name);
    if (agent === undefined) throw new Error('Unknown agent: ' + name);
    return agent.id;
  });
}

/*** Security policy always keeps explicit consent and protected main. */
function validateSecurity(input: unknown): AiConfig['security'] {
  if (
    !record(input) ||
    input.requireExecutionApproval !== true ||
    input.protectMain !== true ||
    typeof input.requireReview !== 'boolean'
  ) {
    throw new Error('Unsafe security settings: approvals and main protection are mandatory.');
  }
  return {
    requireExecutionApproval: true,
    requireReview: input.requireReview,
    protectMain: true,
  };
}

/*** Check records without trusting arbitrary object prototypes. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/*** Reject unsafe arrays and non-string entries. */
function readStrings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(label + ' must be a string array.');
  }
  return value as string[];
}
