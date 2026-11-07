import { router } from 'expo-router';

/** 뒤로 갈 화면이 없으면(웹 새로고침·딥링크 등) 홈으로 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
