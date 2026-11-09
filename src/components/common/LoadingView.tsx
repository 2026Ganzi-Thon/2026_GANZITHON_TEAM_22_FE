import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize } from '@/constants/theme';

// 데이터를 불러오는 동안 보여주는 화면 (목록·상세 자리에 넣어 쓴다)
export default function LoadingView({ message = '불러오는 중이야...' }: { message?: string }) {
  return (
    <View style={styles.box} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
