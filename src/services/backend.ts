import { apiRequest, ApiError } from '@/utils/api';
import { clearAccessToken, readAccessToken, writeAccessToken } from '@/utils/token';

type ApiOptions = Omit<RequestInit, 'headers'> & { headers?: HeadersInit };
async function request<T>(path: string, options: ApiOptions = {}) {
  const token = await readAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return apiRequest<T>(path, { ...options, headers });
}

export type GuestDTO = { userId: string; accessToken: string; expiresAt: string };
export type AuthSessionDTO = {
  userId: string;
  accessToken: string;
  expiresAt: string;
  accountType: string;
  email: string;
  emailVerified: boolean;
};
export type MeDTO = {
  userId: string;
  expiresAt: string;
  accountType: string;
  email: string | null;
  emailVerified: boolean;
};
export type TaskDTO = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'TODO' | 'DONE';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subtaskSummary: { total: number; done: number; ratio: number | null };
  subtasks?: SubtaskDTO[];
};
export type SubtaskDTO = {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  createdAt?: string;
  updatedAt?: string;
};
export type StudyDTO = {
  id: string;
  taskId: string | null;
  status: 'STUDYING' | 'PAUSED' | 'ENDED';
  startedAt: string;
  endedAt: string | null;
  endReason: string | null;
  studySeconds: number;
  runningStartedAt: string | null;
  startRequestId: string;
  version: number;
  serverTime: string;
};
export type ReminderDTO = {
  id: string;
  sourceSessionId: string;
  remindAt: string;
  timeZone: string;
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED';
};
export type ReminderCurrentDTO = { reminder: ReminderDTO | null; serverTime: string };

export async function createGuestSession() {
  const guest = await apiRequest<GuestDTO>('guest-sessions', { method: 'POST' });
  await writeAccessToken(guest.accessToken);
  return guest;
}

export const getMe = () => request<MeDTO>('me');

export async function registerEmail(email: string, password: string) {
  // AUTH01 accepts an optional guest bearer so the existing guest user's data is preserved.
  const session = await request<AuthSessionDTO>('auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await writeAccessToken(session.accessToken);
  return session;
}

export async function loginEmail(email: string, password: string) {
  // AUTH02 is public; do not send a stale guest/account token with the login request.
  const session = await apiRequest<AuthSessionDTO>('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await writeAccessToken(session.accessToken);
  return session;
}

export async function restoreSavedSession() {
  if (!(await readAccessToken())) return null;
  try {
    return await getMe();
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
    await clearAccessToken();
    return null;
  }
}

export const listTasks = async (status?: 'TODO' | 'DONE') => {
  const query = status ? `?status=${status}` : '';
  return request<{ items: TaskDTO[] }>(`tasks${query}`);
};

export async function getTask(taskId: string) {
  const result = await request<TaskDTO | { task: TaskDTO; subtasks: SubtaskDTO[] }>(`tasks/${encodeURIComponent(taskId)}`);
  return 'task' in result ? { ...result.task, subtasks: result.subtasks } : result;
}

export const createTask = (input: { title: string; dueDate?: string | null }) =>
  request<TaskDTO>('tasks', {
    method: 'POST',
    body: JSON.stringify({ title: input.title, ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}) }),
  });

export const patchTask = (taskId: string, patch: Partial<Pick<TaskDTO, 'title' | 'description' | 'dueDate' | 'status'>>) =>
  request<TaskDTO>(`tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const deleteTask = (taskId: string) => request<void>(`tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' });

export const createSubtask = (taskId: string, title: string) =>
  request<SubtaskDTO>(`tasks/${encodeURIComponent(taskId)}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) });

export const patchSubtask = (taskId: string, subtaskId: string, patch: Partial<Pick<SubtaskDTO, 'title' | 'status'>>) =>
  request<SubtaskDTO>(`tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

export const deleteSubtask = (taskId: string, subtaskId: string) =>
  request<void>(`tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, { method: 'DELETE' });

export function newClientRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const startStudySession = (taskId?: string | null) =>
  request<StudyDTO>('study-sessions', {
    method: 'POST',
    body: JSON.stringify({ clientRequestId: newClientRequestId(), taskId: taskId ?? null }),
  });

export const getCurrentStudySession = () =>
  request<{ studySession: StudyDTO | null; serverTime: string }>('study-sessions/current');

export const changeStudySession = (sessionId: string, action: 'PAUSE' | 'RESUME' | 'END', expectedVersion: number) =>
  request<StudyDTO>(`study-sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ action, expectedVersion }),
  });

