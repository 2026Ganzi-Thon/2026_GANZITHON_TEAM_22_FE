import { useSyncExternalStore } from 'react';

import { MOCK_REMINDER, MOCK_TASKS } from '@/mocks/tasks';
import { toggleStatus, type Reminder, type Subtask, type Task } from '@/types/task';

// 화면끼리 같은 데이터를 보도록 메모리에만 두는 임시 저장소.
// TODO(API): 이 파일 전체를 API 호출(조회·생성·수정·삭제)로 교체. 앱을 끄면 초기화된다.

type State = { tasks: Task[]; reminder: Reminder | null; loggedIn: boolean };

// 웹은 새로고침하면 메모리가 비워져 로그아웃되므로, 로그인 여부만 브라우저에 기억해 둔다.
// TODO(API): 실제로는 토큰을 안전한 저장소(앱 expo-secure-store / 웹 저장소)에 두고 GET /me로 확인
const LOGIN_KEY = 'haeboyang.loggedIn';
const webStorage = () => (typeof window !== 'undefined' && window.localStorage ? window.localStorage : null);
const readLoggedIn = () => {
  try {
    return webStorage()?.getItem(LOGIN_KEY) === '1';
  } catch {
    return false;
  }
};
const writeLoggedIn = (value: boolean) => {
  try {
    if (value) webStorage()?.setItem(LOGIN_KEY, '1');
    else webStorage()?.removeItem(LOGIN_KEY);
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 기억하지 않는다
  }
};

let state: State = { tasks: MOCK_TASKS, reminder: MOCK_REMINDER, loggedIn: readLoggedIn() };
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
  create(input: { title: string; dueAt?: string; subtasks: string[] }) {
    const task: Task = {
      id: newId(),
      title: input.title,
      dueAt: input.dueAt,
      status: 'TODO',
      subtasks: input.subtasks.filter(Boolean).map((title) => ({ id: newId(), title, status: 'TODO' })),
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
    setState({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: toggleStatus(t.status) } : t)) });
  },
  toggleSub(id: string, subId: string) {
    setState({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, subtasks: t.subtasks.map((s: Subtask) => (s.id === subId ? { ...s, status: toggleStatus(s.status) } : s)) }
          : t,
      ),
    });
  },
};

export const reminderActions = {
  set(remindAt: string) {
    setState({ reminder: { id: state.reminder?.id ?? newId(), remindAt, timeZone: 'Asia/Seoul', status: 'ACTIVE' } });
  },
  cancel() {
    setState({ reminder: null });
  },
};

// TODO(API): 실제 로그인·토큰 확인으로 교체
export const authActions = {
  login() {
    writeLoggedIn(true);
    setState({ loggedIn: true });
  },
  logout() {
    writeLoggedIn(false);
    setState({ loggedIn: false });
  },
};
