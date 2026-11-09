// ST-03-todo 지금 하는 일
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SectionTitle from '@/components/common/SectionTitle';
import Header from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import SubtaskRow from '@/features/tasks/SubtaskRow';
import TaskTitleBox from '@/features/tasks/TaskTitleBox';
import { studyActions, useStudySession } from '@/hooks/useStudySession';
import { taskActions, useMockStore } from '@/mocks/store';
import { isDone } from '@/types/task';
import { formatMonthDayTime } from '@/utils/date';

// 이 화면을 열어도 공부 시간은 그대로 흐른다 (명세 ST-03 ①)
export default function StudyTodoScreen() {
  const session = useStudySession();
  const { tasks } = useMockStore();
  const task = tasks.find((t) => t.id === session.taskId);

  return (
    <Screen header={<Header backLabel="스터디룸" />}>
      {task ? (
        <>
          <SectionTitle title="지금 하는 일" size="lg" right={task.dueAt && formatMonthDayTime(task.dueAt)} />
          <TaskTitleBox title={task.title} />
          {task.subtasks.length > 0 && <SectionTitle title="세부 할 일" />}
          <View style={styles.list}>
            {task.subtasks.map((s) => (
              <SubtaskRow key={s.id} title={s.title} done={isDone(s)} onToggle={() => taskActions.toggleSub(task.id, s.id)} />
            ))}
          </View>
        </>
      ) : (
        <>
          <SectionTitle title="지금 하는 일" size="lg" />
          <Text style={styles.empty}>선택한 할 일이 없어. 지금 공부에 연결해볼래?</Text>
          <View style={styles.list}>
            {/* TODO(API): 미완료 할 일 목록 */}
            {tasks
              .filter((t) => !isDone(t))
              .map((t) => (
                <Pressable key={t.id} accessibilityRole="button" onPress={() => studyActions.linkTask(t.id)} style={styles.pick}>
                  <Text style={styles.pickText}>{t.title}</Text>
                </Pressable>
              ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textSub,
  },
  pick: {
    height: 51,
    justifyContent: 'center',
    paddingHorizontal: 17,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
  },
  pickText: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.text,
  },
});
