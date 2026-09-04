/** Single fix: pet collar location (owner phone GPS is not used). */
export type PetGeoPoint = {
  latitude: number;
  longitude: number;
  accuracyM?: number;
  altitudeM?: number;
  speedMps?: number;
  headingDeg?: number;
  /** ISO timestamp from collar / server */
  updatedAt: string;
};

export type CollarLocationSnapshot = {
  petId: string;
  collarId?: string;
  point: PetGeoPoint;
  batteryPercent?: number;
  online: boolean;
  /** Raw provider label for debug */
  source: 'demo' | 'api';
};

export type CollarLocationListener = (snapshot: CollarLocationSnapshot | null) => void;

export type CollarLocationSubscribeOptions = {
  petId: string;
  collarId?: string;
  /** Polling / push hint; providers may ignore */
  intervalMs?: number;
};
