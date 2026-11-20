import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import BottomSheet from '@/components/common/BottomSheet';
import Calendar from '@/components/common/Calendar';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { formatKoreanDate, formatKoreanDateTime } from '@/utils/date';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 시트 제목 (예: 마감 날짜, 언제 다시 만날까?) */
  title: string;
  /** 제목 위 작은 글자 (예: 직접 설정하기) */
  subtitle?: string;
  confirmLabel: string;
  initial?: string;
  includeTime?: boolean;
  /** 지금부터 며칠 안의 미래 시각만 고를 수 있게 한다 (다음 시작 알림은 서버 규칙상 7일) */
  maxDays?: number;
  onConfirm: (iso: string) => void;
};

const pad = (n: number) => String(n).padStart(2, '0');

// 날짜 + 시간 선택 시트 (HM-02-add 마감 날짜, ST-04 직접 설정에서 공통 사용)
export default function DateTimeSheet({ visible, onClose, ...rest }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* 열 때마다 초기값으로 다시 그리기 위해 key 변경 */}
      <Picker key={visible ? `open-${rest.initial ?? 'now'}` : 'closed'} {...rest} />
    </BottomSheet>
  );
}

function Picker({ title, subtitle, confirmLabel, initial, includeTime = true, maxDays, onConfirm }: Omit<Props, 'visible' | 'onClose'>) {
  const [now] = useState(() => new Date());
  const maxDate = maxDays ? new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000) : undefined;
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(() => (initial ? new Date(initial) : new Date()));
  const [month, setMonth] = useState(() => new Date(date.getFullYear(), date.getMonth(), 1));
  const [hourText, setHourText] = useState(pad(date.getHours() % 12 || 12));
  const [minuteText, setMinuteText] = useState(pad(date.getMinutes()));
  const [pm, setPm] = useState(date.getHours() >= 12);

  const hour12 = Math.min(Math.max(Number(hourText) || 12, 1), 12);
  const minute = Math.min(Math.max(Number(minuteText) || 0, 0), 59);
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    includeTime ? (hour12 % 12) + (pm ? 12 : 0) : 0,
    includeTime ? minute : 0,
  );

  return (
    <>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <Text style={styles.title}>{title}</Text>

      {maxDays && <Text style={styles.hint}>앞으로 {maxDays}일 안의 시간을 골라줘</Text>}
      <Calendar
        month={month}
        selected={date}
        onChangeMonth={setMonth}
        onSelect={(day) => { setDate(day); setError(null); }}
        minDate={maxDays ? now : undefined}
        maxDate={maxDate}
      />

      {includeTime && (
        <>
          <Text style={styles.label}>시간</Text>
          <View style={styles.timeRow}>
            <Pressable accessibilityRole="button" onPress={() => setPm((v) => !v)} style={styles.pill}>
              <Text style={styles.pillText}>{pm ? '오후' : '오전'}</Text>
            </Pressable>
            <TextInput
              value={hourText}
              onChangeText={setHourText}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.pill, styles.pillText, styles.input]}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              value={minuteText}
              onChangeText={setMinuteText}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.pill, styles.pillText, styles.input]}
            />
          </View>
        </>
      )}

      <View style={styles.summary}>
        <Text style={styles.pillText}>{includeTime ? formatKoreanDateTime(result.toISOString()) : formatKoreanDate(result.toISOString())}</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (maxDate && (result.getTime() <= Date.now() || result.getTime() > maxDate.getTime())) {
            setError(`지금부터 ${maxDays}일 안의 미래 시간을 골라줘.`);
            return;
          }
          onConfirm(result.toISOString());
        }}
        style={styles.confirm}
      >
        <Text style={styles.confirmText}>{confirmLabel}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: fonts.title,
    fontSize: fontSize.md,
    color: colors.textSub,
    textAlign: 'center',
  },
  title: {
    marginBottom: 16,
    fontFamily: fonts.titleBold,
    fontSize: fontSize.xl,
    letterSpacing: -1.4,
    color: colors.text,
    textAlign: 'center',
  },
  hint: {
    marginTop: -10,
    marginBottom: 10,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    marginTop: 8,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
    fontFamily: fonts.titleBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    width: 94,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    textAlign: 'center',
  },
  pillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.md,
    color: colors.textSub,
  },
  colon: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.md,
    color: colors.textSub,
  },
  summary: {
    marginTop: 9,
    height: 45,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: {
    marginTop: 7,
    height: 45,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.lg,
    letterSpacing: -1,
    color: colors.white,
  },
});
