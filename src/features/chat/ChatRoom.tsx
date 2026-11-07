import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import ChatInput from '@/features/chat/ChatInput';
import MessageItem from '@/features/chat/MessageItem';
import { MOCK_MESSAGES } from '@/mocks/messages';
import { newId } from '@/mocks/store';
import type { ChatMessage } from '@/types/chat';

// 대화 목록 + 입력창 (CH-01, ST-03-chat 공용)
export default function ChatRoom({ bottomInset = 0 }: { bottomInset?: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);

  // TODO(API): 메시지 전송 → 캐릭터 AI 응답 받아서 추가
  const send = (text: string) => setMessages((prev) => [...prev, { id: newId(), sender: 'me', text }]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageItem message={item} />}
        contentContainerStyle={styles.list}
      />
      <ChatInput onSend={send} />
      <View style={{ height: bottomInset + 12 }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    paddingHorizontal: 22,
  },
  list: {
    gap: 14,
    paddingVertical: 12,
  },
});
