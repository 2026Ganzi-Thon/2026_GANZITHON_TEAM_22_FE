import { colors } from '@/constants/theme';

// 스터디룸 공부 영상 (assets/videos/, H.264 540x960). 쉬는 영상은 아직 없어서 쉬는 중엔 이미지를 보여준다
type CharacterVideo = { study: number | null; rest: number | null };

// 감정콩 3명. 화면에서는 id로만 부르고 이름·색·이미지는 여기서 가져온다
export const CHARACTERS = {
  angry: {
    name: '화남이',
    color: colors.angryStrong,
    soft: colors.angry,
    profile: require('@/assets/images/characters/profile/angry.png'),
    study: require('@/assets/images/characters/study/angry-study.jpg'),
    rest: require('@/assets/images/characters/study/angry-rest.jpg'),
    video: { study: require('@/assets/videos/angry-study.mp4'), rest: null } as CharacterVideo,
  },
  sad: {
    name: '슬픔이',
    color: colors.sadStrong,
    soft: colors.sad,
    profile: require('@/assets/images/characters/profile/sad.png'),
    study: require('@/assets/images/characters/study/sad-study.jpg'),
    rest: require('@/assets/images/characters/study/sad-rest.jpg'),
    video: { study: require('@/assets/videos/sad-study.mp4'), rest: null } as CharacterVideo,
  },
  joy: {
    name: '기쁨이',
    color: colors.joyStrong,
    soft: colors.joy,
    profile: require('@/assets/images/characters/profile/joy.png'),
    study: require('@/assets/images/characters/study/joy-study.jpg'),
    rest: require('@/assets/images/characters/study/joy-rest.jpg'),
    video: { study: require('@/assets/videos/joy-study.mp4'), rest: null } as CharacterVideo,
  },
} as const;

export type CharacterId = keyof typeof CHARACTERS;
export const CHARACTER_IDS: CharacterId[] = ['angry', 'sad', 'joy'];
