import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import ChatInput from '@/features/chat/ChatInput';
import MessageItem from '@/features/chat/MessageItem';
import { CHARACTER_IDS, type CharacterId } from '@/constants/characters';
import { colors, fonts } from '@/constants/theme';
import { createExchange, getChatHistory, newClientRequestId, type ExchangeDTO, type ExchangeUtteranceDTO } from '@/services/backend';
import type { ChatMessage } from '@/types/chat';

type Props = {
  bottomInset?: number;
  studySessionId?: string;
  characterKeys?: CharacterId[];
};

function characterId(value: unknown, fallback: CharacterId): CharacterId {
  const normalized = String(value ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (normalized === 'angry' || normalized === 'anger') return 'angry';
  if (normalized === 'sad' || normalized === 'sadness') return 'sad';
  if (normalized === 'joy' || normalized === 'happy' || normalized === 'happiness') return 'joy';
  return fallback;
}

function toMessage(utterance: ExchangeUtteranceDTO, fallback: CharacterId, index: number): ChatMessage | null {
  const value = utterance as ExchangeUtteranceDTO & Record<string, unknown>;
  const text = value.content ?? value.text ?? value.message ?? value.utterance;
  if (typeof text !== 'string' || !text.trim()) return null;
  const sender = characterId(value.characterKey ?? value.characterId ?? value.character ?? value.speaker, fallback);
  return { id: value.id ?? `reply-${index}-${newClientRequestId()}`, sender, text: text.trim() };
}

function messagesFromHistory(exchange: ExchangeDTO, fallback: CharacterId): ChatMessage[] {
  const userMessage = exchange.content?.trim()
    ? [{ id: `${exchange.id}-user`, sender: 'me' as const, text: exchange.content.trim() }]
    : [];
  const replies = Array.isArray(exchange.utterances)
    ? exchange.utterances.map((utterance, index) => toMessage(utterance, fallback, index)).filter((item): item is ChatMessage => item !== null)
    : [];
  return [...userMessage, ...replies];
}

function isFailed(exchange: ExchangeDTO) {
  return exchange.status.toUpperCase() === 'FAILED' || Boolean(exchange.failureCode);
}

export default function ChatRoom({ bottomInset = 0, studySessionId, characterKeys = CHARACTER_IDS }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const previousRequestId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const waitingId = messages.find((message) => message.pending)?.id;
  const fallbackCharacter = characterKeys[0] ?? 'joy';

  useEffect(() => {
    let active = true;
    getChatHistory(50)
      .then(({ items }) => {
        if (!active) return;
        const newestFirst = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        previousRequestId.current = newestFirst[0]?.clientRequestId ?? null;
        setMessages(newestFirst.reverse().flatMap((item) => messagesFromHistory(item, fallbackCharacter)));
      })
      .catch((error) => {
        if (active) Alert.alert('대화 기록을 불러오지 못했어', error instanceof Error ? error.message : '새 대화는 계속할 수 있어.');
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [fallbackCharacter]);

  const send = async (content: string) => {
    if (inFlight.current || loadingHistory) return;
    inFlight.current = true;
    const clientRequestId = newClientRequestId();
    const pendingId = newClientRequestId();
    setMessages((current) => [
      ...current,
      { id: newClientRequestId(), sender: 'me', text: content },
      { id: pendingId, sender: fallbackCharacter, text: '', pending: true },
    ]);

    try {
      const exchange = await createExchange({
        clientRequestId,
        content,
        studySessionId: studySessionId ?? null,
        previousRequestId: previousRequestId.current,
        characterKeys: characterKeys.map((key) => key.toUpperCase()),
      });
      previousRequestId.current = exchange.clientRequestId;
      if (isFailed(exchange)) {
        throw new Error(exchange.failureCode ? `답변을 만들지 못했어 (${exchange.failureCode}).` : '답변을 만들지 못했어.');
      }
      const replies = Array.isArray(exchange.utterances)
        ? exchange.utterances.map((utterance, index) => toMessage(utterance, fallbackCharacter, index)).filter((item): item is ChatMessage => item !== null)
        : [];
      if (!replies.length) throw new Error('AI가 답변을 보내지 않았어. 잠시 후 다시 시도해줘.');
      setMessages((current) => current.flatMap((message) => {
        if (message.id !== pendingId) return [message];
        return replies;
      }));
    } catch (error) {
      setMessages((current) => current.filter((message) => message.id !== pendingId));
      Alert.alert('대화를 보내지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <MessageItem message={item} />}
        ListEmptyComponent={!loadingHistory ? <Text style={styles.empty}>친구들에게 먼저 이야기해 봐.</Text> : undefined}
        contentContainerStyle={styles.list}
      />
      <ChatInput onSend={send} disabled={loadingHistory || Boolean(waitingId)} />
      <View style={{ height: bottomInset + 12 }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: 22 },
  list: { flexGrow: 1, justifyContent: 'flex-end', gap: 14, paddingVertical: 12 },
  empty: { alignSelf: 'center', marginVertical: 16, fontFamily: fonts.body, fontSize: 14, color: colors.textSub },
});
