import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CHARACTER_IDS, CHARACTERS, type CharacterId } from '@/constants/characters';
import { colors, fonts, fontSize, radius } from '@/constants/theme';

type Props = {
  enabled: Record<CharacterId, boolean>;
  onToggle: (id: CharacterId) => void;
};

// 대화할 친구 ON/OFF 팝오버 (2순위 기능, UI만). 최소 한 명은 켜져 있어야 한다
export default function FriendToggleMenu({ enabled, onToggle }: Props) {
  const onCount = CHARACTER_IDS.filter((id) => enabled[id]).length;
  return (
    <View style={styles.menu}>
      {CHARACTER_IDS.map((id) => {
        const on = enabled[id];
        return (
          <View key={id} style={styles.row}>
            <Text style={styles.name}>{CHARACTERS[id].name}</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              disabled={on && onCount === 1}
              onPress={() => onToggle(id)}
              style={[styles.pill, { backgroundColor: CHARACTERS[id].color }, !on && styles.off]}>
              <Text style={styles.pillText}>{on ? 'ON' : 'OFF'}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    zIndex: 10,
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  name: {
    width: 50,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
  },
  pill: {
    width: 46,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  off: {
    opacity: 0.35,
  },
  pillText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
