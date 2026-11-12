import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import Button from '@/components/common/Button';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import TaskCard from '@/features/tasks/TaskCard';
import type { Task } from '@/types/task';

type Props = {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onPressTask: (id: string) => void;
  onPressAdd: () => void;
  onPressStart: () => void;
};

// 홈 "나의 할 일" 카드: 제목 + 추가 버튼 + 할 일 미리보기 + 함께 시작하기
export default function TodoSection({ tasks, onToggleTask, onPressTask, onPressAdd, onPressStart }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>나의 할 일</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="할 일 추가" onPress={onPressAdd} style={styles.addButton}>
          <Image source={require('@/assets/images/icons/etc/plus.svg')} style={styles.addIcon} />
        </Pressable>
      </View>

      {/* 할 일이 많으면 카드 안에서 스크롤 */}
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.list, tasks.length === 0 && styles.listEmpty]} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>할 일이 없어도 같이 시작할 수 있어!</Text>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onPress={() => onPressTask(task.id)}
            />
          ))
        )}
      </ScrollView>

      <Button label="함께 시작하기" onPress={onPressStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    paddingTop: 13,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRadius: radius.container,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 6,
  },
  title: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.xl,
    letterSpacing: -1.4,
    color: colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    width: 17,
    height: 17,
  },
  scroll: {
    flex: 1,
    marginTop: 9,
    marginBottom: 10,
  },
  list: {
    gap: 12,
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
