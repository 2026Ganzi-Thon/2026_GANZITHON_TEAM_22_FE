// ST-02 스터디룸 (+ ST-03-exit 나가기 선택, ST-04 다음 시작 알림)
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
  const [leaving, setLeaving] = useState(false);
  const resting = session.status === 'rest';

  // 나가면 타이머 종료. 할 일은 자동 완료되지 않는다 (명세)
  const leave = async (remindAt: string | null) => {
    if (leaving) return;
    if (remindAt) {
      const when = new Date(remindAt).getTime();
      const latest = Date.now() + 7 * 24 * 60 * 60 * 1000;
      if (!Number.isFinite(when) || when <= Date.now() || when > latest) {
        Alert.alert('알림 시각을 확인해줘', '다음 7일 안의 미래 시각으로 설정할 수 있어.');
        return;
      }
    }
    setLeaving(true);
    let sessionEnded = false;
    try {
      const ended = await studyActions.end();
      sessionEnded = true;
      if (remindAt && ended) {
        const result = await reminderActions.setFromSession(
          ended.id,
          remindAt,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul',
        );
        if (result.reminder && !result.scheduled) {
          Alert.alert('알림을 저장했어', '기기 알림 권한을 허용하면 잠금 화면에서 받을 수 있어.');
        }
      }
      setSheet('none');
      router.dismissTo('/');
    } catch (error) {
      if (sessionEnded) {
        setSheet('none');
        router.dismissTo('/');
        Alert.alert('공부는 종료했어', '다음 시작 알림을 저장하지 못했어. 홈에서 다시 설정해줘.');
      } else {
        Alert.alert('저장하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
      }
    } finally {
      setLeaving(false);
    }
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
