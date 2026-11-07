import { colors } from '@/constants/theme';

// 스터디룸 영상 (assets/videos/). 파일이 들어오면 require로 바꾼다. null이면 이미지로 대신 보여준다
// TODO(asset): 피그마 mp4 → assets/videos/{angry,sad,joy}-{study,rest}.mp4
type VideoPair = { study: number | null; rest: number | null };
const NO_VIDEO: VideoPair = { study: null, rest: null };

// 감정콩 3명. 화면에서는 id로만 부르고 이름·색·이미지는 여기서 가져온다
export const CHARACTERS = {
  angry: {
    name: '화남이',
    color: colors.angryStrong,
    soft: colors.angry,
    profile: require('@/assets/images/characters/profile/angry.png'),
    study: require('@/assets/images/characters/study/angry-study.jpg'),
    rest: require('@/assets/images/characters/study/angry-rest.jpg'),
    video: NO_VIDEO,
  },
  sad: {
    name: '슬픔이',
    color: colors.sadStrong,
    soft: colors.sad,
    profile: require('@/assets/images/characters/profile/sad.png'),
    study: require('@/assets/images/characters/study/sad-study.jpg'),
    rest: require('@/assets/images/characters/study/sad-rest.jpg'),
    video: NO_VIDEO,
  },
  joy: {
    name: '기쁨이',
    color: colors.joyStrong,
    soft: colors.joy,
    profile: require('@/assets/images/characters/profile/joy.png'),
    study: require('@/assets/images/characters/study/joy-study.jpg'),
    rest: require('@/assets/images/characters/study/joy-rest.jpg'),
    video: NO_VIDEO,
  },
} as const;

export type CharacterId = keyof typeof CHARACTERS;
export const CHARACTER_IDS: CharacterId[] = ['angry', 'sad', 'joy'];
