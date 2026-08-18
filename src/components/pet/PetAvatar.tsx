import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';
import type { Pet } from '../../types/pet';

type Props = {
  pet: Pet;
  size?: number;
};

export function PetAvatar({ pet, size = 56 }: Props) {
  const glyph = pet.kind === 'cat' ? '🐈' : '🐕';

  return (
    <View style={{ width: size, height: size }}>
      {pet.photo ? (
        <Image source={pet.photo} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.glyph}>{glyph}</Text>
        </View>
      )}
      <View
        style={[
          styles.dot,
          { backgroundColor: pet.online ? colors.green : colors.muted, borderColor: colors.paper },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.line,
  },
  fallback: {
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 22,
  },
  dot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
