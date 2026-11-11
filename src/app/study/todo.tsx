// ST-03-todo 지금 하는 일
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import SectionTitle from '@/components/common/SectionTitle';
import Header from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import { colors, fonts, fontSize } from '@/constants/theme';
import SubtaskRow from '@/features/tasks/SubtaskRow';
import TaskTitleBox from '@/features/tasks/TaskTitleBox';
import { useStudySession } from '@/hooks/useStudySession';
import { loadTaskDetail, taskActions, useMockStore } from '@/mocks/store';
import { isDone } from '@/types/task';
import { formatMonthDay } from '@/utils/date';

// 이 화면을 열어도 공부 시간은 그대로 흐른다 (명세 ST-03 ①)
export default function StudyTodoScreen() {
  const session = useStudySession();
  const { tasks } = useMockStore();
  const task = tasks.find((t) => t.id === session.taskId);

  useEffect(() => {
    if (session.taskId) {
      loadTaskDetail(session.taskId).catch((error) => Alert.alert('할 일을 불러오지 못했어', error instanceof Error ? error.message : '다시 시도해줘.'));
    }
  }, [session.taskId]);

  return (
    <Screen header={<Header backLabel="스터디룸" />}>
      {task ? (
        <>
          <SectionTitle title="지금 하는 일" size="lg" right={task.dueAt && formatMonthDay(task.dueAt)} />
          <TaskTitleBox title={task.title} />
          {task.subtasks.length > 0 && <SectionTitle title="세부 할 일" />}
          <View style={styles.list}>
            {task.subtasks.map((s) => (
              <SubtaskRow key={s.id} title={s.title} done={isDone(s)} onToggle={() => taskActions.toggleSub(task.id, s.id).catch((error) => Alert.alert('수정하지 못했어', error instanceof Error ? error.message : '다시 시도해줘.'))} />
            ))}
          </View>
        </>
      ) : (
        <>
          <SectionTitle title="지금 하는 일" size="lg" />
          <Text style={styles.empty}>선택한 할 일이 없어. 할 일 없이 공부를 시작한 상태야.</Text>
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
});
