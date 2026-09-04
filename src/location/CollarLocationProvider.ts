import type {
  CollarLocationListener,
  CollarLocationSnapshot,
  CollarLocationSubscribeOptions,
} from './types';

/**
 * Abstraction over collar telemetry.
 * Demo: in-memory fake SPB coords.
 * API: HTTP poll / WebSocket from collar backend (see src/api/collar.ts).
 */
export interface CollarLocationProvider {
  readonly id: 'demo' | 'api';
  /** One-shot read (may hit cache). */
  getCurrent(options: CollarLocationSubscribeOptions): Promise<CollarLocationSnapshot | null>;
  /** Live updates. Returns unsubscribe. */
  subscribe(options: CollarLocationSubscribeOptions, listener: CollarLocationListener): () => void;
}
