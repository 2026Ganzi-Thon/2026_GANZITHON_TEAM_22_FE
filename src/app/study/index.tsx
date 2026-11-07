// ST-02 스터디룸 (+ ST-03-exit 나가기 선택, ST-04 다음 시작 알림)
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DateTimeSheet from '@/components/common/DateTimeSheet';
import { colors, fonts, fontSize } from '@/constants/theme';
import CharacterTile from '@/features/study/CharacterTile';
import ExitSheet from '@/features/study/ExitSheet';
import MyTile from '@/features/study/MyTile';
import NextAlarmSheet from '@/features/study/NextAlarmSheet';
import StudyBottomBar from '@/features/study/StudyBottomBar';
import TimerPill from '@/features/study/TimerPill';
import { studyActions, useStudySession } from '@/hooks/useStudySession';
import { reminderActions, useMockStore } from '@/mocks/store';

type Sheet = 'none' | 'exit' | 'alarm' | 'custom';

export default function StudyRoomScreen() {
  const insets = useSafeAreaInsets();
  const session = useStudySession();
  const task = useMockStore().tasks.find((t) => t.id === session.taskId);
  const [sheet, setSheet] = useState<Sheet>('none');
  const resting = session.status === 'rest';

  // 나가면 타이머 종료. 할 일은 자동 완료되지 않는다 (명세)
  const leave = (remindAt: string | null) => {
    // TODO(API): 다음 시작 알림 저장 + 로컬 예약 알림 등록
    if (remindAt) reminderActions.set(remindAt);
    studyActions.end();
    setSheet('none');
    router.dismissTo('/');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <Text style={styles.title} numberOfLines={1}>
            {task?.title ?? '함께 공부'}
          </Text>
          <Text style={styles.subtitle}>{resting ? '잠깐 쉬는 중...' : '같이 공부하는 중...'}</Text>
        </View>
        <TimerPill />
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <CharacterTile id="angry" resting={resting} bubble="좀 쉬자..." />
          <CharacterTile id="sad" resting={resting} bubble="제발ㅠㅠ" />
        </View>
        <View style={styles.row}>
          <CharacterTile id="joy" resting={resting} bubble="그럴까??" />
          <MyTile />
        </View>
      </View>

      <StudyBottomBar
        onPress={(key) => {
          if (key === 'todo') router.push('/study/todo');
          if (key === 'chat') router.push('/study/chat');
          if (key === 'exit') setSheet('exit');
        }}
      />

      <ExitSheet
        visible={sheet === 'exit'}
        onClose={() => setSheet((s) => (s === 'exit' ? 'none' : s))}
        onLater={() => setSheet('alarm')}
        onDoneToday={() => leave(null)}
      />
      <NextAlarmSheet
        visible={sheet === 'alarm'}
        onClose={() => setSheet((s) => (s === 'alarm' ? 'none' : s))}
        onCustom={() => setSheet('custom')}
        onExit={leave}
      />
      <DateTimeSheet
        visible={sheet === 'custom'}
        onClose={() => setSheet((s) => (s === 'custom' ? 'none' : s))}
        subtitle="직접 설정하기"
        title="언제 다시 만날까?"
        confirmLabel="이 시간에 만나"
        onConfirm={leave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerTexts: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.xl,
    letterSpacing: -1.4,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.title,
    fontSize: 15,
    color: colors.text,
  },
  grid: {
    flex: 1,
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
  },
});
