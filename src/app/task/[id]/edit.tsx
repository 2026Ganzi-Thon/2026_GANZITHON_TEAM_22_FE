// HM-03-edit 할 일 수정하기
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import ErrorView from '@/components/common/ErrorView';
import LoadingView from '@/components/common/LoadingView';
import Header, { HeaderAction } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import TaskForm, { type TaskFormValue } from '@/features/tasks/TaskForm';
import { loadTaskDetail, taskActions } from '@/mocks/store';
import { showAlert } from '@/utils/alert';
import { goBack } from '@/utils/navigation';

export default function TaskEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return <Screen header={<Header backLabel="홈" />}><ErrorView message="할 일을 찾을 수 없어." /></Screen>;
  return <TaskEditor key={id} id={id} />;
}

function TaskEditor({ id }: { id: string }) {
  const [value, setValue] = useState<TaskFormValue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    let active = true;
    loadTaskDetail(id)
      .then((loaded) => {
        if (active) setValue({ title: loaded.title, dueAt: loaded.dueAt, subtasks: loaded.subtasks });
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : '할 일을 불러오지 못했어.');
      });
    return () => { active = false; };
  }, [id, attempt]);

  const reload = () => {
    setValue(null);
    setLoadError(null);
    setAttempt((current) => current + 1);
  };

  const save = async () => {
    if (savingRef.current || !value?.title.trim()) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await taskActions.update(id, {
        title: value.title.trim(),
        dueAt: value.dueAt,
        subtasks: value.subtasks.filter((s) => s.title.trim()),
      });
      goBack();
    } catch (error) {
      showAlert('수정하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!value) {
    return (
      <Screen header={<Header backLabel="홈" />}>
        {loadError ? <ErrorView message={loadError} onRetry={reload} /> : <LoadingView />}
      </Screen>
    );
  }

  return (
    <Screen header={<Header backLabel="홈" right={<HeaderAction label="완료" onPress={save} disabled={saving} />} />}>
      <TaskForm mode="edit" value={value} onChange={setValue} />
    </Screen>
  );
}
