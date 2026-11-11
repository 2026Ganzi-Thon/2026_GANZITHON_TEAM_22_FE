# 마음쉼 TASK — 프론트엔드 (HAEBOYANG)

> 완벽해야 한다는 부담으로 공부를 미루는 대학생이
> 감정콩 친구들(화남이·슬픔이·기쁨이)과 함께 첫 행동을 시작하도록 돕는 앱

간지톤 22팀 프론트엔드 저장소. 앱(Expo Go)과 웹(Cloudflare)을 같은 코드로 만든다.

**핵심 흐름:** 홈 → 함께 시작하기 → (할 일 선택, 생략 가능) → 스터디룸 → 쉬기·다시 시작 → 나가기 → (선택) 다음 시작 알림 → 홈

---

## 기술 스택

| 구분 | 사용 기술 | 버전 | 쓰는 곳 |
| --- | --- | --- | --- |
| 프레임워크 | React Native + **Expo** | Expo SDK 58 / RN 0.88 / React 19 | 앱·웹 공통 |
| 언어 | TypeScript | 6.0 | 전체 |
| 라우팅 | **Expo Router** (파일 기반) | 58 | `src/app/` 파일 하나 = 화면 하나 |
| 스타일 | React Native `StyleSheet` + 디자인 토큰 | — | `src/constants/theme.ts` 값만 사용 |
| 이미지 | expo-image | 58 | 캐릭터·배경·아이콘(PNG/SVG) |
| 애니메이션 | React Native `Animated` | 내장 | 스플래시 페이드아웃 |
| 애니메이션 (예정) | **react-native-reanimated** | 4.7 | 화면 전환·캐릭터 반응·시트 모션 |
| 그라데이션 | expo-linear-gradient | 58 | 홈·로그인 배경 아래 페이드 |
| 영상 | expo-video | 58 | 스터디룸 캐릭터 반복 영상(mp4) |
| 카메라 | expo-camera | 58 | 스터디룸 내 전면 카메라 미리보기 (저장·전송 없음) |
| 폰트 | expo-font | 58 | 학교안심 둥근미소(B·R), 프리텐다드(SemiBold·Regular) |
| 스플래시 | expo-splash-screen | 58 | 네이티브 스플래시 + 같은 이미지 오버레이 |
| 코드 검사 | ESLint (eslint-config-expo) | 9 | `npx expo lint` |
| 알림 | expo-notifications | 58 | 다음 시작 알림 기기 로컬 예약 |
| 디자인 | Figma | — | 와이어프레임·디자인 기준값 |

---

## 시스템 설계

### 전체 구조

```
  앱 (Expo Go, iOS/Android)      웹 (Cloudflare Pages)
            │                            │        ← 같은 코드 (Expo)
            └─────────────┬──────────────┘
                │ HTTPS REST /api/v1  (Bearer 토큰)
        ┌───────▼────────┐
        │ Spring 백엔드  │ ──→ 외부 AI (캐릭터 대화)
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │ 관계형 DB       │  할 일·공부 세션·대화·알림 의도
        └────────────────┘

앱 ──→ OS 로컬 알림 예약 (다음 시작 알림. 서버는 "알림 의도"만 저장)
```

API 연동 상세와 현재 백엔드 의존 항목은 [HANDOFF.md](HANDOFF.md)를 참고한다.

### 프론트 역할 분담

| 프론트가 하는 것 | 백엔드가 하는 것 |
| --- | --- |
| 화면, 캐릭터 영상·모션, 카메라 미리보기, 권한 요청 | 데이터 저장, 공부 상태(공부 중·휴식·종료)와 시간 집계 |
| 알림 기기 예약·취소 | 알림 의도 저장, AI 호출 |

### 프론트 데이터 흐름

```
화면 (src/app)
  └─ 조각 컴포넌트 (src/features, src/components)
        └─ 데이터 상태: src/mocks/store.ts
              └─ 서버 통신: src/services/backend.ts → HTTPS REST /api/v1
                    └─ 인증 토큰: expo-secure-store (웹은 localStorage)
```

- 할 일·공부 세션·다음 시작 알림·대화는 서버 API를 사용한다.
- `src/mocks` 폴더에는 상태 저장소와 초기 화면에서 쓰던 데이터 파일이 함께 남아 있다. 현재 API 연결 상태는 [HANDOFF.md](HANDOFF.md)를 기준으로 한다.
- 스터디룸 타이머는 `src/hooks/useStudySession.ts`에서 관리하며, 서버가 주는 `studySeconds`를 기준으로 표시한다.

### 화면 구성

| 화면 ID | 화면 | 파일 |
| --- | --- | --- |
| — | 로그인 · 회원가입 | `src/app/(auth)/` |
| HM-01 | 홈 | `src/app/(tabs)/index.tsx` |
| HM-02 · HM-03 | 할 일 추가 · 자세히 보기 · 수정 | `src/app/task/` |
| HM-02-alarm | 알림 변경하기 | `src/app/alarm.tsx` |
| ST-01 | 함께 시작하기 | `src/app/study/start.tsx` |
| ST-02 ~ ST-04 | 스터디룸 · 지금 하는 일 · 대화 · 나가기 · 다음 시작 알림 | `src/app/study/` |
| TK-01 | 할 일 목록 | `src/app/(tabs)/tasks.tsx` |
| CH-01 | 감정콩 대화 | `src/app/(tabs)/chat.tsx` |
| MY-01 | 내 정보 | `src/app/(tabs)/my.tsx` |

전체 화면 목록과 동작은 [`docs/screens.md`](docs/screens.md), 색·폰트는 [`docs/design-system.md`](docs/design-system.md)를 본다.

### 폴더 구조

