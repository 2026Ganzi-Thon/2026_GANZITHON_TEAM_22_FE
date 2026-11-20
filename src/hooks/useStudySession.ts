import { useEffect, useState, useSyncExternalStore } from 'react';

import { changeStudySession, getCurrentStudySession, type StudyDTO } from '@/services/backend';
import { startOrRecoverStudy } from '@/services/studyStart';
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
let accountRevision = 0;
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
  accumulated: ((dto.priorTaskStudySeconds ?? 0) + dto.studySeconds) * 1000,
  resumedAt: dto.status === 'STUDYING' ? Date.now() : undefined,
});

// 일시정지·다시 시작·종료는 한 줄로 처리한다. 대화에서 돌아오며 보낸 RESUME과
// 바로 누른 END가 같은 version으로 겹치면 뒤의 요청이 409가 되기 때문
let changeQueue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = changeQueue.then(task, task);
  changeQueue = run.catch(() => undefined);
  return run;
}

const idle = (): Session => ({ status: 'idle', accumulated: 0, version: 0 });

export const studyActions = {
  reset() {
    accountRevision++;
    set({ status: 'idle', accumulated: 0, version: 0 });
  },
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
  async start(taskId: string | undefined, userId: string) {
    const revision = accountRevision;
    const dto = await startOrRecoverStudy(userId, taskId);
    if (revision !== accountRevision) throw new Error('계정이 변경됐어. 다시 로그인해줘.');
    set(fromDto(dto));
    return dto;
  },
  /** Pause while chatting or when the user taps the timer. */
  pause() {
    return serial(async () => {
      if (session.status !== 'study' || !session.sessionId) return;
      try {
        const dto = await changeStudySession(session.sessionId, 'PAUSE', session.version);
        set(fromDto(dto));
        return dto;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) await this.sync();
        throw error;
      }
    });
  },
  resume(expectedSessionId?: string) {
    return serial(async () => {
      if (session.status !== 'rest' || !session.sessionId
        || (expectedSessionId && session.sessionId !== expectedSessionId)) return;
      try {
        const dto = await changeStudySession(session.sessionId, 'RESUME', session.version);
        set(fromDto(dto));
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) await this.sync();
        throw error;
      }
    });
  },
  /** 종료한 세션 id를 돌려준다. 409여도 서버에서 이미 끝난 방이면 종료로 본다 (예약은 이어서 저장) */
  end(): Promise<{ id: string } | null> {
    return serial(async () => {
      const sessionId = session.sessionId;
      if (!sessionId) {
        set(idle());
        return null;
      }
      const endWith = async (version: number) => {
        const dto = await changeStudySession(sessionId, 'END', version);
        set({ ...idle(), version: dto.version });
        return { id: dto.id };
      };
      try {
        return await endWith(session.version);
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 409)) throw error;
        const current = (await getCurrentStudySession()).studySession;
        if (!current || current.status === 'ENDED' || current.id !== sessionId) {
          // 이 방은 이미 끝났다. 다른 방이 열려 있으면 그 상태를 보여준다
          this.restore(current);
          return { id: sessionId };
        }
        // 아직 열려 있는 같은 방: 최신 version으로 한 번만 다시 종료
        set(fromDto(current));
        return endWith(current.version);
      }
    });
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
