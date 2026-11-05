import type { AgentId } from '../../../types/ai.js';

export interface PluginInstallationPlan {
  readonly agent: AgentId;
  readonly binary: 'claude' | 'gemini';
  readonly argv: readonly string[];
  readonly requiresThirdPartyCodeConsent: true;
}

/*** Validate and create a provider-native plugin installation request without executing it. */
export function planPluginInstall(agent: AgentId, source: string): PluginInstallationPlan {
  if (agent === 'claude-code') return planClaudePlugin(source);
  if (agent === 'gemini') return planGeminiExtension(source);
  throw new Error('Native plugin installation is not verified for ' + agent + '. Use the provider UI.');
}

/*** Permit only marketplace-qualified Claude plugin identifiers. */
function planClaudePlugin(source: string): PluginInstallationPlan {
  if (!/^[a-z][a-z0-9-]{0,63}@[a-z][a-z0-9-]{0,63}$/.test(source)) {
    throw new Error('Claude plugin must use plugin@marketplace format.');
  }
  return {
    agent: 'claude-code',
    binary: 'claude',
    argv: ['plugin', 'install', source, '--scope', 'project'],
    requiresThirdPartyCodeConsent: true,
  };
}

/*** Limit Gemini extension installation to explicit Github repository URLs. */
function planGeminiExtension(source: string): PluginInstallationPlan {
  const url = new URL(source);
  const path = url.pathname.split('/').filter(Boolean);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' ||
    url.username || url.password || url.search || url.hash || path.length !== 2 ||
    path.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part))) {
    throw new Error('Gemini extension must be a clean https://github.com/owner/repo URL.');
  }
  return {
    agent: 'gemini',
    binary: 'gemini',
    argv: ['extensions', 'install', url.href, '--consent'],
    requiresThirdPartyCodeConsent: true,
  };
}
