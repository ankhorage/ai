export type {
  AiConfig,
  AgentDescriptor,
  AgentId,
  AiPlan,
  AiRun,
  ManagedArtifact,
  ManagedRecord,
  SetupChange,
  WorkflowId,
  WorkflowCommand,
} from './types/ai.js';

export { agentCatalog } from './features/agents/domain/agentCatalog.js';
export { validateConfig } from './features/config/application/validateConfig.js';
export { buildManagedArtifacts } from './features/setup/domain/buildManagedArtifacts.js';
export { inspectManagedArtifactsAsync } from './features/setup/application/inspectManagedArtifactsAsync.js';
export { applyManagedArtifactsAsync } from './features/setup/application/applyManagedArtifactsAsync.js';
