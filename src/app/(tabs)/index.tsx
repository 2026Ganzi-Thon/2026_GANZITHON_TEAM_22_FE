// HM-01 홈
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import HomeHero from '@/features/home/HomeHero';
import TodoSection from '@/features/home/TodoSection';
import { taskActions, useMockStore } from '@/mocks/store';

export default function HomeScreen() {
  // TODO(API): 할 일 목록·다음 시작 알림 조회로 교체
  const { tasks, reminder } = useMockStore();

  return (
    <View style={styles.screen}>
      <HomeHero reminder={reminder} onPressChangeReminder={() => router.push('/alarm')} />
      <View style={styles.content}>
        <TodoSection
          tasks={tasks}
          onToggleTask={taskActions.toggle}
          onPressTask={(id) => router.push({ pathname: '/task/[id]', params: { id } })}
          onPressAdd={() => router.push('/task/new')}
          onPressStart={() => router.push('/study/start')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    marginTop: 391,
    marginHorizontal: 15,
    marginBottom: 10,
  },
});
