import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { formatElapsed, studyActions, useElapsed, useStudySession } from '@/hooks/useStudySession';

// 스터디룸 오른쪽 위 타이머. 공부 중: Ⅱ + 경과 시간 / 쉬는 중: ▶ 다시 시작
export default function TimerPill() {
  const { status } = useStudySession();
  const elapsed = useElapsed();
  const resting = status === 'rest';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resting ? '다시 시작하기' : '잠깐 쉬기'}
      onPress={() => (resting ? studyActions.resume() : studyActions.pause()).catch((error) => Alert.alert('상태를 바꾸지 못했어', error instanceof Error ? error.message : '다시 시도해줘.'))}
      style={styles.pill}>
      {resting ? (
        <Text style={styles.text}>▶ 다시 시작</Text>
      ) : (
        <>
          <Image source={require('@/assets/images/icons/etc/pause.svg')} style={styles.icon} contentFit="contain" />
          <Text style={styles.text}>{formatElapsed(elapsed)}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 39,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: colors.primarySoft,
  },
  icon: {
    width: 17,
    height: 16,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    letterSpacing: 0.68,
    color: colors.surface,
  },
});
