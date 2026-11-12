import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AnimatedSplash from '@/components/layout/AnimatedSplash';
import { colors, WEB_APP_MAX_WIDTH } from '@/constants/theme';
import { studyActions } from '@/hooks/useStudySession';
import { refreshTasks, reminderActions, useMockStore } from '@/mocks/store';

SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_MS = 1500;

export default function RootLayout() {
  const { loggedIn, loading } = useMockStore();
  const [fontsLoaded] = useFonts({
    'Dunggeunmiso-B': require('@/assets/fonts/Dunggeunmiso-B.otf'),
    'Dunggeunmiso-R': require('@/assets/fonts/Dunggeunmiso-R.otf'),
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
  });
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loggedIn || loading) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      studyActions.sync().catch(() => undefined);
      refreshTasks().catch(() => undefined);
      reminderActions.refresh().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [loading, loggedIn]);

  // 네이티브 스플래시와 같은 이미지를 그 위에 띄워두고, 폰트 로드 + 1.5초 뒤 홈으로
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const [splashDone, setSplashDone] = useState(false);
  const ready = fontsLoaded && minTimePassed;
  const onSplashHidden = useCallback(() => setSplashDone(true), []);

  return (
    <GestureHandlerRootView style={styles.page}>
      {/* 웹 브라우저 탭 제목 */}
      <Head>
        <title>HAEBOYANG</title>
        <meta name="description" content="마음쉼 TASK — 감정콩 친구들과 함께 공부를 시작하는 앱" />
      </Head>
      {/* 웹에서는 넓은 화면에서도 폰 크기로 가운데 보여준다 */}
      <View style={styles.app}>
        {fontsLoaded && <Stack screenOptions={{ headerShown: false }} />}
        {!splashDone && <AnimatedSplash hide={ready} onHidden={onSplashHidden} />}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? colors.page : colors.background,
  },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? WEB_APP_MAX_WIDTH : undefined,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
});
