import { readPreference, writePreference } from '@/utils/preferences';

export type ReminderDraft = { sessionId: string; remindAt: string; timeZone: string };
const key = (userId: string) => `pendingReminder.${userId}`;
export const readReminderDraft = (userId: string) => readPreference<ReminderDraft | null>(key(userId), null);
export const saveReminderDraft = (userId: string, draft: ReminderDraft | null) => writePreference(key(userId), draft);
