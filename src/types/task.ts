// 필드 이름은 백엔드 설계 v0.6 TaskDTO·SubtaskDTO·ReminderDTO 기준
export type TaskStatus = 'TODO' | 'DONE';

export type Subtask = {
  id: string;
  title: string;
  status: TaskStatus;
};

export type Task = {
  id: string;
  title: string;
  /** 마감 날짜를 로컬 자정 ISO 형식으로 보관. 없을 수 있음 */
  dueAt?: string;
  status: TaskStatus;
  subtasks: Subtask[];
};

/** 나가기 때 정한 "다음 시작 알림" */
export type Reminder = {
  id: string;
  sessionId?: string;
  /** 알림 일시 (ISO) */
  remindAt: string;
  /** 표시용 시간대 (예: Asia/Seoul) */
  timeZone: string;
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED';
};

export const isDone = (item: { status: TaskStatus }) => item.status === 'DONE';
export const toggleStatus = (status: TaskStatus): TaskStatus => (status === 'DONE' ? 'TODO' : 'DONE');
