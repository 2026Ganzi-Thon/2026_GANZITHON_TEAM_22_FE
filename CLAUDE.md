# 마음쉼 TASK — 프론트엔드 (간지톤 Team 22)

Claude Code가 매 세션 자동으로 읽는 파일. 짧게 유지하고, 자세한 내용은 아래 자료로 보낸다.

## 프로젝트 한 줄
완벽해야 한다는 부담으로 공부 시작을 미루는 대학생이 감정콩 친구들(화남이·슬픔이·기쁨이)과 함께 첫 행동을 시작하도록 돕는 앱.
핵심 흐름: 홈 → 함께 시작하기 → 스터디룸 → 나가기 → (선택) 다음 시작 알림

## 내 역할
화면·컴포넌트(UI/UX), 캐릭터 표현, 스플래시. 라우터·API 연동·배포는 팀원 담당이므로 해당 코드는 먼저 묻고 수정한다.

## 기술 스택
- React Native + Expo (Expo Router, TypeScript)
- 알림: expo-notifications 로컬 예약 알림
- 카메라: expo-camera (전면 미리보기만)
- 시트: `components/common/BottomSheet` (RN Modal 기반. @gorhom/bottom-sheet는 웹에서 열리지 않아 제거)
- 카메라 미리보기: expo-camera / 캐릭터 영상: expo-video
- 그라데이션: `expo-linear-gradient`
- 웹 시연(Cloudflare)이 기본이므로 화면은 `npm run web`에서도 확인한다
- 새 라이브러리 추가는 먼저 물어볼 것

## 작업 규칙
- 기본은 "설계 먼저, 실행은 승인 후"다. 요청에 "설계", "계획", "정리", "저장해둬"가 있으면 계획만 보여주고 아무것도 실행하지 않는다.
- 파일 생성·수정, 패키지 설치, git 명령, 터미널 명령은 무엇을 할지 먼저 보여주고 "진행해"라는 답을 받은 뒤 실행한다.
- 작업 시작 시 옵시디언 개발일지의 가장 최근 파일을 읽고 오늘 할 일을 제안한 뒤 승인을 기다린다.
- 한 번에 한 기능만 작업한다. 범위 밖 수정은 먼저 묻는다.
- 커밋 후 커밋 목록을 브리핑한다. push와 PR은 확인받고 진행한다.
- 같은 방법으로 두 번 실패하면 멈추고 상황을 보고한다.
- 세션 종료 전 개발일지/YYYY-MM-DD.md를 템플릿대로 작성한다 (한 것 / 막힌 것 / 정한 것 / 다음에 할 것).

## 컨벤션
- 화면 ID: **와이어프레임 기준**. 같은 번호가 여러 화면이면 `번호-이름` (예: `HM-02-add`, `ST-03-exit`). 전체 목록은 `docs/screens.md`
- 브랜치: `main`(배포, 직접 push 금지) / `develop`(통합) / `feature/화면ID`, `fix/버그명`
  - 예: `feature/HM-01`, `feature/HM-02-add`, `feature/ST-02`
- 커밋은 기능 단위로 나눈다. 여러 기능을 한 커밋에 섞지 않는다
- 커밋: `type: 제목` — feat, fix, docs, style, refactor, chore
- PR: `.github/pull_request_template.md` 형식으로 `develop`에 머지
- 색·폰트·간격은 `src/constants/theme.ts` 값만 사용. 하드코딩 금지
- 화면은 데이터를 props나 훅으로만 받는다. 화면 안에서 직접 fetch하지 않는다
- 파일 이름: 컴포넌트 `PascalCase.tsx`, 훅 `useCamelCase.ts`, 그 외 `camelCase.ts`

## 폴더 구조
```
src/                (`@/` = `src/`)
  app/            화면만 (조립만, 파일 맨 위에 화면 ID 주석)
    (auth)/       login · signup
    (tabs)/       index(HM-01) · tasks(TK-01) · chat(CH-01) · my(MY-01)  ← 하단 탭 4개
    task/         new(HM-02-add) · [id]/index(HM-02-detail, HM-03-done) · [id]/edit(HM-03-edit)
    alarm.tsx     HM-02-alarm
    study/        start(ST-01) · index(ST-02) · todo(ST-03-todo) · chat(ST-03-chat)  ← 하단 탭 없음
  components/
    common/       Button · Text · Icon · BottomSheet · ConfirmDialog · DateTimeSheet · Toggle
    layout/       BottomTabBar · TabItem · Header · AnimatedSplash
    character/    Character (상태별 이미지 교체)
  features/       화면 전용 조각 (데이터 구조를 아는 컴포넌트)
    home/ · tasks/ · study/ · chat/ · auth/
  hooks/          useStudySession 등
  constants/      theme.ts · tabs.ts · characters.ts
  types/          task.ts · chat.ts
  mocks/          API 완성 전 가짜 데이터 + 임시 저장소 store.ts (`TODO(API)` 교체 대상)
  utils/          date.ts (날짜 표시 형식)
assets/           fonts/ · images/
docs/             screens.md · design-system.md · openapi.json
```

- 주석: API 연동 지점은 `// TODO(API): ...` 한 줄로 통일. 필요한 말만 짧게

## 반드시 지킬 서비스 원칙 (명세서)
- 할 일 등록·감정 선택·대화·시간 설정 없이도 시작할 수 있어야 한다.
- 할 일은 자동 완료되지 않는다. 완료는 사용자가 직접 한다.
- 목표 시간, 카운트다운, 자동 종료, 시간 기반 팝업을 만들지 않는다.
- 카메라는 기본 OFF, 켤 때만 권한 요청, 거절해도 이용 가능, 저장·전송 없음.
- 스터디룸 타이머: 할 일 보기는 유지, 대화·쉬기는 일시정지, 시작 시각 기준으로 계산.

## 자료 위치
| 자료 | 원본 | 리포 안 |
| --- | --- | --- |
| 기획안, 기능·사용자 흐름 명세서 | 노션: (링크) | — |
| 와이어프레임·디자인 | 피그마: https://www.figma.com/design/sIDudVq3kg25OT9aeG1cB8 (페이지 `프레임 디자인`) | `docs/screens.md`, `docs/design-system.md`, `src/constants/theme.ts` |
| API | 스웨거: (URL) | `docs/openapi.json` |
| 진행 기록 | 옵시디언 `2510 간지톤/개발일지/` | — |

원본과 요약본이 다르면 원본이 우선. 다른 걸 발견하면 작업 전에 알릴 것.

## 미정 (결정되면 갱신)
- (결정됨) 로그인은 이메일/비밀번호 화면. 시안·명세 차이 결정은 `docs/screens.md` "결정 사항"
- 대화 이력 공유 여부
- 캐릭터 에셋 형식 (1차는 상태별 이미지 교체)

## 실행
```
npm install
npx expo start
```
