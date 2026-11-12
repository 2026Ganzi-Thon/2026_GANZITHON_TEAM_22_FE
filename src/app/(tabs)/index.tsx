// HM-01 홈
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import HomeHero from '@/features/home/HomeHero';
import TodoSection from '@/features/home/TodoSection';
import { useStudySession } from '@/hooks/useStudySession';
import { taskActions, useMockStore } from '@/mocks/store';
import { showAlert } from '@/utils/alert';

export default function HomeScreen() {
  const { tasks, reminder } = useMockStore();
  const { sessionId } = useStudySession();

  return (
    <View style={styles.screen}>
      <HomeHero reminder={reminder} onPressChangeReminder={() => router.push('/alarm')} />
      <View style={styles.content}>
        <TodoSection
          tasks={tasks}
          onToggleTask={(id) => taskActions.toggle(id).catch((error) => showAlert('수정하지 못했어', error instanceof Error ? error.message : '다시 시도해줘.'))}
          onPressTask={(id) => router.push({ pathname: '/task/[id]', params: { id } })}
          onPressAdd={() => router.push('/task/new')}
          onPressStart={() => router.push(sessionId ? '/study' : '/study/start')}
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
