// HM-02-alarm 알림 변경하기
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import DateTimeSheet from '@/components/common/DateTimeSheet';
import Icon from '@/components/common/Icon';
import SectionTitle from '@/components/common/SectionTitle';
import Header, { HeaderEdit } from '@/components/layout/Header';
import Screen from '@/components/layout/Screen';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { reminderActions, useMockStore } from '@/mocks/store';
import { formatFullDateTime } from '@/utils/date';

export default function AlarmScreen() {
  const { reminder } = useMockStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <Screen header={<Header backLabel="홈" />}>
      <View style={styles.titleRow}>
        <SectionTitle title="다시 하기 알림" />
        {reminder?.status === 'ACTIVE' && <HeaderEdit onPress={() => setSheetOpen(true)} />}
      </View>

      {reminder ? (
        <View style={styles.row}>
          <Text style={styles.time}>{formatFullDateTime(reminder.remindAt)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="알림 취소" onPress={() => reminderActions.cancel().catch((error) => Alert.alert('알림을 취소하지 못했어', error instanceof Error ? error.message : '다시 시도해줘.'))} hitSlop={8}>
            <Icon name="minusSmall" size={24} />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.empty}>예약된 알림이 없어.</Text>
      )}

      <DateTimeSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        subtitle="직접 설정하기"
        title="언제 다시 만날까?"
        confirmLabel="이 시간에 만나"
        initial={reminder?.remindAt}
        onConfirm={(iso) => {
          reminderActions.update(iso, Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul')
            .then(() => setSheetOpen(false))
            .catch((error) => Alert.alert('알림을 변경하지 못했어', error instanceof Error ? error.message : '다시 시도해줘.'));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    height: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 17,
    paddingRight: 18,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
