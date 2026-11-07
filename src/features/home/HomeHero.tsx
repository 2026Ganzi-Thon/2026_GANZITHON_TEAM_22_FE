import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';
import SpeechBubble from '@/features/home/SpeechBubble';
import type { Reminder } from '@/types/task';
import { formatReminder } from '@/utils/date';

type Props = {
  reminder: Reminder | null;
  onPressChangeReminder: () => void;
};

export const HERO_HEIGHT = 475;

// TODO(API): 알림 없을 때 반겨주는 문구는 AI 생성 예정. 지금은 고정 문구
const GREETING = '안 그래도 너 얘기하고\n있었는데 ㅋㅋㅋ';

// 캐릭터를 눌렀을 때 짧은 반응 (최소 구현: 말풍선 문구만 바뀜. 표정·움직임은 애니메이션 단계에서)
// TODO(API): 캐릭터 반응 문구를 AI로 받을지 정하기
const REACTIONS = ['뭐야 왜 찔러!', '히잉… 오늘 할 거 많아?', '같이 하면 금방이야!'];

// 홈 상단: 캐릭터 배경 + 로고 + 말풍선 (+ 알림 있으면 예약 변경 배지)
export default function HomeHero({ reminder, onPressChangeReminder }: Props) {
  const [reaction, setReaction] = useState<number | null>(null);
  const base = reminder ? `${formatReminder(reminder.remindAt)}에\n다시 만나기로 했어` : GREETING;
  const message = reaction === null ? base : REACTIONS[reaction];

  return (
    <View style={styles.hero}>
      <Image
        source={require('@/assets/images/backgrounds/home-hero.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      {/* 캐릭터 영역 터치 → 반응. 대화방으로 자동 이동하지 않는다 (명세) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="감정콩 쓰다듬기"
        onPress={() => setReaction((r) => ((r ?? -1) + 1) % REACTIONS.length)}
        style={styles.characters}
      />
      {/* 배경 아래쪽을 화면 배경색으로 자연스럽게 */}
      <LinearGradient
        colors={[colors.backgroundClear, colors.background]}
        locations={[0, 0.53]}
        style={styles.fade}
      />
      <Image
        source={require('@/assets/images/logo/haebo-wordmark.svg')}
        style={styles.logo}
        contentFit="contain"
      />
      {reminder && (
        <Pressable accessibilityRole="button" onPress={onPressChangeReminder} style={styles.changeBadge}>
          <Text style={styles.changeLabel}>예약 변경</Text>
        </Pressable>
      )}
      <View style={styles.bubble}>
        <SpeechBubble text={message} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
  },
  characters: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 220,
    height: 170,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 425,
    height: 77,
  },
  logo: {
    position: 'absolute',
    top: 70,
    left: 16,
    width: 148,
    height: 54,
  },
  changeBadge: {
    position: 'absolute',
    top: 122,
    right: 50,
    height: 27,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  changeLabel: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.xs,
    color: colors.surface,
  },
  bubble: {
    position: 'absolute',
    top: 158,
    right: 43,
  },
});
