import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../theme';

type Props = {
  size?: number;
  color?: string;
};

export function TailMark({ size = 72, color = colors.terracotta }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <Circle cx="36" cy="36" r="34" stroke={color} strokeWidth="2.5" opacity={0.22} />
      <Path
        d="M22 46c2-12 10-20 20-22 8-1.5 14 3 13 9-1 6-8 7-12 4 6 2 10 8 7 14-4 8-16 10-24 4"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="24.5" cy="49" r="3.2" fill={color} />
    </Svg>
  );
}
