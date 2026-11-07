import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';

// D-day 배지 (예: D-1)
export default function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 26,
    minWidth: 43,
    paddingHorizontal: 8,
    borderRadius: radius.badge,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.surface,
  },
});
