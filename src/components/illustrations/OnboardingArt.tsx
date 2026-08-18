import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type SlideKey = 'care' | 'rhythm' | 'nearby';

type Props = {
  slide: SlideKey;
};

export function OnboardingArt({ slide }: Props) {
  return (
    <View style={styles.frame}>
      {slide === 'care' ? <CareArt /> : null}
      {slide === 'rhythm' ? <RhythmArt /> : null}
      {slide === 'nearby' ? <NearbyArt /> : null}
    </View>
  );
}

function CareArt() {
  return (
    <Svg width={280} height={240} viewBox="0 0 280 240">
      <Ellipse cx="140" cy="210" rx="92" ry="14" fill={colors.terracottaSoft} />
      <Path
        d="M86 150c-8 28 18 46 54 46s62-18 54-46c-6-22-30-34-54-34s-48 12-54 34z"
        fill={colors.clay}
      />
      <Circle cx="140" cy="108" r="42" fill={colors.clay} />
      <Circle cx="108" cy="86" r="16" fill={colors.clay} />
      <Circle cx="172" cy="86" r="16" fill={colors.clay} />
      <Circle cx="126" cy="106" r="5" fill={colors.ink} />
      <Circle cx="154" cy="106" r="5" fill={colors.ink} />
      <Path d="M140 114v8" stroke={colors.ink} strokeWidth="3" strokeLinecap="round" />
      <Path
        d="M128 128c8 8 16 8 24 0"
        stroke={colors.ink}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M188 150c18-6 36 10 28 28-6 14-24 16-34 6"
        stroke={colors.terracotta}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function RhythmArt() {
  return (
    <Svg width={280} height={240} viewBox="0 0 280 240">
      <Ellipse cx="140" cy="210" rx="92" ry="14" fill={colors.mossSoft} />
      <Rect x="58" y="118" width="72" height="56" rx="16" fill={colors.paper} />
      <Rect x="70" y="138" width="48" height="10" rx="5" fill={colors.terracottaSoft} />
      <Circle cx="94" cy="128" r="8" fill={colors.terracotta} />
      <Path
        d="M168 86c28 8 44 40 28 64-18 26-58 22-70-6"
        stroke={colors.moss}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="196" cy="78" r="16" fill={colors.terracotta} />
    </Svg>
  );
}

function NearbyArt() {
  return (
    <Svg width={280} height={240} viewBox="0 0 280 240">
      <Ellipse cx="140" cy="210" rx="92" ry="14" fill={colors.terracottaSoft} />
      <Path d="M140 64c32 0 56 24 56 56 0 44-56 84-56 84s-56-40-56-84c0-32 24-56 56-56z" fill={colors.moss} />
      <Circle cx="140" cy="118" r="22" fill={colors.paper} />
      <Path
        d="M132 122c0-8 16-8 16 0 0 6-8 10-8 10s-8-4-8-10z"
        fill={colors.terracotta}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 248,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
