import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, type } from '../../theme';
import type { Pet } from '../../types/pet';
import { Card } from '../ui/Card';
import { PetAvatar } from './PetAvatar';

type Props = {
  pet: Pet;
};

export function PetCard({ pet }: Props) {
  return (
    <Card style={styles.wrap}>
      <PetAvatar pet={pet} size={56} />
      <View style={styles.body}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.meta}>
          {pet.breed} · {pet.ageLabel} · {pet.sex}
        </Text>
        <Text style={styles.mood}>{pet.wellbeing}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  body: {
    flex: 1,
  },
  name: {
    ...type.subtitle,
    color: colors.ink,
  },
  meta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
  mood: {
    ...type.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginTop: 6,
  },
});
