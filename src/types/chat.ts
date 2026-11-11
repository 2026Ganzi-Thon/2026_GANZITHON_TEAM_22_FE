import type { CharacterId } from '@/constants/characters';

export type ChatMessage = {
  id: string;
  /** me = 사용자, 그 외 = 감정콩 */
  sender: 'me' | CharacterId;
  text: string;
  /** 캐릭터 답을 기다리는 중 ("…" 말풍선) */
  pending?: boolean;
};
