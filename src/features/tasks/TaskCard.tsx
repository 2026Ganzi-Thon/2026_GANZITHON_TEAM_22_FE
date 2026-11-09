import { Pressable, StyleSheet, Text, View } from 'react-native';

import Badge from '@/components/common/Badge';
import CheckCircle from '@/components/common/CheckCircle';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { isDone, type Task } from '@/types/task';
import { formatDday, formatMonthDayTime } from '@/utils/date';

type Props = {
  task: Task;
  onToggle: () => void;
  onPress: () => void;
};

// 제목 아래 문구: 마감일 → 미완료 세부 할 일 첫 번째 → 없음 (docs/screens.md HM-01)
function getSubText(task: Task) {
  if (task.dueAt) return formatMonthDayTime(task.dueAt);
  return task.subtasks.find((s) => !isDone(s))?.title;
}

// 할 일 카드 (HM-01, TK-01 공용). 동그라미 = 완료 토글, 나머지 영역 = 상세 이동
export default function TaskCard({ task, onToggle, onPress }: Props) {
  const subText = getSubText(task);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <CheckCircle checked={isDone(task)} onPress={onToggle} />
      <View style={styles.texts}>
        <Text style={[styles.title, isDone(task) && styles.doneText]} numberOfLines={1}>
          {task.title}
        </Text>
        {subText && (
          <Text style={[styles.sub, isDone(task) && styles.doneText]} numberOfLines={1}>
            {subText}
          </Text>
        )}
      </View>
      {task.dueAt && !isDone(task) && <Badge label={formatDday(task.dueAt)} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
    paddingLeft: 17,
    paddingRight: 26,
    paddingVertical: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  sub: {
    marginLeft: 3,
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textSub,
  },
  doneText: {
    textDecorationLine: 'line-through',
  },
});
