import { useSyncExternalStore } from 'react';

import {
  changeStartReminder,
  createGuestSession,
  createSubtask,
  createTask as postTask,
  deleteStartReminder,
  deleteSubtask,
  deleteTask,
  getCurrentReminder,
  getCurrentStudySession,
  getTask,
  loginEmail,
  listTasks,
  patchSubtask,
  patchTask,
  putNextStartReminder,
  registerEmail,
  restoreSavedSession,
  type ReminderDTO,
  type SubtaskDTO,
  type TaskDTO,
} from '@/services/backend';
import { clearAccessToken } from '@/utils/token';
import { readPreference, writePreference } from '@/utils/preferences';
import { studyActions } from '@/hooks/useStudySession';
import type { Reminder, Subtask, Task } from '@/types/task';
import { cancelStartReminder, clearStaleStartReminders, scheduleStartReminder } from '@/services/localNotifications';

type State = { tasks: Task[]; reminder: Reminder | null; loggedIn: boolean; loading: boolean; error: string | null };
let state: State = { tasks: [], reminder: null, loggedIn: false, loading: true, error: null };
const listeners = new Set<() => void>();

const setState = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useMockStore() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const dateOnlyToLocalIso = (date: string | null) => (date ? `${date.slice(0, 10)}T00:00:00` : undefined);
const toTask = (dto: TaskDTO): Task => ({
  id: dto.id,
  title: dto.title,
  dueAt: dateOnlyToLocalIso(dto.dueDate),
  status: dto.status,
  subtasks: (dto.subtasks ?? []).map((subtask) => ({ id: subtask.id, title: subtask.title, status: subtask.status })),
});
const toSubtask = (dto: SubtaskDTO): Subtask => ({ id: dto.id, title: dto.title, status: dto.status });
const toReminder = (dto: ReminderDTO | null): Reminder | null => dto ? ({
  id: dto.id,
  sessionId: dto.sourceSessionId,
  remindAt: dto.remindAt,
  timeZone: dto.timeZone,
  status: dto.status,
}) : null;
const dateForApi = (dueAt?: string | null) => {
  if (!dueAt) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueAt)) return dueAt;
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function refreshTasks() {
  const result = await listTasks();
  const tasks = result.items.map((dto) => {
    const task = toTask(dto);
    if (dto.subtasks === undefined) task.subtasks = state.tasks.find((current) => current.id === task.id)?.subtasks ?? [];
    return task;
  });
  setState({ tasks });
  return tasks;
}

export async function loadTaskDetail(taskId: string) {
  const task = toTask(await getTask(taskId));
  const tasks = state.tasks.some((item) => item.id === taskId)
    ? state.tasks.map((item) => item.id === taskId ? task : item)
    : [...state.tasks, task];
  setState({ tasks });
  return task;
}

async function refreshReminder() {
  const { reminder } = await getCurrentReminder();
  setState({ reminder: toReminder(reminder) });
  await syncLocalReminder(reminder);
  return reminder;
}

async function syncLocalReminder(reminder: ReminderDTO | null, requestPermission = false) {
  try {
    const active = reminder?.status === 'ACTIVE' ? reminder : null;
    await clearStaleStartReminders(active?.id);
    return active ? await scheduleStartReminder(active.id, active.remindAt, requestPermission) : false;
  } catch {
    return false;
  }
}

const ACCEPTED_GUEST_KEY = 'acceptedGuestUserId';

let initializePromise: Promise<void> | null = null;
export function initializeAppStore(mode: 'restore' | 'guest' = 'restore') {
  if (initializePromise) return initializePromise;
  initializePromise = (async () => {
    setState({ loading: true, error: null });
    try {
      const savedSession = await restoreSavedSession();
      if (mode === 'guest') {
        const guest = savedSession ?? await createGuestSession();
        if (!savedSession || savedSession.accountType === 'GUEST') {
          await writePreference(ACCEPTED_GUEST_KEY, guest.userId);
        }
      } else if (!savedSession || (
        savedSession.accountType === 'GUEST'
        && await readPreference<string | null>(ACCEPTED_GUEST_KEY, null) !== savedSession.userId
      )) {
        setState({ loggedIn: false, loading: false });
        return;
      }
      const [taskResult, reminderResult, studyResult] = await Promise.all([
        listTasks(),
        getCurrentReminder(),
        getCurrentStudySession(),
      ]);
      studyActions.restore(studyResult.studySession);
      setState({
        tasks: taskResult.items.map(toTask),
        reminder: toReminder(reminderResult.reminder),
        loggedIn: true,
        loading: false,
        error: null,
      });
      await syncLocalReminder(reminderResult.reminder);
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : '서버에 연결하지 못했어요.' });
      throw error;
    } finally {
      initializePromise = null;
    }
  })();
  return initializePromise;
}

function applyTask(taskId: string, change: (task: Task) => Task) {
  setState({ tasks: state.tasks.map((task) => task.id === taskId ? change(task) : task) });
}

