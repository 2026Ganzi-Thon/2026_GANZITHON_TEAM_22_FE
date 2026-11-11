// HM-02-detail 할 일 자세히 보기 (+ HM-03-done: 추가 직후, created=1)
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import ConfirmDialog from '@/components/common/ConfirmDialog';
import LoadingView from '@/components/common/LoadingView';
import SectionTitle from '@/components/common/SectionTitle';
import Header, { HeaderAction, HeaderEdit } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import { colors, fonts, fontSize } from '@/constants/theme';
import SubtaskRow from '@/features/tasks/SubtaskRow';
import TaskTitleBox from '@/features/tasks/TaskTitleBox';
import { loadTaskDetail, taskActions, useMockStore } from '@/mocks/store';
import { isDone } from '@/types/task';
import { formatDotDateTime } from '@/utils/date';
import { goBack } from '@/utils/navigation';

export default function TaskDetailScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const { tasks } = useMockStore();
  const task = tasks.find((t) => t.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadTaskDetail(id)
      .catch((error) => Alert.alert('할 일을 불러오지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Screen header={<Header backLabel="홈" />}><LoadingView /></Screen>;
  }

  if (!task) {
    return (
      <Screen header={<Header backLabel="홈" />}>
        <Text style={styles.empty}>할 일을 찾을 수 없어.</Text>
      </Screen>
    );
  }

  const complete = async () => {
    try {
      await taskActions.update(task.id, { status: 'DONE' });
      goBack();
    } catch (error) {
      Alert.alert('완료 처리하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    }
  };
  const remove = async () => {
    try {
      await taskActions.remove(task.id);
      setConfirmDelete(false);
      goBack();
    } catch (error) {
      Alert.alert('삭제하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    }
  };

  const right = (
    <>
      <HeaderEdit onPress={() => router.push({ pathname: '/task/[id]/edit', params: { id: task.id } })} />
      {created ? (
        <HeaderAction label="삭제" onPress={() => setConfirmDelete(true)} />
      ) : (
        <HeaderAction label="완료" onPress={complete} />
      )}
    </>
  );

  return (
    <Screen header={<Header backLabel="홈" right={right} />}>
      <SectionTitle title="할 일" size="lg" right={task.dueAt && formatDotDateTime(task.dueAt)} />
      <TaskTitleBox title={task.title} dueAt={isDone(task) ? undefined : task.dueAt} />

      {task.subtasks.length > 0 && (
        <>
          <SectionTitle title="세부 할 일" />
          <View style={styles.subList}>
            {task.subtasks.map((s) => (
              <SubtaskRow
                key={s.id}
                title={s.title}
                done={isDone(s)}
                onToggle={() => taskActions.toggleSub(task.id, s.id).catch((error) => Alert.alert('수정하지 못했어', error instanceof Error ? error.message : '다시 시도해줘.'))}
              />
            ))}
          </View>
        </>
      )}

      <ConfirmDialog
        visible={confirmDelete}
        message={'할 일을\n삭제해볼까?'}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subList: {
    gap: 16,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
