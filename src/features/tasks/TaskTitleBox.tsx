import { StyleSheet, Text, View } from 'react-native';

import Badge from '@/components/common/Badge';
import { colors, fonts, radius } from '@/constants/theme';
import { formatDday } from '@/utils/date';

// 상세 화면 큰 할 일 이름 칸 (+ 마감 있으면 D-day)
export default function TaskTitleBox({ title, dueAt }: { title: string; dueAt?: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {dueAt && <Badge label={formatDday(dueAt)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 17,
    paddingRight: 20,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
  },
  title: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 24,
    color: colors.text,
  },
});
