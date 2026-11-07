import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';

type Props = {
  label: string;
  onPress?: () => void;
  /** fill: 코랄 채움 / outline: 코랄 테두리 */
  variant?: 'fill' | 'outline';
  size?: 'lg' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// 코랄색 버튼 (예: 함께 시작하기, 바로 시작하자!)
export default function Button({ label, onPress, variant = 'fill', size = 'lg', disabled, style }: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'md' && styles.md,
        outline && styles.outline,
        (pressed || disabled) && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, size === 'md' && styles.labelMd, outline ? styles.outlineLabel : styles.fillLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 49,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    height: 45,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.lg,
    color: colors.white,
  },
  fillLabel: {
    textShadowColor: 'rgba(63, 0, 0, 0.53)',
    textShadowRadius: 8,
  },
  labelMd: {
    fontSize: fontSize.md + 2,
  },
  outlineLabel: {
    color: colors.primary,
  },
});
