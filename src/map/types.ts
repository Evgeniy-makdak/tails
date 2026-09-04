import type { ReactNode } from 'react';

export type MapLatLng = {
  latitude: number;
  longitude: number;
};

export type MapMarker = {
  id: string;
  coordinate: MapLatLng;
  /** 'pet' | 'sos-ghost' | custom */
  kind: 'pet' | 'sos-ghost' | 'generic';
};

export type MapCircle = {
  id: string;
  center: MapLatLng;
  radiusM: number;
  color: string;
  strokeColor?: string;
};

export type MapPolyline = {
  id: string;
  coordinates: MapLatLng[];
  color: string;
  width?: number;
};

export type MapCamera = {
  center: MapLatLng;
  zoom: number;
};

export type MapCanvasProps = {
  camera?: MapCamera;
  markers?: MapMarker[];
  circles?: MapCircle[];
  polylines?: MapPolyline[];
  /** Visual zoom multiplier used by demo surface (CSS scale). MapLibre will use camera.zoom. */
  previewScale?: number;
  children?: ReactNode;
  style?: object;
};
