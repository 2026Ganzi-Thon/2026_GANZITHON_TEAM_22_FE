import type { CharacterId } from '@/constants/characters';

// TODO(API): 대화 응답 형식이 정해지면 맞추기
export type ChatMessage = {
  id: string;
  /** me = 사용자, 그 외 = 감정콩 */
  sender: 'me' | CharacterId;
  text: string;
};
