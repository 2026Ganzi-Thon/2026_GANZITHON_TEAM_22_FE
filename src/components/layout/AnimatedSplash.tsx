import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  /** true가 되면 페이드아웃을 시작한다 */
  hide: boolean;
  /** 페이드아웃이 끝나면 호출 (부모가 오버레이를 제거) */
  onHidden: () => void;
};

const FADE_MS = 600;

// 앱 시작 화면. 네이티브 스플래시와 같은 이미지를 위에 깔아두고, 준비되면 서서히 사라진다.
// 같은 이미지라서 네이티브 → 오버레이로 넘어갈 때 티가 나지 않는다.
export default function AnimatedSplash({ hide, onHidden }: Props) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!hide) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.06, duration: FADE_MS, useNativeDriver: true }),
    ]).start(({ finished }) => finished && onHidden());
  }, [hide, opacity, scale, onHidden]);

  return (
    <Animated.View pointerEvents="none" style={[styles.splash, { opacity, transform: [{ scale }] }]}>
      <Image source={require('@/assets/images/logo/splash.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
});
