import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  checked: boolean;
  onPress?: () => void;
};

// 할 일·세부 할 일 왼쪽 동그라미. 체크하면 코랄로 채워진다
export default function CheckCircle({ checked, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={10}
      onPress={onPress}
      style={[styles.circle, checked && styles.checked]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  checked: {
    borderColor: colors.primarySoft,
    backgroundColor: colors.primarySoft,
  },
});
