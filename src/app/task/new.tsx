// HM-02-add 할 일 추가
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import Header, { HeaderAction } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import TaskForm, { type TaskFormValue } from '@/features/tasks/TaskForm';
import { taskActions } from '@/mocks/store';

export default function TaskNewScreen() {
  const [value, setValue] = useState<TaskFormValue>({ title: '', subtasks: [] });

  const submit = async () => {
    if (!value.title.trim()) return;
    try {
      const task = await taskActions.create({
        title: value.title.trim(),
        dueAt: value.dueAt,
        subtasks: value.subtasks.map((s) => s.title.trim()),
      });
      router.replace({ pathname: '/task/[id]', params: { id: task.id, created: '1' } });
    } catch (error) {
      const taskId = typeof error === 'object' && error && 'taskId' in error ? String(error.taskId) : undefined;
      if (taskId) {
        Alert.alert('할 일은 저장했어', '일부 세부 할 일은 저장되지 않았어. 상세 화면에서 다시 확인해줘.', [
          { text: '확인', onPress: () => router.replace({ pathname: '/task/[id]', params: { id: taskId, created: '1' } }) },
        ]);
        return;
      }
      Alert.alert('할 일을 저장하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    }
  };

  return (
    <Screen header={<Header backLabel="홈" right={<HeaderAction label="완료" onPress={submit} />} />}>
      <TaskForm mode="add" value={value} onChange={setValue} />
    </Screen>
  );
}
