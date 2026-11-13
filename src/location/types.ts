export type PetGeoPoint = {
  latitude: number;
  longitude: number;
  accuracyM?: number;
  altitudeM?: number;
  speedMps?: number;
  headingDeg?: number;
  updatedAt: string;
};

export type CollarLocationSnapshot = {
  petId: string;
  collarId?: string;
  point: PetGeoPoint;
  batteryPercent?: number;
  online: boolean;
  source: 'demo' | 'api' | 'device';
};

export type CollarLocationListener = (snapshot: CollarLocationSnapshot | null) => void;

export type CollarLocationSubscribeOptions = {
  petId: string;
  collarId?: string;
  intervalMs?: number;
};
