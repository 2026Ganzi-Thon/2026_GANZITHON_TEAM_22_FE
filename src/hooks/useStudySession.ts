import { useEffect, useState, useSyncExternalStore } from 'react';

import { changeStudySession, getCurrentStudySession, startStudySession, type StudyDTO } from '@/services/backend';
import { ApiError } from '@/utils/api';

type Status = 'idle' | 'study' | 'rest';
type Session = {
  status: Status;
  taskId?: string;
  sessionId?: string;
  version: number;
  /** Server accumulated study seconds, converted to milliseconds. */
  accumulated: number;
  /** Local time when we received the server's elapsed total. */
  resumedAt?: number;
};

let session: Session = { status: 'idle', accumulated: 0, version: 0 };
const listeners = new Set<() => void>();
const set = (next: Session) => {
  session = next;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const elapsedOf = (value: Session, now = Date.now()) =>
  value.accumulated + (value.status === 'study' && value.resumedAt ? Math.max(0, now - value.resumedAt) : 0);

const fromDto = (dto: StudyDTO): Session => ({
  status: dto.status === 'STUDYING' ? 'study' : dto.status === 'PAUSED' ? 'rest' : 'idle',
  taskId: dto.taskId ?? undefined,
  sessionId: dto.status === 'ENDED' ? undefined : dto.id,
  version: dto.version,
  accumulated: dto.studySeconds * 1000,
  resumedAt: dto.status === 'STUDYING' ? Date.now() : undefined,
});

export const studyActions = {
  restore(dto: StudyDTO | null) {
    if (!dto || dto.status === 'ENDED') {
      set({ status: 'idle', accumulated: 0, version: 0 });
      return;
    }
    set(fromDto(dto));
  },
  async sync() {
    const before = session;
    const current = await getCurrentStudySession();
    if (session === before) this.restore(current.studySession);
  },
  async start(taskId?: string) {
    const dto = await startStudySession(taskId);
    set(fromDto(dto));
    return dto;
  },
  /** Pause while chatting or when the user taps the timer. */
  async pause() {
    if (session.status !== 'study' || !session.sessionId) return;
    try {
      const dto = await changeStudySession(session.sessionId, 'PAUSE', session.version);
      set(fromDto(dto));
      return dto;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) await this.sync();
      throw error;
    }
  },
  async resume(expectedSessionId?: string) {
    if (session.status !== 'rest' || !session.sessionId
      || (expectedSessionId && session.sessionId !== expectedSessionId)) return;
    try {
      const dto = await changeStudySession(session.sessionId, 'RESUME', session.version);
      set(fromDto(dto));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) await this.sync();
      throw error;
    }
  },
  async end() {
    if (!session.sessionId) {
      set({ status: 'idle', accumulated: 0, version: 0 });
      return null;
    }
    try {
      const dto = await changeStudySession(session.sessionId, 'END', session.version);
      set({ status: 'idle', accumulated: 0, version: dto.version });
      return dto;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) await this.sync();
      throw error;
    }
  },
};

export function useStudySession() {
  return useSyncExternalStore(subscribe, () => session, () => session);
}

/** Display elapsed time from server state and wall clock; no client-side increment drift. */
export function useElapsed() {
  const value = useStudySession();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (value.status !== 'study') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [value.status, value.sessionId]);
  return elapsedOf(value, value.status === 'study' ? now : undefined);
}

export function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const p = (number: number) => String(number).padStart(2, '0');
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
}
