import { Tabs } from 'expo-router';

import AppSession from '@/components/layout/AppSession';
import BottomTabBar from '@/components/layout/BottomTabBar';

// 하단 탭 4개: 홈 / 할 일 / 감정콩 / 내 정보 (순서는 src/constants/tabs.ts)
export default function TabLayout() {
  return (
    <AppSession>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="tasks" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="my" />
      </Tabs>
    </AppSession>
  );
}
