import { recoverExchange } from '@/services/backend';
import { ApiError } from '@/utils/api';

export function apiErrorCode(error: unknown) {
  const body = error instanceof ApiError ? error.body : null;
  return body && typeof body === 'object' && 'code' in body ? String(body.code) : '';
}

export function needsChatRecovery(error: unknown) {
  const code = apiErrorCode(error);
  if (code === 'CHAT_NOT_CONFIGURED') return false;
  return !(error instanceof ApiError) || error.status === 0 || error.status >= 500
    || code === 'REQUEST_IN_PROGRESS';
}

/** GET only. An unknown result must never trigger a new model request. */
export async function pollExchange(clientRequestId: string, signal: AbortSignal) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  const deadline = Date.now() + 35_000;
  const timeout = setTimeout(cancel, 35_000);
  try {
    while (!controller.signal.aborted && Date.now() < deadline) {
      try {
        const result = await recoverExchange(clientRequestId, controller.signal);
        if (result && (result.status === 'SUCCEEDED' || result.status === 'FAILED')) return result;
      } catch (error) {
        if (error instanceof ApiError && error.body && typeof error.body === 'object'
          && 'retryable' in error.body && error.body.retryable === false) throw error;
        if (error instanceof ApiError && error.status !== 0 && error.status < 500 && error.status !== 429) throw error;
      }
      if (controller.signal.aborted) break;
      await new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(timer);
          controller.signal.removeEventListener('abort', done);
          resolve();
        };
        const timer = setTimeout(done, Math.min(4_000, Math.max(0, deadline - Date.now())));
        controller.signal.addEventListener('abort', done, { once: true });
      });
    }
    return null;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}
