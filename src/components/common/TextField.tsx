import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';

// 크림색 둥근 입력칸
export default function TextField({ style, ...props }: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textSub} style={[styles.input, style]} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    height: 49,
    paddingHorizontal: 17,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
