import type { ProviderCapabilities } from '../../types';

/**
 * Pydantic answer-worker capabilities — deliberately minimal. The provider is
 * a single typed API call through a spawned Python worker, not a coding-agent
 * session: no sessions to resume, no tools to restrict, no MCP/hooks/skills.
 *
 * structuredOutput here is SDK-enforced (unlike Pi's best-effort prompt
 * appendage): the worker compiles the node's output_format JSON schema to a
 * Pydantic output_type and the model fills a tool call against it, with
 * bounded ModelRetry on validation failure. See the second-brain repo,
 * docs/plans/kairon-lite-pydantic-answer-provider.md §4a.
 */
export const PYDANTIC_CAPABILITIES: ProviderCapabilities = {
  sessionResume: false,
  mcp: false,
  hooks: false,
  skills: false,
  agents: false,
  toolRestrictions: false,
  structuredOutput: 'enforced', // pydantic-ai typed output + bounded ModelRetry
  envInjection: true,
  costControl: false,
  effortControl: false,
  thinkingControl: false,
  fallbackModel: false,
  sandbox: false,
  settingSources: false, // Claude Agent SDK-only knob
  nativeTools: false, // worker bridge, no native-tool surface
  containerExec: false, // no in-container spawn path
};
