import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';

type Props = {
  value?: string;
  placeholder: string;
  onPress: () => void;
};

// 입력칸처럼 생긴 버튼 (마감 날짜 선택 등, 누르면 시트가 열림)
export default function FieldButton({ value, placeholder, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.field}>
      <Text style={[styles.text, !value && styles.placeholder]}>{value ?? placeholder}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 49,
    paddingHorizontal: 17,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  placeholder: {
    fontSize: fontSize.md,
    color: colors.textSub,
  },
});
