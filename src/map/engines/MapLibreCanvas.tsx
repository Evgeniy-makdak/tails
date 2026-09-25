import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { mapConfig } from '../config';
import { DEFAULT_MAP_STYLE_URL } from '../tiles';
import type { MapCanvasProps } from '../types';

function buildHtml(styleUrl: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css" rel="stylesheet" />
  <script src="https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js"><\/script>
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; background:#E8EEF2; }
    .pet-dot {
      width: 22px; height: 22px; border-radius: 50%;
      background: #8B7FFF; border: 2px solid #fff;
      box-shadow: 0 0 0 6px rgba(139,127,255,0.28), 0 2px 8px rgba(0,0,0,0.25);
    }
    .ghost-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: #E24B4A; border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25); opacity: 0.75;
    }
    .generic-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: #5B5B5B; border: 2px solid #fff;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const STYLE_URL = ${JSON.stringify(styleUrl)};
    const CIRCLES_SOURCE = 'hvostik-circles';
    const CIRCLES_FILL = 'hvostik-circles-fill';
    const CIRCLES_LINE = 'hvostik-circles-line';
    const LINES_SOURCE = 'hvostik-lines';
    const LINES_LAYER = 'hvostik-lines-layer';
    const markers = new Map();
    let userPanning = false;
    let ready = false;
    let lastFollowKey = 0;

    function circlesToFC(circles) {
      const EARTH = 6371008.8;
      return {
        type: 'FeatureCollection',
        features: (circles || []).map((circle) => {
          const steps = 64;
          const ring = [];
          for (let i = 0; i <= steps; i++) {
            const bearing = (i / steps) * 2 * Math.PI;
            const d = circle.radiusM / EARTH;
            const lat1 = circle.center.latitude * Math.PI / 180;
            const lon1 = circle.center.longitude * Math.PI / 180;
            const sinLat2 = Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing);
            const lat2 = Math.asin(sinLat2);
            const lon2 = lon1 + Math.atan2(
              Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
              Math.cos(d) - Math.sin(lat1) * sinLat2
            );
            ring.push([((lon2 * 180 / Math.PI + 540) % 360) - 180, lat2 * 180 / Math.PI]);
          }
          return {
            type: 'Feature',
            properties: {
              color: circle.color,
              strokeColor: circle.strokeColor || circle.color
            },
            geometry: { type: 'Polygon', coordinates: [ring] }
          };
        })
      };
    }

    function linesToFC(polylines) {
      return {
        type: 'FeatureCollection',
        features: (polylines || []).map((line) => ({
          type: 'Feature',
          properties: { color: line.color, width: line.width || 3 },
          geometry: {
            type: 'LineString',
            coordinates: line.coordinates.map((c) => [c.longitude, c.latitude])
          }
        }))
      };
    }

    function ensureLayers() {
      if (!map.getSource(CIRCLES_SOURCE)) {
        map.addSource(CIRCLES_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: CIRCLES_FILL, type: 'fill', source: CIRCLES_SOURCE, paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 1 } });
        map.addLayer({ id: CIRCLES_LINE, type: 'line', source: CIRCLES_SOURCE, paint: { 'line-color': ['get', 'strokeColor'], 'line-width': 2 } });
      }
      if (!map.getSource(LINES_SOURCE)) {
        map.addSource(LINES_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: LINES_LAYER, type: 'line', source: LINES_SOURCE,
          paint: { 'line-color': ['get', 'color'], 'line-width': ['coalesce', ['get', 'width'], 3], 'line-opacity': 0.9 },
          layout: { 'line-cap': 'round', 'line-join': 'round' }
        });
      }
    }

    function syncMarkers(list) {
      const ids = new Set((list || []).map((m) => m.id));
      for (const [id, marker] of markers) {
        if (!ids.has(id)) { marker.remove(); markers.delete(id); }
      }
      (list || []).forEach((item) => {
        const lngLat = [item.coordinate.longitude, item.coordinate.latitude];
        const existing = markers.get(item.id);
        if (existing) { existing.setLngLat(lngLat); return; }
        const el = document.createElement('div');
        el.className = item.kind === 'pet' ? 'pet-dot' : item.kind === 'sos-ghost' ? 'ghost-dot' : 'generic-dot';
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(map);
        markers.set(item.id, marker);
      });
    }

    function applyScene(scene) {
      if (!ready || !scene) return;
      const cam = scene.camera || {};
      const center = cam.center || { latitude: 59.9362, longitude: 30.3141 };
      const zoom = typeof cam.zoom === 'number' ? cam.zoom : 15;
      const followKey = typeof scene.followKey === 'number' ? scene.followKey : 0;

      if (followKey !== lastFollowKey) {
        lastFollowKey = followKey;
        userPanning = false;
        map.easeTo({ center: [center.longitude, center.latitude], zoom: zoom, duration: 450 });
      } else if (userPanning) {
        if (Math.abs(map.getZoom() - zoom) > 0.05) {
          map.easeTo({ zoom: zoom, duration: 200 });
        }
      } else {
        map.easeTo({ center: [center.longitude, center.latitude], zoom: zoom, duration: 500 });
      }

      map.getSource(CIRCLES_SOURCE).setData(circlesToFC(scene.circles));
      map.getSource(LINES_SOURCE).setData(linesToFC(scene.polylines));
      syncMarkers(scene.markers);
    }

    const map = new maplibregl.Map({
      container: 'map',
      style: STYLE_URL,
      center: [30.3141, 59.9362],
      zoom: 15,
      attributionControl: { compact: true }
    });
    map.on('dragstart', () => { userPanning = true; });
    map.on('load', () => {
      ensureLayers();
      ready = true;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    });
    window.__HVOSTIK_APPLY_SCENE__ = applyScene;
    document.addEventListener('message', (e) => {
      try { applyScene(JSON.parse(e.data)); } catch (err) {}
    });
    window.addEventListener('message', (e) => {
      try { applyScene(JSON.parse(e.data)); } catch (err) {}
    });
  <\/script>
</body>
</html>`;
}

/**
 * Native MapLibre via WebView (Expo Go friendly).
 * Same OpenFreeMap style as web — no Google/Yandex keys.
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
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const html = useMemo(() => buildHtml(DEFAULT_MAP_STYLE_URL), []);

  const scene = useMemo(
    () => ({
      camera: camera ?? mapConfig.defaultCamera,
      markers,
      circles,
      polylines,
      followKey,
    }),
    [camera, markers, circles, polylines, followKey],
  );

  const pushScene = () => {
    if (!readyRef.current || !webRef.current) return;
    const payload = JSON.stringify(scene);
    webRef.current.injectJavaScript(
      `try{window.__HVOSTIK_APPLY_SCENE__&&window.__HVOSTIK_APPLY_SCENE__(${payload});}catch(e){};true;`,
    );
  };

  useEffect(() => {
    pushScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg?.type === 'ready') {
        readyRef.current = true;
        pushScene();
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        mixedContentMode="always"
        setSupportMultipleWindows={false}
      />
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
  web: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
