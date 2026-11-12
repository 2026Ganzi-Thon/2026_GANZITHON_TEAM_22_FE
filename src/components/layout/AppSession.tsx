import { Redirect } from 'expo-router';
import { type ReactNode, useEffect } from 'react';

import ErrorView from '@/components/common/ErrorView';
import LoadingView from '@/components/common/LoadingView';
import { initializeAppStore, useMockStore } from '@/mocks/store';

function connect() {
  void initializeAppStore().catch(() => undefined);
}

export default function AppSession({ children }: { children: ReactNode }) {
  const { loggedIn, loading, error } = useMockStore();
  useEffect(() => {
    if (loading && !loggedIn) connect();
  }, [loading, loggedIn]);

  if (loading) return <LoadingView message="서버에 연결하는 중이야..." />;
  if (error) return <ErrorView message={error} onRetry={connect} />;
  if (!loggedIn) return <Redirect href="/login" />;
  return <>{children}</>;
}
