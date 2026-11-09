// HM-02-add 할 일 추가
import { router } from 'expo-router';
import { useState } from 'react';

import Header, { HeaderAction } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import TaskForm, { type TaskFormValue } from '@/features/tasks/TaskForm';
import { taskActions } from '@/mocks/store';

export default function TaskNewScreen() {
  const [value, setValue] = useState<TaskFormValue>({ title: '', subtasks: [] });

  // TODO(API): 할 일 생성 요청. 성공하면 추가 완료 화면(HM-03-done)으로
  const submit = () => {
    if (!value.title.trim()) return;
    const task = taskActions.create({
      title: value.title.trim(),
      dueAt: value.dueAt,
      subtasks: value.subtasks.map((s) => s.title.trim()),
    });
    router.replace({ pathname: '/task/[id]', params: { id: task.id, created: '1' } });
  };

  return (
    <Screen header={<Header backLabel="홈" right={<HeaderAction label="완료" onPress={submit} />} />}>
      <TaskForm mode="add" value={value} onChange={setValue} />
    </Screen>
  );
}
