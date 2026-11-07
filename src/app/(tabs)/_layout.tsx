import { Redirect, Tabs } from 'expo-router';

import BottomTabBar from '@/components/layout/BottomTabBar';
import { useMockStore } from '@/mocks/store';

// 하단 탭 4개: 홈 / 할 일 / 감정콩 / 내 정보 (순서는 src/constants/tabs.ts)
export default function TabLayout() {
  // TODO(API): 저장된 토큰으로 로그인 여부 확인
  const { loggedIn } = useMockStore();
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
