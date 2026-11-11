// HM-03-edit 할 일 수정하기
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import LoadingView from '@/components/common/LoadingView';
import Header, { HeaderAction } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import TaskForm, { type TaskFormValue } from '@/features/tasks/TaskForm';
import { loadTaskDetail, taskActions, useMockStore } from '@/mocks/store';
import { goBack } from '@/utils/navigation';

export default function TaskEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useMockStore().tasks.find((t) => t.id === id);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<TaskFormValue>({
    title: task?.title ?? '',
    dueAt: task?.dueAt,
    subtasks: task?.subtasks ?? [],
  });

  useEffect(() => {
    if (!id) return;
    loadTaskDetail(id)
      .then((loaded) => setValue({ title: loaded.title, dueAt: loaded.dueAt, subtasks: loaded.subtasks }))
      .catch((error) => Alert.alert('할 일을 불러오지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.'))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    if (!task || !value.title.trim()) return;
    try {
      await taskActions.update(task.id, {
        title: value.title.trim(),
        dueAt: value.dueAt,
        subtasks: value.subtasks.filter((s) => s.title.trim()),
      });
      goBack();
    } catch (error) {
      Alert.alert('수정하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    }
  };

  if (loading) return <Screen header={<Header backLabel="홈" />}><LoadingView /></Screen>;

  return (
    <Screen header={<Header backLabel="홈" right={<HeaderAction label="완료" onPress={save} />} />}>
      <TaskForm mode="edit" value={value} onChange={setValue} />
    </Screen>
  );
}
