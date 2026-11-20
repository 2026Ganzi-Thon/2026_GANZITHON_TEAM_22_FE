import { getCurrentStudySession, newClientRequestId, startStudySession, type StudyDTO, type StudyStartRequest } from '@/services/backend';
import { apiErrorCode } from '@/services/chatRecovery';
import { ApiError } from '@/utils/api';
import { readPreference, writePreference } from '@/utils/preferences';

const key = (userId: string) => `pendingStudyStart.${userId}`;
const inFlight = new Map<string, Promise<StudyDTO>>();
const generations = new Map<string, number>();
export const readPendingStudyStart = (userId: string) => readPreference<StudyStartRequest | null>(key(userId), null);
export function cancelPendingStudyStart(userId: string) {
  generations.set(userId, (generations.get(userId) ?? 0) + 1);
  inFlight.delete(userId);
}

export function startOrRecoverStudy(userId: string, taskId?: string): Promise<StudyDTO> {
  const running = inFlight.get(userId);
  if (running) return running;
  const generation = generations.get(userId) ?? 0;
  const ensureCurrent = () => {
    if (generation !== (generations.get(userId) ?? 0)) throw new Error('공부 시작 요청을 중단했어. 다시 로그인해줘.');
  };
  const operation = (async () => {
    const input = await readPendingStudyStart(userId) ?? { clientRequestId: newClientRequestId(), taskId: taskId ?? null };
    ensureCurrent();
    await writePreference(key(userId), input);
    for (let attempt = 0; ; attempt++) {
      ensureCurrent();
      let dto: StudyDTO;
      try {
        dto = await startStudySession(input);
      } catch (error) {
        ensureCurrent();
        if (apiErrorCode(error) === 'ACTIVE_STUDY_EXISTS') {
          const current = await getCurrentStudySession();
          ensureCurrent();
          if (!current.studySession || current.studySession.status === 'ENDED') throw error;
          dto = current.studySession;
        } else {
          const transient = !(error instanceof ApiError) || error.status === 0 || error.status >= 500;
          if (transient && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1_000));
            continue;
          }
          if (!transient) await writePreference(key(userId), null);
          throw error;
        }
      }
      ensureCurrent();
      await writePreference(key(userId), null);
      if (dto.status === 'ENDED') throw new Error('이전 공부는 이미 종료됐어. 다시 시작해줘.');
      return dto;
    }
  })().finally(() => { if (inFlight.get(userId) === operation) inFlight.delete(userId); });
  inFlight.set(userId, operation);
  return operation;
}
