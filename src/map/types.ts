import type { ReactNode } from 'react';

export type MapLatLng = {
  latitude: number;
  longitude: number;
};

export type MapMarker = {
  id: string;
  coordinate: MapLatLng;
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

export type MapPolygon = {
  id: string;
  ring: MapLatLng[];
  color: string;
  strokeColor?: string;
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
  polygons?: MapPolygon[];
  followKey?: number;
  onCameraChange?: (camera: MapCamera) => void;
  previewScale?: number;
  children?: ReactNode;
  style?: object;
};
