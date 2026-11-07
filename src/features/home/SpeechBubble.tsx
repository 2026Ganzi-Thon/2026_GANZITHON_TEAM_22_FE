import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize } from '@/constants/theme';

// 홈 상단 감정콩 말풍선 (꼬리는 오른쪽 아래)
export default function SpeechBubble({ text }: { text: string }) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    minWidth: 179,
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.title,
    fontSize: fontSize.md,
    lineHeight: 17,
    color: colors.text,
    textAlign: 'center',
  },
  tail: {
    position: 'absolute',
    right: 4,
    bottom: -3,
    width: 12,
    height: 12,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
});
