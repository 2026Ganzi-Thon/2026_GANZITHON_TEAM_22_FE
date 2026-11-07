// 피그마 기준값 (docs/design-system.md). 화면에서는 hex를 직접 쓰지 말고 여기 값만 쓴다.

export const colors = {
  background: '#FDEBCC',
  backgroundClear: 'rgba(253, 235, 204, 0)',
  /** 웹에서 앱 바깥 여백 */
  page: '#EAD6B4',
  surface: '#FFFAF2',
  surfaceSub: '#FFF3DD',
  primary: '#FF8268',
  primarySoft: '#FC947E',
  text: '#5A4848',
  textSub: '#796868',
  textMuted: '#978282',
  textStrong: '#262529',
  line: '#E1E4EE',
  white: '#FFFFFF',
  angry: '#FEE0D8',
  sad: '#D8E6F2',
  joy: '#FDEBCC',
  angryStrong: '#FF6B4C',
  sadStrong: '#84BBEA',
  joyStrong: '#FFC943',
  overlay: 'rgba(90, 72, 72, 0.8)',
  dim: 'rgba(0, 0, 0, 0.2)',
  tabGlow: '#F6D072',
} as const;

// 폰트 파일은 assets/fonts/, 로드는 src/app/_layout.tsx
export const fonts = {
  titleBold: 'Dunggeunmiso-B',
  title: 'Dunggeunmiso-R',
  bodySemiBold: 'Pretendard-SemiBold',
  body: 'Pretendard-Regular',
} as const;

// 웹에서 앱 최대 너비 (폰 크기로 가운데 고정)
export const WEB_APP_MAX_WIDTH = 430;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export const radius = {
  badge: 30,
  container: 25,
  button: 24,
  card: 20,
  pill: 15,
  tabBar: 50,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
