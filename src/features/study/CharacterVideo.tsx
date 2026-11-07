import { Image, type ImageSource } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  study: number;
  /** 쉬는 중 이미지 (쉬는 영상이 생기면 영상으로 교체) */
  restImage: ImageSource;
  resting: boolean;
};

// 공부 영상은 계속 붙여두고, 쉬는 중에는 멈춘 뒤 쉬는 이미지를 위에 덮는다.
// 영상을 빼고 다시 넣으면 불러오는 동안 화면이 깜빡이기 때문 (옵시디언 "스터디룸 mp4 파일" 노트)
export default function CharacterVideo({ study, restImage, resting }: Props) {
  const player = useVideoPlayer(study, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (resting) player.pause();
    else player.play();
  }, [resting, player]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} />
      {resting && <Image source={restImage} style={StyleSheet.absoluteFill} contentFit="cover" />}
    </View>
  );
}

const styles = StyleSheet.create({
  // 웹에서 absoluteFill만 주면 영상이 원래 크기로 그려져 잘리므로 너비·높이를 명시한다
  video: {
    width: '100%',
    height: '100%',
  },
});
