// TODO(API): 백엔드 응답 형식이 정해지면 필드 이름 맞추기
export type SubTask = {
  id: string;
  title: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  /** 마감 일시 (ISO). 없을 수 있음 */
  dueAt?: string;
  done: boolean;
  subTasks: SubTask[];
};

/** 나가기 때 정한 "다음 시작 알림" */
export type Reminder = {
  id: string;
  /** 알림 일시 (ISO) */
  remindAt: string;
};