export const taskActions = {
  async create(input: { title: string; dueAt?: string; subtasks: string[] }) {
    const parent = await postTask({ title: input.title, dueDate: dateForApi(input.dueAt) });
    let task: Task = { ...toTask(parent), subtasks: [] };
    setState({ tasks: [...state.tasks.filter((item) => item.id !== task.id), task] });
    for (const title of input.subtasks.map((value) => value.trim()).filter(Boolean)) {
      try {
        const subtask = toSubtask(await createSubtask(parent.id, title));
        task = { ...task, subtasks: [...task.subtasks, subtask] };
        applyTask(parent.id, () => task);
      } catch (error) {
        throw Object.assign(error instanceof Error ? error : new Error('하위 할 일을 모두 저장하지 못했어요.'), { taskId: parent.id });
      }
    }
    return task;
  },
  async update(id: string, patch: Partial<Omit<Task, 'id'>>) {
    const current = state.tasks.find((task) => task.id === id);
    if (!current) throw new Error('할 일을 찾을 수 없어.');
    const dtoPatch: Partial<Pick<TaskDTO, 'title' | 'description' | 'dueDate' | 'status'>> = {};
    if (patch.title !== undefined) dtoPatch.title = patch.title;
    if (patch.dueAt !== undefined) dtoPatch.dueDate = dateForApi(patch.dueAt);
    if (patch.status !== undefined) dtoPatch.status = patch.status;
    const updated = Object.keys(dtoPatch).length
      ? toTask(await patchTask(id, dtoPatch))
      : { ...current, subtasks: [...current.subtasks] };

    if (patch.subtasks) {
      const oldById = new Map(current.subtasks.map((subtask) => [subtask.id, subtask]));
      const next: Subtask[] = [];
      for (const subtask of patch.subtasks.filter((item) => item.title.trim())) {
        const old = oldById.get(subtask.id);
        if (!old) {
          next.push(toSubtask(await createSubtask(id, subtask.title.trim())));
          continue;
        }
        oldById.delete(subtask.id);
        const change: Partial<Pick<SubtaskDTO, 'title' | 'status'>> = {};
        if (old.title !== subtask.title.trim()) change.title = subtask.title.trim();
        if (old.status !== subtask.status) change.status = subtask.status;
        next.push(Object.keys(change).length ? toSubtask(await patchSubtask(id, subtask.id, change)) : subtask);
      }
      await Promise.all([...oldById.keys()].map((subtaskId) => deleteSubtask(id, subtaskId)));
      updated.subtasks = next;
    } else {
      updated.subtasks = current.subtasks;
    }
    applyTask(id, () => updated);
  },
  async remove(id: string) {
    await deleteTask(id);
    setState({ tasks: state.tasks.filter((task) => task.id !== id) });
  },
  async toggle(id: string) {
    const current = state.tasks.find((task) => task.id === id);
    if (!current) return;
    const updated = toTask(await patchTask(id, { status: current.status === 'DONE' ? 'TODO' : 'DONE' }));
    updated.subtasks = current.subtasks;
    applyTask(id, () => updated);
  },
  async toggleSub(id: string, subId: string) {
    const task = state.tasks.find((item) => item.id === id);
    const subtask = task?.subtasks.find((item) => item.id === subId);
    if (!subtask) return;
    const updated = toSubtask(await patchSubtask(id, subId, { status: subtask.status === 'DONE' ? 'TODO' : 'DONE' }));
    applyTask(id, (current) => ({ ...current, subtasks: current.subtasks.map((item) => item.id === subId ? updated : item) }));
  },
};

export const reminderActions = {
  async setFromSession(sessionId: string, remindAt: string, timeZone: string) {
    const dto = await putNextStartReminder(sessionId, remindAt, timeZone);
    setState({ reminder: toReminder(dto.reminder) });
    const scheduled = await syncLocalReminder(dto.reminder, true);
    return { reminder: dto.reminder, scheduled };
  },
  async update(remindAt: string, timeZone: string) {
    const current = state.reminder;
    if (!current) return null;
    const dto = await changeStartReminder(current, remindAt, timeZone);
    setState({ reminder: toReminder(dto.reminder) });
    await syncLocalReminder(dto.reminder, true);
    return dto.reminder;
  },
  async cancel() {
    const current = state.reminder;
    if (!current) return;
    await deleteStartReminder(current.id);
    await cancelStartReminder(current.id).catch(() => undefined);
    setState({ reminder: null });
  },
  async refresh() {
    return refreshReminder();
  },
};

export const authActions = {
  async loginAsGuest() {
    await initializeAppStore('guest');
  },
  async loginWithEmail(email: string, password: string) {
    await loginEmail(email.trim(), password);
    await initializeAppStore();
  },
  async registerWithEmail(email: string, password: string) {
    await registerEmail(email.trim(), password);
    await initializeAppStore();
  },
  async logout() {
    await clearAccessToken();
    setState({ loggedIn: false, tasks: [], reminder: null });
  },
};
