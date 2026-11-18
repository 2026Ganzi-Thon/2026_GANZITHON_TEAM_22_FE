import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useStudySession } from '@/hooks/useStudySession';
import { useMockStore } from '@/mocks/store';
import { createPresenceEvent, isPushDeviceRegistered, supportsRemotePush, syncPushRegistration, transmitPresence, waitForPushRegistration } from '@/services/studyPresence';
import { ApiError } from '@/utils/api';

function canRetry(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  const body = error.body;
  if (body && typeof body === 'object' && 'retryable' in body && body.retryable === false) return false;
  return error.status === 0 || error.status >= 500 || error.status === 429;
}

/** Root-level listener stays active when navigating away from the study screen. */
export function useStudyPresence() {
  const { loggedIn, loading, userId } = useMockStore();
  const { sessionId, status } = useStudySession();
  useEffect(() => {
    if (!loggedIn || loading || !userId || !supportsRemotePush()) return;
    let active = true;
    let currentState: AppStateStatus = AppState.currentState === 'background' ? 'background' : 'active';
    let revision = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const report = async (next: AppStateStatus, requestPermission = false) => {
      const ownRevision = ++revision;
      clearTimeout(retryTimer);
      try {
        // Registration happens while foregrounded. Departure must send without another token fetch.
        if (next === 'active') {
          if (isPushDeviceRegistered()) void syncPushRegistration(requestPermission).catch(() => undefined);
          else await syncPushRegistration(requestPermission);
        } else {
          await waitForPushRegistration();
        }
        if (!active || ownRevision !== revision || !sessionId || !isPushDeviceRegistered()) return;
        const state = next === 'background' && status === 'study' ? 'BACKGROUND' : 'FOREGROUND';
        const event = await createPresenceEvent(state);
        if (!active || ownRevision !== revision) return;
        const transmit = async () => {
          if (!active || ownRevision !== revision) return;
          try {
            await transmitPresence(sessionId, event);
          } catch (error) {
            if (canRetry(error) && active && ownRevision === revision) retryTimer = setTimeout(() => { void transmit(); }, 4_000);
          }
        };
        await transmit();
      } catch (error) {
        if (canRetry(error) && active && ownRevision === revision && next === 'active') {
          retryTimer = setTimeout(() => { void report(currentState); }, 4_000);
        }
      }
    };
    void report(currentState, status === 'study');
    const appSubscription = AppState.addEventListener('change', (next) => {
      if (next === 'inactive') return;
      currentState = next;
      void report(next);
    });
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      if (currentState === 'active') void report(currentState);
    });
    return () => {
      active = false;
      revision++;
      clearTimeout(retryTimer);
      appSubscription.remove();
      tokenSubscription.remove();
    };
  }, [loggedIn, loading, userId, sessionId, status]);
}
