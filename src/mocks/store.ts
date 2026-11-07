import { useSyncExternalStore } from 'react';

import { MOCK_REMINDER, MOCK_TASKS } from '@/mocks/tasks';
import type { Reminder, SubTask, Task } from '@/types/task';

// 화면끼리 같은 데이터를 보도록 메모리에만 두는 임시 저장소.
// TODO(API): 이 파일 전체를 API 호출(조회·생성·수정·삭제)로 교체. 앱을 끄면 초기화된다.

type State = { tasks: Task[]; reminder: Reminder | null; loggedIn: boolean };

let state: State = { tasks: MOCK_TASKS, reminder: MOCK_REMINDER, loggedIn: false };
const listeners = new Set<() => void>();

const setState = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useMockStore() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

let nextId = 100;
export const newId = () => String(nextId++);

export const taskActions = {
  create(input: { title: string; dueAt?: string; subTasks: string[] }) {
    const task: Task = {
      id: newId(),
      title: input.title,
      dueAt: input.dueAt,
      done: false,
      subTasks: input.subTasks.filter(Boolean).map((title) => ({ id: newId(), title, done: false })),
    };
    setState({ tasks: [...state.tasks, task] });
    return task;
  },
  update(id: string, patch: Partial<Omit<Task, 'id'>>) {
    setState({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  },
  remove(id: string) {
    setState({ tasks: state.tasks.filter((t) => t.id !== id) });
  },
  toggle(id: string) {
    setState({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  },
  toggleSub(id: string, subId: string) {
    setState({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, subTasks: t.subTasks.map((s: SubTask) => (s.id === subId ? { ...s, done: !s.done } : s)) }
          : t,
      ),
    });
  },
};

export const reminderActions = {
  set(remindAt: string) {
    setState({ reminder: { id: state.reminder?.id ?? newId(), remindAt } });
  },
  cancel() {
    setState({ reminder: null });
  },
};

// TODO(API): 실제 로그인·토큰 확인으로 교체
export const authActions = {
  login() {
    setState({ loggedIn: true });
  },
  logout() {
    setState({ loggedIn: false });
  },
};
