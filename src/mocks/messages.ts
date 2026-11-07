import type { ChatMessage } from '@/types/chat';

// TODO(API): 대화 이력 조회로 교체 (단체 대화방·스터디룸 대화 이력 공유 여부는 미정)
export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', sender: 'me', text: '아 진짜 하기 싫다...' },
  { id: 'm2', sender: 'angry', text: '나도 싫어~!!!!!' },
  { id: 'm3', sender: 'joy', text: '너는 과제가 없잖앜ㅋㅋ' },
  { id: 'm4', sender: 'sad', text: '같이 싫어해 줄 수도 있지ㅠㅠ' },
  { id: 'm5', sender: 'me', text: 'ㅋㅋㅋ내 말이....' },
  { id: 'm6', sender: 'angry', text: '견뎌...ㅋㅋㅋ' },
  { id: 'm7', sender: 'me', text: '너 T야??????' },
  { id: 'm8', sender: 'joy', text: '화남이가 잘 못 했네...' },
];
