import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../theme';

type Props = {
  size?: number;
};

export function TailioMark({ size = 88 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <Circle cx="44" cy="44" r="44" fill={colors.purpleSoft} />
      <Path
        d="M44 18c12 0 22 8 24 18 8 2 12 10 10 18-2 8-10 12-18 10-4 10-14 16-24 14-12-2-20-12-18-24 2-4 0-10-4-14 6-10 16-22 30-22z"
        fill={colors.purple}
      />
      <Circle cx="38" cy="40" r="4" fill={colors.white} />
      <Circle cx="54" cy="40" r="4" fill={colors.white} />
      <Path d="M36 54c6 6 14 6 20 0" stroke={colors.white} strokeWidth="3" strokeLinecap="round" />
      <Path d="M58 22c8-2 16 6 14 14" stroke={colors.purple} strokeWidth="6" strokeLinecap="round" />
    </Svg>
  );
}

export function TailioBlob({ size = 160 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Path
        d="M80 16c28 0 56 24 58 52 10 6 16 22 8 36-6 12-20 18-34 16-6 18-24 32-48 30-30-4-50-28-46-56 2-10-2-22-12-28 10-22 38-50 74-50z"
        fill={colors.purple}
      />
      <Circle cx="64" cy="72" r="7" fill={colors.white} />
      <Circle cx="96" cy="72" r="7" fill={colors.white} />
      <Circle cx="66" cy="74" r="3" fill={colors.ink} />
      <Circle cx="98" cy="74" r="3" fill={colors.ink} />
      <Path d="M68 98c8 10 20 10 28 0" stroke={colors.white} strokeWidth="5" strokeLinecap="round" />
      <Path d="M72 112c4 10 16 12 24 4" fill="#F4A4B8" />
    </Svg>
  );
}
