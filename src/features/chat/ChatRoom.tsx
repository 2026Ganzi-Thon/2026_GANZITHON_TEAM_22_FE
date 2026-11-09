import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import ChatInput from '@/features/chat/ChatInput';
import MessageItem from '@/features/chat/MessageItem';
import { MOCK_MESSAGES } from '@/mocks/messages';
import { newId } from '@/mocks/store';
import type { CharacterId } from '@/constants/characters';
import type { ChatMessage } from '@/types/chat';

// 가짜 답장 (API 연결 전 확인용)
const MOCK_REPLY: { sender: CharacterId; text: string } = { sender: 'joy', text: '좋아, 우리 같이 조금만 해보자!' };

// 대화 목록 + 입력창 (CH-01, ST-03-chat 공용)
export default function ChatRoom({ bottomInset = 0 }: { bottomInset?: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const waiting = messages.some((m) => m.pending);

  // 답을 기다리는 동안 "…" 말풍선을 띄우고, 답이 오면 그 자리를 답으로 바꾼다. 기다리는 중에는 새로 보내지 않는다
  // TODO(API): 타이머 자리를 A16 대화 요청으로 교체 (최대 35초 대기, 실패하면 pending 말풍선 제거 + 실패 안내)
  const send = (text: string) => {
    if (waiting) return;
    const pendingId = newId();
    setMessages((prev) => [
      ...prev,
      { id: newId(), sender: 'me', text },
      { id: pendingId, sender: MOCK_REPLY.sender, text: '', pending: true },
    ]);
    timer.current = setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, text: MOCK_REPLY.text, pending: false } : m)));
    }, 1500);
  };

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
