// ST-02 스터디룸 (+ ST-03-exit 나가기 선택, ST-04 다음 시작 알림)
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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
import { showAlert } from '@/utils/alert';

type Sheet = 'none' | 'exit' | 'alarm' | 'custom';

export default function StudyRoomScreen() {
  const insets = useSafeAreaInsets();
  const session = useStudySession();
  const task = useMockStore().tasks.find((t) => t.id === session.taskId);
  const [sheet, setSheet] = useState<Sheet>('none');
  const leaving = useRef(false);
  const endedSessionId = useRef<string | undefined>(undefined);
  const resting = session.status === 'rest';

  // 나가면 타이머 종료. 할 일은 자동 완료되지 않는다 (명세)
  const leave = async (remindAt: string | null) => {
    if (leaving.current) return;
    if (remindAt) {
      const when = new Date(remindAt).getTime();
      const latest = Date.now() + 7 * 24 * 60 * 60 * 1000;
      if (!Number.isFinite(when) || when <= Date.now() || when > latest) {
        showAlert('알림 시각을 확인해줘', '다음 7일 안의 미래 시각으로 설정할 수 있어.');
        return;
      }
    }
    leaving.current = true;
    try {
      if (!endedSessionId.current) endedSessionId.current = (await studyActions.end())?.id;
      if (remindAt) {
        if (!endedSessionId.current) {
          showAlert('알림을 저장할 수 없어', '공부 세션을 먼저 시작해줘.');
          return;
        }
        const result = await reminderActions.setFromSession(
          endedSessionId.current,
          remindAt,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul',
        );
        if (result.reminder && !result.scheduled && Platform.OS !== 'web') {
          showAlert('알림을 저장했어', '기기 알림 권한을 허용하면 잠금 화면에서 받을 수 있어.');
        }
      }
      setSheet('none');
      router.dismissTo('/');
    } catch (error) {
      if (endedSessionId.current) {
        showAlert('공부는 종료했어', '다음 시작 알림을 저장하지 못했어. 이 화면에서 다시 시도하거나 알림 없이 나갈 수 있어.');
      } else {
        showAlert('저장하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
      }
    } finally {
      leaving.current = false;
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
