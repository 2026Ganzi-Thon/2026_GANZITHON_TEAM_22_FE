import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/common/Button';
import ChatInput from '@/features/chat/ChatInput';
import MessageItem from '@/features/chat/MessageItem';
import { CHARACTER_IDS, type CharacterId } from '@/constants/characters';
import { colors, fonts } from '@/constants/theme';
import { useMockStore } from '@/mocks/store';
import { createExchange, getChatHistory, getChatUsage, newClientRequestId, type ExchangeRequest, type ChatHistoryItemDTO, type ExchangeDTO, type ExchangeUtteranceDTO } from '@/services/backend';
import { apiErrorCode, needsChatRecovery, pollExchange } from '@/services/chatRecovery';
import type { ChatMessage } from '@/types/chat';
import { readPreference, writePreference } from '@/utils/preferences';
import { showAlert } from '@/utils/alert';

type Props = { bottomInset?: number; studySessionId?: string; characterKeys?: CharacterId[] };

function characterId(value: unknown): CharacterId {
  const normalized = String(value ?? '').toLowerCase();
  return CHARACTER_IDS.find((id) => id === normalized) ?? 'joy';
}

function repliesFrom(exchange: Pick<ExchangeDTO, 'clientRequestId' | 'utterances'>): ChatMessage[] {
  return (exchange.utterances ?? []).flatMap((utterance: ExchangeUtteranceDTO, index) => {
    const text = utterance.content ?? utterance.text;
    return text?.trim() ? [{
      id: `${exchange.clientRequestId}-reply-${index}`,
      sender: characterId(utterance.characterKey), text: text.trim(),
    }] : [];
  });
}

function userMessage(request: Pick<ExchangeRequest, 'clientRequestId' | 'content'>): ChatMessage {
  return { id: `${request.clientRequestId}-user`, sender: 'me', text: request.content };
}

function messagesFromHistory(exchange: ChatHistoryItemDTO): ChatMessage[] {
  return [...(exchange.content?.trim() ? [userMessage(exchange)] : []), ...repliesFrom(exchange)];
}

function errorMessage(error: unknown) {
  return apiErrorCode(error) === 'CHAT_NOT_CONFIGURED'
    ? '서버에서 AI 답변을 준비 중이야.'
    : error instanceof Error ? error.message : '잠시 후 다시 시도해줘.';
}

export default function ChatRoom(props: Props) {
  const { userId } = useMockStore();
  return userId ? <ChatConversation key={`${userId}-${props.studySessionId ?? 'home'}`} userId={userId} {...props} /> : null;
}

