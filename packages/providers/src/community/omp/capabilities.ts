import type { ProviderCapabilities } from '../../types';

/**
 * OMP capabilities — mirrors PI_CAPABILITIES structure.
 * OMP supports MCP (via .mcp.json discovery), skills, and structured output.
 * Tool restrictions, thinking level, and env injection work similarly to Pi.
 *
 * TODO (MVP): wire up MCP, hooks, and cost control as they become tested.
 */
export const OMP_CAPABILITIES: ProviderCapabilities = {
  sessionResume: true,
  mcp: false,
  hooks: false,
  skills: true,
  agents: false,
  toolRestrictions: true,
  structuredOutput: 'best-effort', // prompt-augment + repair + validate + reask (no SDK grammar)
  envInjection: true,
  costControl: false,
  effortControl: true,
  thinkingControl: true,
  fallbackModel: false,
  sandbox: false,
  settingSources: false, // Claude Agent SDK-only knob (which setting sources the agent loads)
  nativeTools: false, // no OMP native-tool bridge yet (fail-fast source of truth)
  containerExec: false, // no in-container spawn path yet (fail-fast source of truth)
};
