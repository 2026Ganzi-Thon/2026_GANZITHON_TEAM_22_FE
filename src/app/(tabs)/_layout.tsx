import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';

import BottomTabBar from '@/components/layout/BottomTabBar';
import ErrorView from '@/components/common/ErrorView';
import LoadingView from '@/components/common/LoadingView';
import { initializeAppStore, useMockStore } from '@/mocks/store';

// 하단 탭 4개: 홈 / 할 일 / 감정콩 / 내 정보 (순서는 src/constants/tabs.ts)
export default function TabLayout() {
  const { loggedIn, loading, error } = useMockStore();
  useEffect(() => {
    initializeAppStore().catch(() => undefined);
  }, []);

  if (loading) return <LoadingView message="서버에 연결하는 중이야..." />;
  if (error) return <ErrorView message={error} onRetry={() => initializeAppStore().catch(() => undefined)} />;
  if (!loggedIn) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="my" />
    </Tabs>
  );
}