function ChatConversation({ userId, bottomInset = 0, studySessionId, characterKeys = CHARACTER_IDS }: Props & { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dailyRequestLimit, setDailyRequestLimit] = useState<number | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<ExchangeRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const previousRequestId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const lifetime = useRef(new AbortController());
  const contextId = studySessionId ?? null;
  const storageKey = `pendingChat.${userId}.${studySessionId ?? 'home'}`;

  const finish = useCallback(async (request: ExchangeRequest, exchange: ExchangeDTO, signal: AbortSignal) => {
    if (signal.aborted) return;
    await writePreference(storageKey, null);
    if (signal.aborted) return;
    previousRequestId.current = exchange.status === 'SUCCEEDED' && !exchange.failureCode ? exchange.clientRequestId : null;
    setPendingRequest(null);
    setMessages((current) => [
      ...current.filter((item) => !item.id.startsWith(`${request.clientRequestId}-`)),
      userMessage(request), ...repliesFrom(exchange),
    ]);
    setSendError(exchange.status === 'FAILED' || exchange.failureCode
      ? `답변을 만들지 못했어${exchange.failureCode ? ` (${exchange.failureCode})` : '.'}`
      : null);
  }, [storageKey]);

  const checkResult = useCallback(async (request: ExchangeRequest, signal: AbortSignal) => {
    try {
      const exchange = await pollExchange(request.clientRequestId, signal);
      if (exchange) await finish(request, exchange, signal);
      else if (!signal.aborted) setSendError('답변 결과를 아직 확인하지 못했어. 같은 요청을 다시 확인해줘.');
    } catch (error) {
      if (!signal.aborted) setSendError(errorMessage(error));
    }
  }, [finish]);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    getChatUsage().then((usage) => {
      if (!controller.signal.aborted) setDailyRequestLimit(usage.dailyRequestLimit);
    }).catch(() => undefined);
    const initialize = async () => {
      // Restore the original body before accepting another message, even after a restart.
      const saved = await readPreference<ExchangeRequest | null>(storageKey, null);
      if (controller.signal.aborted) return;
      let history: ChatHistoryItemDTO[] = [];
      try {
        history = (await getChatHistory(50)).items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        if (!controller.signal.aborted) showAlert('대화 기록을 불러오지 못했어', errorMessage(error));
      }
      if (controller.signal.aborted) return;
      const latest = history.find((item) => item.studySessionId === contextId);
      previousRequestId.current = latest?.status === 'SUCCEEDED' && !latest.failureCode ? latest.clientRequestId : null;
      const items = history.reverse().flatMap(messagesFromHistory);
      if (saved && !items.some((item) => item.id === `${saved.clientRequestId}-user`)) items.push(userMessage(saved));
      setMessages(items);
      setPendingRequest(saved);
      setLoadingHistory(false);
      if (saved) {
        inFlight.current = true;
        setBusy(true);
        await checkResult(saved, controller.signal);
        if (!controller.signal.aborted) {
          inFlight.current = false;
          setBusy(false);
        }
      }
    };
    initialize().catch((error) => {
      if (!controller.signal.aborted) setSendError(errorMessage(error));
    });
    return () => controller.abort();
  }, [storageKey, contextId, checkResult]);

  const send = async (content: string) => {
    if (inFlight.current || loadingHistory || pendingRequest) return;
    const request: ExchangeRequest = {
      clientRequestId: newClientRequestId(), content, studySessionId: contextId,
      previousRequestId: previousRequestId.current,
      characterKeys: characterKeys.map((key) => key.toUpperCase()),
    };
    inFlight.current = true;
    setBusy(true);
    setSendError(null);
    const signal = lifetime.current.signal;
    try {
      await writePreference(storageKey, request);
      if (signal.aborted) return;
      setPendingRequest(request);
      setMessages((current) => [...current, userMessage(request)]);
      try {
        const exchange = await createExchange(request);
        if (exchange.status === 'SUCCEEDED' || exchange.status === 'FAILED') await finish(request, exchange, signal);
        else await checkResult(request, signal);
      } catch (error) {
        if (signal.aborted) return;
        if (needsChatRecovery(error)) await checkResult(request, signal);
        else {
          await writePreference(storageKey, null);
          setPendingRequest(null);
          if (apiErrorCode(error) === 'INVALID_PREVIOUS_EXCHANGE') previousRequestId.current = null;
          setSendError(errorMessage(error));
        }
      }
    } catch (error) {
      if (!signal.aborted) setSendError(errorMessage(error));
    } finally {
      if (!signal.aborted) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  };

  const recheck = async () => {
    if (inFlight.current || !pendingRequest) return;
    inFlight.current = true;
    setBusy(true);
    setSendError(null);
    await checkResult(pendingRequest, lifetime.current.signal);
    inFlight.current = false;
    setBusy(false);
  };
  const waitingMessage: ChatMessage[] = pendingRequest && busy
    ? [{ id: `${pendingRequest.clientRequestId}-pending`, sender: characterId(pendingRequest.characterKeys?.[0]), text: '', pending: true }]
    : [];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {dailyRequestLimit !== null && <Text style={styles.usage}>하루 대화 요청 한도 {dailyRequestLimit}회</Text>}
      <FlatList
        data={[...messages, ...waitingMessage].reverse()} inverted
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <MessageItem message={item} />}
        ListEmptyComponent={!loadingHistory ? <Text style={styles.empty}>친구들에게 먼저 이야기해 봐.</Text> : undefined}
        contentContainerStyle={styles.list}
      />
      {sendError && <Text accessibilityRole="alert" style={styles.sendError}>{sendError}</Text>}
      {pendingRequest && !busy && <Button label="다시 확인" size="md" variant="outline" onPress={recheck} />}
      <ChatInput onSend={send} disabled={loadingHistory || busy || Boolean(pendingRequest)} />
      <View style={{ height: bottomInset + 12 }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: 22 },
  list: { flexGrow: 1, justifyContent: 'flex-end', gap: 14, paddingVertical: 12 },
  empty: { alignSelf: 'center', marginVertical: 16, fontFamily: fonts.body, fontSize: 14, color: colors.textSub },
  usage: { alignSelf: 'flex-end', paddingTop: 4, fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  sendError: { marginBottom: 8, fontFamily: fonts.body, fontSize: 14, color: colors.textSub },
});
