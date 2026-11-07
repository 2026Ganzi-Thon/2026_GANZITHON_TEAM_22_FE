import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

type Props = {
  study: number;
  rest: number;
  resting: boolean;
};

// 공부 영상과 쉬는 영상을 둘 다 미리 틀어두고 보이는 것만 바꾼다.
// src를 바꿔 끼우면 새 영상을 불러오는 동안 화면이 깜빡이기 때문 (옵시디언 "스터디룸 mp4 파일" 노트)
export default function CharacterVideo({ study, rest, resting }: Props) {
  const studyPlayer = useVideoPlayer(study, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const restPlayer = useVideoPlayer(rest, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={studyPlayer} style={[StyleSheet.absoluteFill, resting && styles.hidden]} contentFit="cover" nativeControls={false} />
      <VideoView player={restPlayer} style={[StyleSheet.absoluteFill, !resting && styles.hidden]} contentFit="cover" nativeControls={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
});
