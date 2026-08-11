import { isRegisteredProvider, registerProvider } from '../../registry';

import { PYDANTIC_CAPABILITIES } from './capabilities';
import { PydanticProvider } from './provider';

/**
 * Register the Pydantic community provider — typed answer-node worker bridge
 * (schema-validated Pydantic AI calls with worker-internal chunking, replacing
 * headless coding-agent sessions for answer-nodes).
 *
 * Idempotent — safe to call multiple times, matching the other community
 * provider registrations.
 */
export function registerPydanticProvider(): void {
  if (isRegisteredProvider('pydantic')) return;
  registerProvider({
    id: 'pydantic',
    displayName: 'Pydantic answer-worker (community)',
    factory: () => new PydanticProvider(),
    capabilities: PYDANTIC_CAPABILITIES,
    builtIn: false,
    // The worker owns its own model keys via env — Archon delivers nothing.
    credentials: { kind: 'static', specs: [] },
  });
}
