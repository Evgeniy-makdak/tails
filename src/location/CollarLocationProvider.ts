import type {
  CollarLocationListener,
  CollarLocationSnapshot,
  CollarLocationSubscribeOptions,
} from './types';

export interface CollarLocationProvider {
  readonly id: 'demo' | 'api' | 'device';
  getCurrent(options: CollarLocationSubscribeOptions): Promise<CollarLocationSnapshot | null>;
  subscribe(options: CollarLocationSubscribeOptions, listener: CollarLocationListener): () => void;
}
