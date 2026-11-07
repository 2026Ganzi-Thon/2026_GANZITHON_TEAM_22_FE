import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/common/Icon';
import { colors, fonts, radius } from '@/constants/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CELL = 42;

type Props = {
  /** 보고 있는 달 (1일) */
  month: Date;
  selected: Date;
  onChangeMonth: (month: Date) => void;
  onSelect: (day: Date) => void;
};

// 월요일 시작 달력. 이전·다음 달 날짜는 흐리게
function buildCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // 월요일 = 0
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const weeks = Math.ceil((offset + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function Calendar({ month, selected, onChangeMonth, onSelect }: Props) {
  const cells = buildCells(month);
  const move = (diff: number) => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + diff, 1));

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.monthLabel}>
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </Text>
        <View style={styles.arrows}>
          <Pressable accessibilityLabel="이전 달" onPress={() => move(-1)} hitSlop={8}>
            <Icon name="back" size={20} style={styles.prev} />
          </Pressable>
          <Pressable accessibilityLabel="다음 달" onPress={() => move(1)} hitSlop={8}>
            <Icon name="back" size={20} />
          </Pressable>
        </View>
      </View>
      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={[styles.cell, styles.cellText]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const isSelected = sameDay(d, selected);
          return (
            <Pressable key={d.toISOString()} onPress={() => onSelect(d)} style={styles.cell}>
              <View style={[styles.dayCircle, isSelected && styles.selected]}>
                <Text style={[styles.cellText, !inMonth && styles.outside, isSelected && styles.selectedText]}>
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'center',
    width: CELL * 7 + 42,
    paddingHorizontal: 21,
    paddingBottom: 10,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSub,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  monthLabel: {
    fontFamily: fonts.titleBold,
    fontSize: 22,
    color: colors.text,
  },
  arrows: {
    flexDirection: 'row',
    gap: 14,
  },
  prev: {
    transform: [{ rotate: '180deg' }],
  },
  row: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    lineHeight: CELL,
  },
  cellText: {
    fontFamily: fonts.title,
    fontSize: 20,
    color: colors.text,
  },
  dayCircle: {
    width: CELL - 4,
    height: CELL - 4,
    borderRadius: (CELL - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outside: {
    opacity: 0.4,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  selectedText: {
    color: '#FBF6F6',
  },
});
