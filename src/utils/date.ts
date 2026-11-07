const pad = (n: number) => String(n).padStart(2, '0');

/** 10/30 23:59 */
export function formatMonthDayTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 마감까지 남은 날짜. 오늘 = D-day, 지남 = D+n */
export function formatDday(iso: string, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(iso);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((end - start) / 86_400_000);
  if (diff === 0) return 'D-day';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

/** 오늘 오후 8시 / 내일 오전 9시 30분 / 11월 2일 오후 8시 */
export function formatReminder(iso: string, now = new Date()) {
  const d = new Date(iso);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const day = sameDay(d, now) ? '오늘' : sameDay(d, tomorrow) ? '내일' : `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  const hour = d.getHours() % 12 || 12;
  const minute = d.getMinutes() ? ` ${d.getMinutes()}분` : '';
  return `${day} ${ampm} ${hour}시${minute}`;
}

/** 11월 1일 오후 08:00 */
export function formatKoreanDateTime(iso: string) {
  const d = new Date(iso);
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${pad(d.getHours() % 12 || 12)}:${pad(d.getMinutes())}`;
}

/** 2026/11/01 오후 08:00 */
export function formatFullDateTime(iso: string) {
  const d = new Date(iso);
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${ampm} ${pad(d.getHours() % 12 || 12)}:${pad(d.getMinutes())}`;
}

/** 2026.11.01 20:00 */
export function formatDotDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
