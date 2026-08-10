import { isRegisteredProvider, registerProvider } from '../../registry';

import { OMP_CAPABILITIES } from './capabilities';
import { OmpProvider } from './provider';

/**
 * Register the OMP community provider.
 *
 * Idempotent — safe to call multiple times, so process entrypoints (CLI,
 * server, config-loader) can each call it without coordination.
 */
export function registerOmpProvider(): void {
  if (isRegisteredProvider('omp')) return;
  registerProvider({
    id: 'omp',
    displayName: 'OMP (community)',
    factory: () => new OmpProvider(),
    capabilities: OMP_CAPABILITIES,
    builtIn: false,
    // OMP owns its own auth store (~/.omp) and env-var table — Archon does not
    // deliver credentials to it, so the managed-credential catalog is empty.
    credentials: { kind: 'static', specs: [] },
  });
}
