// 하단 탭 4개. name은 src/app/(tabs)/ 파일 이름과 같아야 한다.
// 아이콘 PNG 아래쪽에 작은 글자가 들어 있어서 피그마처럼 잘라서 보여준다 (crop = 이미지 크기·위치 %).
export const TABS = [
  {
    name: 'index',
    label: '홈',
    icon: require('@/assets/images/icons/tab/home.png'),
    crop: { width: '100%', height: '126.31%', left: '0%', top: '0%' },
  },
  {
    name: 'tasks',
    label: '할 일',
    icon: require('@/assets/images/icons/tab/tasks.png'),
    crop: { width: '100%', height: '133.59%', left: '-3.51%', top: '-6.34%' },
  },
  {
    name: 'chat',
    label: '감정콩',
    // 스터디룸 하단 "대화" 아이콘과 같은 이미지 사용
    icon: require('@/assets/images/icons/study/chat.png'),
    crop: { width: '100%', height: '130.64%', left: '0%', top: '0%' },
  },
  {
    name: 'my',
    label: '내 정보',
    icon: require('@/assets/images/icons/tab/my.png'),
    crop: { width: '113.66%', height: '131.5%', left: '-6.83%', top: '0%' },
  },
] as const;

export type TabCrop = (typeof TABS)[number]['crop'];
