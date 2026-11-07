// ST-01 함께 시작하기
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { studyActions } from '@/hooks/useStudySession';
import { useMockStore } from '@/mocks/store';
import { formatDday, formatMonthDayTime } from '@/utils/date';

export default function StudyStartScreen() {
  const insets = useSafeAreaInsets();
  // TODO(API): 미완료 할 일 목록 조회
  const tasks = useMockStore().tasks.filter((t) => !t.done);
  const [selectedId, setSelectedId] = useState<string>();

  // 할 일 선택 없이도 시작할 수 있다 (명세 ST-01)
  const start = (taskId?: string) => {
    studyActions.start(taskId);
    router.replace('/study');
  };

  return (
    <View style={styles.screen}>
      <Image source={require('@/assets/images/backgrounds/home-hero.png')} style={styles.hero} contentFit="cover" />
      <View style={[styles.heroText, { top: Math.max(insets.top, 70) }]}>
        {/* 홈(HM-01)과 같은 haebo 로고 */}
        <Image source={require('@/assets/images/logo/haebo-wordmark.svg')} style={styles.logo} contentFit="contain" />
        <Text style={styles.subtitle}>{'일단 펼쳐볼까?\n우리도 같이 할게'}</Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.sheetTitle}>뭐부터 같이 할까?</Text>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {tasks.map((task) => {
            const selected = selectedId === task.id;
            return (
              <Pressable
                key={task.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setSelectedId(selected ? undefined : task.id)}
                style={styles.item}>
                <View style={[styles.radio, selected && styles.radioOn]} />
                <View style={styles.itemTexts}>
                  <Text style={styles.itemTitle}>{task.title}</Text>
                  {task.dueAt && <Text style={styles.itemSub}>{formatMonthDayTime(task.dueAt)}</Text>}
                </View>
                {task.dueAt && <Badge label={formatDday(task.dueAt)} />}
              </Pressable>
            );
          })}
        </ScrollView>
        <Button label="바로 시작하자!" size="md" disabled={!selectedId} onPress={() => start(selectedId)} />
        <Button label="선택 없이 시작하자!" size="md" variant="outline" onPress={() => start()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 475,
  },
  heroText: {
    position: 'absolute',
    left: 16,
  },
  logo: {
    width: 148,
    height: 54,
  },
  subtitle: {
    marginTop: 6,
    marginLeft: 8,
    fontFamily: fonts.title,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sheet: {
    marginTop: 'auto',
    maxHeight: '60%',
    gap: 10,
    paddingTop: 24,
    paddingHorizontal: 22,
    borderTopLeftRadius: radius.tabBar,
    borderTopRightRadius: radius.tabBar,
    backgroundColor: colors.surface,
  },
  sheetTitle: {
    marginLeft: 8,
    fontFamily: fonts.titleBold,
    fontSize: 24,
    letterSpacing: -1.2,
    color: colors.text,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 10,
    paddingBottom: 6,
  },
  item: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  radioOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  itemTexts: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  itemSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs - 1,
    color: colors.textSub,
  },
});