```
src/
  app/          화면 (라우트). 파일 맨 위에 화면 ID 주석
  components/   공통 부품 (common: 버튼·시트·달력…, layout: 헤더·하단 탭·스플래시)
  features/     화면 전용 조각 (home, tasks, study, chat, auth)
  hooks/        useStudySession (스터디룸 타이머)
  constants/    theme.ts (색·폰트·간격), characters.ts, tabs.ts
  types/        데이터 타입
  mocks/        화면 상태 저장소와 초기 화면용 데이터
  services/     백엔드 API, 기기 로컬 알림
  utils/        API 요청, 설정 저장, 날짜 표시, 뒤로가기
assets/         fonts/, images/, videos/
docs/           화면 정리, 디자인 시스템
```

---

## 실행하기

```bash
npm install   # 처음 한 번
```

| 하고 싶은 것 | 명령어 |
| --- | --- |
| 폰으로 보기 (Expo Go) | `npm start` |
| 컴퓨터 브라우저로 보기 | `npm run web` |
| 다른 와이파이에서 폰으로 보기 | `npx expo start --tunnel` |
| 코드 검사 | `npx expo lint` · `npx tsc --noEmit` |

### 폰으로 보는 순서

1. 폰에 **Expo Go** 앱을 설치한다 (App Store / Play Store).
2. 폰과 컴퓨터를 **같은 와이파이**에 연결한다.
3. 프로젝트 폴더에서 `npm start`를 실행한다.
4. 터미널에 나온 QR 코드를 찍는다.
   - 아이폰: 기본 카메라로 찍는다.
   - 안드로이드: Expo Go 앱 안에서 찍는다.
5. 앱이 열리면 하단 탭과 화면 이동을 확인한다.

Expo Go에서는 스플래시 대신 Expo 화면이 먼저 보인다. 실제 스플래시·앱 아이콘은 개발용 빌드(EAS)에서 확인한다.

### 웹 배포 (Cloudflare)

배포 주소: https://haeboyang.anhs-0218.workers.dev

```bash
npx wrangler login   # 처음 한 번 (Cloudflare 계정 로그인)
npm run deploy       # 웹 빌드(dist/) 후 Cloudflare에 배포
```

설정은 `wrangler.jsonc`에 있다. 새로고침이나 주소 직접 입력도 앱이 처리하도록 되어 있다.

시연은 웹 링크를 기본으로 하고, 앱은 Expo Go로 보여준다. 웹 카메라는 HTTPS 주소에서만 동작한다.

---

## 반드시 지킬 서비스 원칙 (기능 명세서)

- 할 일 등록·감정 선택·대화·시간 설정 없이도 공부를 시작할 수 있다.
- 할 일은 자동 완료되지 않는다. 완료는 사용자가 직접 한다. 스터디룸에서 나가도 마찬가지다.
- 목표 시간, 카운트다운, 자동 종료, 시간 기반 팝업을 만들지 않는다.
- 카메라는 기본 OFF, 켤 때만 권한 요청, 거절해도 이용 가능, 저장·전송하지 않는다.
- 스터디룸 타이머: 할 일 보기는 시간 유지, 대화·쉬기는 일시정지. 시작 시각 기준으로 계산한다.

---

## 협업 규칙

### 브랜치·커밋

- 브랜치: `main` 하나로 작업한다. 확인이 끝난 커밋만 push하고, 배포 사이트에는 항상 `main` 코드가 올라간다 (`npm run deploy`는 `main`에서만 실행된다).
- 커밋: `type: 설명` — `feat`, `fix`, `docs`, `style`, `refactor`, `chore`
- 커밋은 기능 단위로 나눈다. 여러 기능을 한 커밋에 섞지 않는다.

### 코드

- **화면 ID는 와이어프레임 기준**이다. 같은 번호가 여러 화면이면 `번호-이름`으로 구분한다 (예: `HM-02-add`, `ST-03-exit`). 전체 목록은 [`docs/screens.md`](docs/screens.md).
- 화면 파일(`src/app/`) 맨 위에 화면 ID 주석을 단다. 화면 파일은 조각을 조립만 한다.
- 색·폰트·간격은 `src/constants/theme.ts` 값만 쓴다. hex 값을 하드코딩하지 않는다.
- 화면은 데이터를 props나 훅으로만 받는다. 화면 안에서 직접 fetch하지 않는다.
- API 연동 지점은 `// TODO(API): ...` 한 줄로 표시한다. 필요한 말만 짧게 쓴다.
- 파일 이름: 컴포넌트 `PascalCase.tsx`, 훅 `useCamelCase.ts`, 그 외 `camelCase.ts`
- 경로 별칭: `@/` = `src/`

### 자료 위치

원본과 요약본이 다르면 원본이 우선이다. 다른 점을 발견하면 작업 전에 팀에 알린다.

| 자료 | 원본 | 저장소 안 요약 |
| --- | --- | --- |
| 요구사항 명세서 | [노션](https://app.notion.com/p/4043caeed8dd81a6923bd964d3a86735) | — |
| 개발 가이드·협업 규칙·백엔드 설계 v0.3 | [노션](https://app.notion.com/p/40b3caeed8dd81ecb554ed96c3aa4bb1) | — |
| 와이어프레임·디자인 | [피그마](https://www.figma.com/design/sIDudVq3kg25OT9aeG1cB8) (페이지 `프레임 디자인`) | `docs/screens.md`, `docs/design-system.md`, `theme.ts` |
| API 명세 | 스웨거 (준비 중) | — |

### 백엔드 확인이 필요한 것

- AI 생성 기능 활성화와 소셜 로그인 제공 여부
- 프로필 닉네임·핸들, 알림 설정, 캐릭터 선택의 계정 저장 API
- 할 일 마감 시각 저장 필요 여부 (현재 API는 날짜만 저장)
