import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  /** Full side length of the square in screen pixels. */
  sidePx: number;
  /** Offset from the map viewport center (px). */
  offsetX: number;
  offsetY: number;
  strokeColor: string;
  fillColor: string;
  onResize: (nextSidePx: number) => void;
  /** Drag the whole square (screen px delta from gesture start). */
  onMove: (dx: number, dy: number) => void;
  onMoveEnd?: () => void;
  minSidePx?: number;
  maxSidePx?: number;
};

type Corner = { key: string; sx: 1 | -1; sy: 1 | -1 };

const CORNERS: Corner[] = [
  { key: 'tl', sx: -1, sy: -1 },
  { key: 'tr', sx: 1, sy: -1 },
  { key: 'bl', sx: -1, sy: 1 },
  { key: 'br', sx: 1, sy: 1 },
];

/**
 * Movable + resizable square overlay for geofence editing.
 * Parent converts screen deltas ↔ lat/lng.
 */
export function ZoneResizeOverlay({
  sidePx,
  offsetX,
  offsetY,
  strokeColor,
  fillColor,
  onResize,
  onMove,
  onMoveEnd,
  minSidePx = 64,
  maxSidePx = 420,
}: Props) {
  const startSide = useRef(sidePx);
  const latestSide = useRef(sidePx);
  latestSide.current = sidePx;

  const bodyPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_evt, gesture) => {
          onMove(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: () => onMoveEnd?.(),
        onPanResponderTerminate: () => onMoveEnd?.(),
      }),
    [onMove, onMoveEnd],
  );

  const responders = useMemo(() => {
    return CORNERS.map((corner) => {
      const pan = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          startSide.current = latestSide.current;
        },
        onPanResponderMove: (_evt, gesture) => {
          const growth = corner.sx * gesture.dx + corner.sy * gesture.dy;
          const next = Math.min(maxSidePx, Math.max(minSidePx, startSide.current + growth));
          onResize(next);
        },
      });
      return { ...corner, pan };
    });
  }, [maxSidePx, minSidePx, onResize]);

  const half = sidePx / 2;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View
        {...bodyPan.panHandlers}
        style={[
          styles.square,
          {
            width: sidePx,
            height: sidePx,
            marginLeft: offsetX - half,
            marginTop: offsetY - half,
            borderColor: strokeColor,
            backgroundColor: fillColor,
          },
        ]}
      />
      {responders.map((corner) => (
        <View
          key={corner.key}
          {...corner.pan.panHandlers}
          style={[
            styles.handle,
            {
              marginLeft: offsetX + corner.sx * half - 14,
              marginTop: offsetY + corner.sy * half - 14,
              borderColor: strokeColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  square: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderWidth: 3,
    borderRadius: 10,
  },
  handle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
