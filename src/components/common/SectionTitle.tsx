import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize } from '@/constants/theme';

type Props = {
  title: string;
  /** 제목 옆 작은 글자 (예: (선택)) */
  hint?: string;
  /** 오른쪽 끝 글자 (예: 등록 일시) */
  right?: string;
  size?: 'lg' | 'md';
};

// 화면 안 섹션 제목 (할 일 / 마감 날짜 / 세부 할 일)
export default function SectionTitle({ title, hint, right, size = 'md' }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, size === 'lg' && styles.lg]}>{title}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {right && <Text style={styles.right}>{right}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  title: {
    fontFamily: fonts.titleBold,
    fontSize: 26,
    letterSpacing: -1.3,
    color: colors.text,
  },
  lg: {
    fontSize: fontSize.xl,
    letterSpacing: -1.4,
  },
  hint: {
    fontFamily: fonts.title,
    fontSize: 15,
    letterSpacing: -0.75,
    color: colors.textSub,
  },
  right: {
    marginLeft: 'auto',
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.textSub,
  },
});
