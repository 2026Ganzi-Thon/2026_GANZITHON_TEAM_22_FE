// ST-03-chat 스터디룸 대화
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '@/components/layout/Header';
import { colors, fonts, fontSize } from '@/constants/theme';
import ChatRoom from '@/features/chat/ChatRoom';
import { studyActions, useStudySession } from '@/hooks/useStudySession';
import { useMockStore } from '@/mocks/store';

export default function StudyChatScreen() {
  const insets = useSafeAreaInsets();
  const session = useStudySession();
  const task = useMockStore().tasks.find((t) => t.id === session.taskId);

  // 대화하는 동안 공부 시간 일시정지, 닫으면 원래 상태로 (명세 ST-03 ②)
  useEffect(() => {
    const wasStudying = session.status === 'study';
    if (wasStudying) studyActions.pause();
    return () => {
      if (wasStudying) studyActions.resume();
    };
    // 화면에 들어올 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.screen}>
      <Header backLabel="스터디룸" />
      <View style={styles.titleBox}>
        <Text style={styles.title}>이모양즈와 대화</Text>
        {task && <Text style={styles.sub}>{task.title}</Text>}
      </View>
      <ChatRoom bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleBox: {
    paddingHorizontal: 30,
    paddingBottom: 4,
  },
  title: {
    fontFamily: fonts.titleBold,
    fontSize: 26,
    letterSpacing: -1.3,
    color: colors.text,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text,
  },
});
