import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import DashedAddButton from '@/components/common/DashedAddButton';
import DateTimeSheet from '@/components/common/DateTimeSheet';
import FieldButton from '@/components/common/FieldButton';
import SectionTitle from '@/components/common/SectionTitle';
import TextField from '@/components/common/TextField';
import SubtaskRow from '@/features/tasks/SubtaskRow';
import { newId } from '@/mocks/store';
import { isDone, toggleStatus, type Subtask } from '@/types/task';
import { formatKoreanDate } from '@/utils/date';

export type TaskFormValue = {
  title: string;
  dueAt?: string;
  subtasks: Subtask[];
};

type Props = {
  value: TaskFormValue;
  onChange: (value: TaskFormValue) => void;
  /** add: 처음 등록(HM-02-add) / edit: 수정(HM-03-edit) */
  mode: 'add' | 'edit';
};

// 할 일 추가·수정 공용 폼. 이름만 필수, 마감·세부 할 일은 선택
export default function TaskForm({ value, onChange, mode }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const set = (patch: Partial<TaskFormValue>) => onChange({ ...value, ...patch });
  const setSub = (id: string, patch: Partial<Subtask>) =>
    set({ subtasks: value.subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  return (
    <>
      <SectionTitle title={mode === 'add' ? '새로운 할 일' : '할 일'} size="lg" />
      <TextField
        value={value.title}
        onChangeText={(title) => set({ title })}
        placeholder="할 일을 입력해줘."
        style={mode === 'edit' && styles.bigInput}
      />

      <SectionTitle title="마감 날짜" hint={mode === 'add' ? '(선택)' : undefined} />
      <FieldButton
        value={value.dueAt && formatKoreanDate(value.dueAt)}
        placeholder="마감 날짜가 언제야?"
        onPress={() => setSheetOpen(true)}
      />

      <SectionTitle title="세부 할 일" hint={mode === 'add' ? '(선택)' : undefined} />
      <View style={styles.subList}>
        {value.subtasks.map((s) => (
          <SubtaskRow
            key={s.id}
            title={s.title}
            done={isDone(s)}
            onToggle={() => setSub(s.id, { status: toggleStatus(s.status) })}
            editable
            placeholder="일을 작게 쪼개보자!"
            onChangeTitle={(title) => setSub(s.id, { title })}
            onRemove={() => set({ subtasks: value.subtasks.filter((x) => x.id !== s.id) })}
          />
        ))}
      </View>
      <DashedAddButton
        label="세부 할 일 추가"
        onPress={() => set({ subtasks: [...value.subtasks, { id: newId(), title: '', status: 'TODO' }] })}
      />

      <DateTimeSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="마감 날짜"
        confirmLabel="마감 날짜 선택"
        initial={value.dueAt}
        includeTime={false}
        onConfirm={(dueAt) => {
          set({ dueAt });
          setSheetOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bigInput: {
    height: 66,
    fontSize: 24,
  },
  subList: {
    gap: 16,
  },
});
