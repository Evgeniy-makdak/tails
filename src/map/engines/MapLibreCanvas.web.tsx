import { createElement, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { mapConfig } from '../config';
import {
  CIRCLES_FILL,
  CIRCLES_LINE,
  CIRCLES_SOURCE,
  LINES_LAYER,
  LINES_SOURCE,
  circlesToFeatureCollection,
  markerColor,
  polylinesToFeatureCollection,
} from '../scene';
import { DEFAULT_MAP_STYLE_URL } from '../tiles';
import type { MapCanvasProps, MapMarker } from '../types';

function ensureOverlayLayers(map: maplibregl.Map) {
  if (!map.getSource(CIRCLES_SOURCE)) {
    map.addSource(CIRCLES_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: CIRCLES_FILL,
      type: 'fill',
      source: CIRCLES_SOURCE,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 1,
      },
    });
    map.addLayer({
      id: CIRCLES_LINE,
      type: 'line',
      source: CIRCLES_SOURCE,
      paint: {
        'line-color': ['get', 'strokeColor'],
        'line-width': 2,
      },
    });
  }
  if (!map.getSource(LINES_SOURCE)) {
    map.addSource(LINES_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: LINES_LAYER,
      type: 'line',
      source: LINES_SOURCE,
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['coalesce', ['get', 'width'], 3],
        'line-opacity': 0.9,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    });
  }
}

function syncMarkers(
  map: maplibregl.Map,
  markers: MapMarker[],
  store: Map<string, maplibregl.Marker>,
) {
  const nextIds = new Set(markers.map((m) => m.id));
  for (const [id, marker] of store) {
    if (!nextIds.has(id)) {
      marker.remove();
      store.delete(id);
    }
  }
  for (const item of markers) {
    const existing = store.get(item.id);
    const lngLat: [number, number] = [item.coordinate.longitude, item.coordinate.latitude];
    if (existing) {
      existing.setLngLat(lngLat);
      continue;
    }
    const el = document.createElement('div');
    el.style.width = item.kind === 'pet' ? '18px' : '14px';
    el.style.height = el.style.width;
    el.style.borderRadius = '50%';
    el.style.background = markerColor(item.kind);
    el.style.border = '2px solid #fff';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
    if (item.kind === 'pet') {
      el.style.width = '22px';
      el.style.height = '22px';
      el.style.boxShadow = '0 0 0 6px rgba(139,127,255,0.28), 0 2px 8px rgba(0,0,0,0.25)';
    }
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(map);
    store.set(item.id, marker);
  }
}

/**
 * Real MapLibre GL map on web (GitHub Pages / Expo web).
 * Tiles: OpenFreeMap Liberty — free, no API key.
 */
export function MapLibreCanvas({
  camera,
  markers = [],
  circles = [],
  polylines = [],
  followKey = 0,
  children,
  style,
}: MapCanvasProps & { children?: ReactNode }): ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef(new Map<string, maplibregl.Marker>());
  const readyRef = useRef(false);
  /** User dragged the map — stop auto-centering on GPS until followKey bumps. */
  const userPanningRef = useRef(false);
  const lastFollowKeyRef = useRef(followKey);

  const center = camera?.center ?? mapConfig.defaultCamera.center;
  const zoom = camera?.zoom ?? mapConfig.defaultCamera.zoom;
  const sceneRef = useRef({ markers, circles, polylines, center, zoom });
  sceneRef.current = { markers, circles, polylines, center, zoom };

  useEffect(() => {
    const node = containerRef.current;
    if (!node || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: node,
      style: DEFAULT_MAP_STYLE_URL,
      center: [center.longitude, center.latitude],
      zoom,
      attributionControl: { compact: true },
      logoPosition: 'bottom-left',
    });
    mapRef.current = map;

    const onDragStart = () => {
      userPanningRef.current = true;
    };
    map.on('dragstart', onDragStart);

    map.on('load', () => {
      ensureOverlayLayers(map);
      readyRef.current = true;
      const scene = sceneRef.current;
      const circleSource = map.getSource(CIRCLES_SOURCE) as maplibregl.GeoJSONSource | undefined;
      circleSource?.setData(circlesToFeatureCollection(scene.circles));
      const lineSource = map.getSource(LINES_SOURCE) as maplibregl.GeoJSONSource | undefined;
      lineSource?.setData(polylinesToFeatureCollection(scene.polylines));
      syncMarkers(map, scene.markers, markersRef.current);
      map.jumpTo({
        center: [scene.center.longitude, scene.center.latitude],
        zoom: scene.zoom,
      });
    });

    return () => {
      map.off('dragstart', onDragStart);
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter control: always unlock follow and fly to pet.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (followKey === lastFollowKeyRef.current) return;
    lastFollowKeyRef.current = followKey;
    userPanningRef.current = false;
    map.easeTo({
      center: [center.longitude, center.latitude],
      zoom,
      duration: 450,
    });
  }, [followKey, center.latitude, center.longitude, zoom]);

  // Zoom always applies. Center follows GPS only while not user-panned.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    if (userPanningRef.current) {
      if (Math.abs(map.getZoom() - zoom) > 0.05) {
        map.easeTo({ zoom, duration: 200 });
      }
      return;
    }

    map.easeTo({
      center: [center.longitude, center.latitude],
      zoom,
      duration: 500,
    });
  }, [center.latitude, center.longitude, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const circleSource = map.getSource(CIRCLES_SOURCE) as maplibregl.GeoJSONSource | undefined;
    circleSource?.setData(circlesToFeatureCollection(circles));
  }, [circles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const lineSource = map.getSource(LINES_SOURCE) as maplibregl.GeoJSONSource | undefined;
    lineSource?.setData(polylinesToFeatureCollection(polylines));
  }, [polylines]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncMarkers(map, markers, markersRef.current);
  }, [markers]);

  return (
    <View style={[styles.root, style]}>
      {createElement('div', {
        ref: containerRef,
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        },
      })}
      <View style={styles.overlay} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E8EEF2',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
