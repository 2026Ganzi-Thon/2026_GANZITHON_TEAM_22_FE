import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// 웹 전용: 모든 페이지의 HTML 뼈대. 브라우저 탭 제목을 HAEBOYANG으로 고정한다
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>HAEBOYANG</title>
        <meta name="description" content="마음쉼 TASK — 감정콩 친구들과 함께 공부를 시작하는 앱" />
        <meta name="theme-color" content="#FDEBCC" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
