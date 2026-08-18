import { Image, StyleSheet } from 'react-native';

type Props = {
  size?: number;
};

export function TailioMark({ size = 88 }: Props) {
  return (
    <Image
      source={require('../../../assets/brand/tailio-mark.png')}
      style={{ width: size, height: size * (140 / 149) }}
      resizeMode="contain"
    />
  );
}

export function TailioBlob({ size = 160 }: Props) {
  return (
    <Image
      source={require('../../../assets/brand/welcome-mascot.png')}
      style={{ width: size, height: size * 1.2 }}
      resizeMode="contain"
    />
  );
}
