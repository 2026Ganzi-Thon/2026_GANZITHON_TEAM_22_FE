import type { Reminder, Task } from '@/types/task';

// TODO(API): GET 할 일 목록 응답으로 교체
const inDays = (days: number, hour = 23, minute = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: '머신러닝 과제',
    dueAt: inDays(1),
    status: 'TODO',
    subtasks: [
      { id: '1-1', title: '보고서 작성', status: 'TODO' },
      { id: '1-2', title: '코드 작성', status: 'TODO' },
    ],
  },
  {
    id: '2',
    title: '컴퓨터구조 복습',
    status: 'TODO',
    subtasks: [
      { id: '2-1', title: '캐시 메모리 개념 정리', status: 'TODO' },
    ],
  },
  {
    id: '3',
    title: '영어 발표 준비',
    dueAt: inDays(4, 18, 0),
    status: 'TODO',
    subtasks: [],
  },
  {
    id: '4',
    title: '자료구조 퀴즈 공부',
    dueAt: inDays(6, 10, 0),
    status: 'TODO',
    subtasks: [{ id: '4-1', title: '트리 순회 정리', status: 'TODO' }],
  },
  {
    id: '5',
    title: '운영체제 복습',
    status: 'TODO',
    subtasks: [],
  },
];

// TODO(API): GET 다음 시작 알림 응답으로 교체. 없으면 null
export const MOCK_REMINDER: Reminder | null = {
  id: 'r1',
  remindAt: inDays(0, 20, 0),
  timeZone: 'Asia/Seoul',
  status: 'ACTIVE',
};
