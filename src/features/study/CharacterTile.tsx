import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { CHARACTERS, type CharacterId } from '@/constants/characters';
import { colors, fonts, radius } from '@/constants/theme';
import CharacterVideo from '@/features/study/CharacterVideo';

type Props = {
  id: CharacterId;
  resting: boolean;
  /** 쉬는 중일 때 말풍선 */
  bubble?: string;
};

// 스터디룸 2×2 칸 하나: 캐릭터 공부/휴식 영상(없으면 이미지) + 이름표
export default function CharacterTile({ id, resting, bubble }: Props) {
  const c = CHARACTERS[id];
  return (
    <View style={styles.tile}>
      {c.video.study ? (
        <CharacterVideo study={c.video.study} restImage={c.rest} resting={resting} />
      ) : (
        <Image source={resting ? c.rest : c.study} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      {resting && bubble && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{bubble}</Text>
        </View>
      )}
      <View style={styles.nameTag}>
        <View style={[styles.dot, { backgroundColor: c.color }]} />
        <Text style={styles.name}>{c.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radius.container,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  nameTag: {
    position: 'absolute',
    left: 7,
    bottom: 8,
    height: 33,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: radius.container,
    backgroundColor: colors.overlay,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    fontFamily: fonts.titleBold,
    fontSize: 14,
    letterSpacing: 0.56,
    color: colors.surface,
  },
  bubble: {
    position: 'absolute',
    top: 12,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  bubbleText: {
    fontFamily: fonts.title,
    fontSize: 12,
    color: colors.text,
  },
});
