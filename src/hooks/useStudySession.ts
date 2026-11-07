import { useEffect, useState, useSyncExternalStore } from 'react';

// 스터디룸 공부 상태. 시간은 1초씩 더하지 않고 "시작 시각과의 차이"로 계산한다
// (백그라운드·화면 잠금에도 틀어지지 않게). 목표 시간·자동 종료는 만들지 않는다.
// TODO(API): 공부 세션 저장이 필요해지면 start/end 시점에 요청

type Status = 'idle' | 'study' | 'rest';
type Session = {
  status: Status;
  taskId?: string;
  /** 지금까지 쌓인 공부 시간(ms) */
  accumulated: number;
  /** 공부 중일 때 마지막으로 재개한 시각 */
  resumedAt?: number;
};

let session: Session = { status: 'idle', accumulated: 0 };
const listeners = new Set<() => void>();
const set = (next: Session) => {
  session = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const elapsedOf = (s: Session, now = Date.now()) =>
  s.accumulated + (s.status === 'study' && s.resumedAt ? now - s.resumedAt : 0);

export const studyActions = {
  start(taskId?: string) {
    set({ status: 'study', taskId, accumulated: 0, resumedAt: Date.now() });
  },
  /** 잠깐 쉬기 (대화 열 때도 사용) */
  pause() {
    if (session.status !== 'study') return;
    set({ ...session, status: 'rest', accumulated: elapsedOf(session), resumedAt: undefined });
  },
  /** 다시 시작하기 */
  resume() {
    if (session.status !== 'rest') return;
    set({ ...session, status: 'study', resumedAt: Date.now() });
  },
  linkTask(taskId: string) {
    set({ ...session, taskId });
  },
  end() {
    set({ status: 'idle', accumulated: 0 });
  },
};

export function useStudySession() {
  return useSyncExternalStore(subscribe, () => session, () => session);
}

/** 화면 표시용 경과 시간 (1초마다 갱신) */
export function useElapsed() {
  const s = useStudySession();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (s.status !== 'study') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [s.status]);
  return elapsedOf(s, s.status === 'study' ? now : undefined);
}

export function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
}