export const getCurrentReminder = () => request<ReminderCurrentDTO>('start-reminders/current');

export async function putNextStartReminder(sessionId: string, remindAt: string, timeZone: string) {
  const body = JSON.stringify({ remindAt, timeZone });
  for (let attempt = 0; ; attempt++) {
    try {
      return await request<ReminderCurrentDTO>(`study-sessions/${encodeURIComponent(sessionId)}/next-start-reminder`, {
        method: 'PUT', body,
      });
    } catch (error) {
      const transient = error instanceof ApiError && (
        error.status === 0 || (error.body && typeof error.body === 'object'
          && 'retryable' in error.body && error.body.retryable === true)
      );
      if (!transient || attempt >= 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

export const changeStartReminder = (
  reminder: Pick<ReminderDTO, 'id' | 'remindAt' | 'timeZone'>,
  remindAt: string,
  timeZone: string,
) => request<ReminderCurrentDTO>(`start-reminders/${encodeURIComponent(reminder.id)}`, {
  method: 'PATCH',
  body: JSON.stringify({
    expectedRemindAt: reminder.remindAt,
    expectedTimeZone: reminder.timeZone,
    remindAt,
    timeZone,
  }),
});

export const deleteStartReminder = (reminderId: string) =>
  request<void>(`start-reminders/${encodeURIComponent(reminderId)}`, { method: 'DELETE' });

export type ExchangeUtteranceDTO = {
  id?: string;
  characterKey?: string;
  content?: string;
  text?: string;
};
export type ExchangeDTO = {
  id: string;
  clientRequestId: string;
  studySessionId: string | null;
  status: string;
  utterances: ExchangeUtteranceDTO[];
  failureCode: string | null;
  createdAt: string;
  finishedAt: string | null;
  content?: string;
};
export type ChatHistoryItemDTO = Omit<ExchangeDTO, 'id' | 'content'> & { content: string };
export type ChatHistoryPageDTO = { items: ChatHistoryItemDTO[]; nextCursor: string | null };
export type ChatUsageDTO = {
  timeZone: string;
  daily: Record<string, unknown>;
  monthly: Record<string, unknown>;
  dailyRequestLimit: number;
  availability: string;
};

export type ExchangeRequest = {
  clientRequestId: string;
  content: string;
  studySessionId?: string | null;
  previousRequestId?: string | null;
  characterKeys?: string[];
};

export function createExchange(input: ExchangeRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  const payload = request<ExchangeDTO>('chat/exchanges', {
    method: 'POST',
    body: JSON.stringify(input),
    signal: controller.signal,
  });
  return payload.finally(() => clearTimeout(timeout));
}

export async function recoverExchange(clientRequestId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ clientRequestId });
  const result = await request<{ items: ExchangeDTO[] }>(`chat/exchanges?${query.toString()}`, { signal });
  return result.items.find((item) => item.clientRequestId === clientRequestId) ?? null;
}

export async function getChatHistory(limit = 50, cursor?: string | null) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return request<ChatHistoryPageDTO>(`chat/history?${query.toString()}`);
}

export const getChatUsage = () => request<ChatUsageDTO>('chat/usage');

export type PresenceEvent = {
  installationId: string;
  eventId: string;
  sequence: number;
  state: 'FOREGROUND' | 'BACKGROUND';
};
export type PresenceResult = {
  sessionId: string;
  installationId: string;
  state: 'FOREGROUND' | 'BACKGROUND';
  awayAt: string | null;
  dueAt: string | null;
  deliveryStatus: string;
  deliveryEnabled: boolean;
  serverTime: string;
};
export const registerPushDevice = (installationId: string, expoPushToken: string) =>
  request<{ installationId: string }>(`push-devices/${installationId}`, {
    method: 'PUT', body: JSON.stringify({ expoPushToken }),
  });
export const removePushDevice = (installationId: string) =>
  request<void>(`push-devices/${installationId}`, { method: 'DELETE' });
export const sendStudyPresence = (sessionId: string, event: PresenceEvent) =>
  request<PresenceResult>(`study-sessions/${sessionId}/presence`, {
    method: 'PUT', body: JSON.stringify(event),
  });
