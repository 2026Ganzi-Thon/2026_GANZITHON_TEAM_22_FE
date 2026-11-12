// HM-02-add 할 일 추가
import { router } from 'expo-router';
import { useRef, useState } from 'react';

import Header, { HeaderAction } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import TaskForm, { type TaskFormValue } from '@/features/tasks/TaskForm';
import { taskActions } from '@/mocks/store';
import { showAlert } from '@/utils/alert';

export default function TaskNewScreen() {
  const [value, setValue] = useState<TaskFormValue>({ title: '', subtasks: [] });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const submit = async () => {
    if (savingRef.current || !value.title.trim()) return;
    savingRef.current = true;
    setSaving(true);
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
        router.replace({ pathname: '/task/[id]', params: { id: taskId, created: '1' } });
        showAlert('할 일은 저장했어', '일부 세부 할 일은 저장되지 않았어. 상세 화면에서 다시 확인해줘.');
        return;
      }
      showAlert('할 일을 저장하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Screen header={<Header backLabel="홈" right={<HeaderAction label="완료" onPress={submit} disabled={saving} />} />}>
      <TaskForm mode="add" value={value} onChange={setValue} />
    </Screen>
  );
}
