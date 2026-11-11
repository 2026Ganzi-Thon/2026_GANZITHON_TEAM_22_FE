import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, fonts, fontSize } from '@/constants/theme';

// 대화 입력창 + 전송 버튼
export default function ChatInput({ onSend, disabled = false }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState('');
  const send = () => {
    if (disabled || !text.trim()) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <View style={styles.box}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={send}
        editable={!disabled}
        placeholder="친구들에게 이야기하기"
        placeholderTextColor={colors.textSub}
        returnKeyType="send"
        style={styles.input}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="보내기" disabled={disabled} onPress={send} hitSlop={6}>
        <Image source={require('@/assets/images/icons/etc/send.png')} style={styles.send} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 8,
    borderRadius: 23,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  send: {
    width: 32,
    height: 32,
  },
});
