// HM-03-edit 할 일 수정하기
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import Header, { HeaderAction } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import TaskForm, { type TaskFormValue } from '@/features/tasks/TaskForm';
import { taskActions, useMockStore } from '@/mocks/store';
import { goBack } from '@/utils/navigation';

export default function TaskEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useMockStore().tasks.find((t) => t.id === id);
  const [value, setValue] = useState<TaskFormValue>({
    title: task?.title ?? '',
    dueAt: task?.dueAt,
    subTasks: task?.subTasks ?? [],
  });

  // TODO(API): 할 일 수정 요청
  const save = () => {
    if (!task || !value.title.trim()) return;
    taskActions.update(task.id, {
      title: value.title.trim(),
      dueAt: value.dueAt,
      subTasks: value.subTasks.filter((s) => s.title.trim()),
    });
    goBack();
  };

  return (
    <Screen header={<Header backLabel="홈" right={<HeaderAction label="완료" onPress={save} />} />}>
      <TaskForm mode="edit" value={value} onChange={setValue} />
    </Screen>
  );
}
