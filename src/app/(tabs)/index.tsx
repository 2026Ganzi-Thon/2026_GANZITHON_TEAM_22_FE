// HM-01 홈
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import HomeHero from '@/features/home/HomeHero';
import TodoSection from '@/features/home/TodoSection';
import { useStudySession } from '@/hooks/useStudySession';
import { taskActions, useMockStore } from '@/mocks/store';
import { showAlert } from '@/utils/alert';

/** 할 일 카드 시작 위치 (피그마: 캐릭터 발 아래) */
const CARD_TOP = 391;
/** 화면이 낮아도 제목 + 할 일 1개 + 함께 시작하기 버튼은 보이도록 */
const CARD_MIN_HEIGHT = 240;

export default function HomeScreen() {
  const { tasks, reminder } = useMockStore();
  const { sessionId } = useStudySession();

  return (
    // 큰 화면에서는 꽉 채워 스크롤 없음, 낮은 화면(가로 모드·작은 폰)에서는 홈 전체가 스크롤된다
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    minHeight: CARD_MIN_HEIGHT,
    marginTop: CARD_TOP,
    marginHorizontal: 15,
    marginBottom: 10,
  },
});
