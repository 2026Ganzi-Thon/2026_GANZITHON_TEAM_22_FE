import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { CHARACTERS } from '@/constants/characters';
import { colors, fonts } from '@/constants/theme';
import type { ChatMessage } from '@/types/chat';

// 대화 한 줄. 내 말풍선은 오른쪽, 감정콩은 프로필 + 이름 + 말풍선
export default function MessageItem({ message }: { message: ChatMessage }) {
  if (message.sender === 'me') {
    return (
      <View style={[styles.bubble, styles.mine]}>
        <Text style={styles.text}>{message.text}</Text>
      </View>
    );
  }
  const c = CHARACTERS[message.sender];
  return (
    <View style={styles.row}>
      <Image source={c.profile} style={[styles.avatar, { backgroundColor: c.soft }]} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.name}>{c.name}</Text>
        <View style={styles.bubble}>
          <Text style={[styles.text, message.pending && styles.pending]}>{message.pending ? '…' : message.text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  body: {
    gap: 4,
    flexShrink: 1,
  },
  name: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: 260,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  mine: {
    alignSelf: 'flex-end',
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  pending: {
    color: colors.textMuted,
    letterSpacing: 2,
  },
});
