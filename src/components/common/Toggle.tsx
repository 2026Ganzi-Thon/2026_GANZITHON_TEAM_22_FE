import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel?: string;
};

// 켜기/끄기 스위치 (MY-01 알림 설정)
export default function Toggle({ value, onChange, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!value)}
      style={[styles.track, value && styles.trackOn]}>
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 60,
    height: 32,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  trackOn: {
    backgroundColor: colors.primarySoft,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.joyStrong,
    opacity: 0.6,
  },
  thumbOn: {
    marginLeft: 'auto',
    backgroundColor: colors.surface,
    opacity: 1,
  },
});
