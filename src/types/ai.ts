/*** Portable project metadata owned by Ankhorage AI. */
export type AgentId = 'codex' | 'claude-code' | 'cursor' | 'gemini';
export type WorkflowId = 'standard' | 'bmad';
export type WorkflowCommand = 'plan' | 'execute' | 'review' | 'fix' | 'ship' | 'discuss';

export interface AiProjectMetadata {
  readonly name: string;
  readonly architecture: string;
  readonly languages: readonly string[];
  readonly packageManagers: readonly string[];
}

export interface AiConfig {
  readonly schemaVersion: 1;
  readonly project: AiProjectMetadata;
  readonly agents: readonly AgentId[];
  readonly defaultAgent: AgentId;
  readonly workflow: WorkflowId;
  readonly security: {
    readonly requireExecutionApproval: true;
    readonly requireReview: boolean;
    readonly protectMain: true;
  };
}

export interface AgentDescriptor {
  readonly id: AgentId;
  readonly displayName: string;
  readonly binary: string;
  readonly interactive: boolean;
  readonly execution: 'supported' | 'unsupported';
  readonly features: readonly ('skills' | 'commands' | 'mcp' | 'hooks' | 'plugins')[];
}

export interface ManagedArtifact {
  readonly path: string;
  readonly content: string;
}

export interface ManagedRecord {
  readonly schemaVersion: 1;
  readonly files: Readonly<Record<string, string>>;
}

export interface SetupChange {
  readonly path: string;
  readonly action: 'create' | 'update' | 'unchanged' | 'conflict';
}

export interface AiPlan {
  readonly schemaVersion: 1;
  readonly kind: 'ankh-ai-plan';
  readonly id: string;
  readonly goal: string;
  readonly agent: AgentId;
  readonly createdAt: string;
  readonly instructions: string;
  readonly status: 'proposed' | 'approved' | 'executed';
}

export interface AiRun {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly command: WorkflowCommand;
  readonly agent: AgentId;
  readonly planId?: string;
  readonly createdAt: string;
  readonly output: string;
  readonly exitCode: number;
}
