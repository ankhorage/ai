export { agentCatalog } from './features/agents/domain/agentCatalog.js';
export { validateConfig } from './features/config/application/validateConfig.js';
export { applyManagedArtifactsAsync } from './features/setup/application/applyManagedArtifactsAsync.js';
export { inspectManagedArtifactsAsync } from './features/setup/application/inspectManagedArtifactsAsync.js';
export { buildManagedArtifacts } from './features/setup/domain/buildManagedArtifacts.js';
export type {
  AgentDescriptor,
  AgentId,
  AiConfig,
  AiPlan,
  AiRun,
  ManagedArtifact,
  ManagedRecord,
  SetupChange,
  WorkflowCommand,
  WorkflowId,
} from './types/ai.js';
