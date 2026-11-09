// TK-01 할 일 목록 (진행 중 / 완료 탭)
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/common/Icon';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import TaskCard from '@/features/tasks/TaskCard';
import { taskActions, useMockStore } from '@/mocks/store';
import { isDone } from '@/types/task';

type Tab = 'doing' | 'done';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useMockStore();
  const [tab, setTab] = useState<Tab>('doing');
  // TODO(API): 탭별 목록 조회. 순서 변경(길게 눌러 위아래)은 기능 구현 때 추가
  const list = tasks.filter((t) => (tab === 'done' ? isDone(t) : !isDone(t)));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>나의 할 일</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="할 일 추가" onPress={() => router.push('/task/new')} style={styles.add}>
          <Icon name="plus" size={20} />
        </Pressable>
      </View>

      <View style={styles.box}>
        <View style={styles.tabs}>
          {(['doing', 'done'] as const).map((t) => (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={styles.tab}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'doing' ? '진행 중' : '완료'}</Text>
              {tab === t && <View style={styles.underline} />}
            </Pressable>
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {list.length === 0 ? (
            <Text style={styles.empty}>{tab === 'done' ? '아직 완료한 할 일이 없어.' : '할 일이 없어도 같이 시작할 수 있어!'}</Text>
          ) : (
            list.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => taskActions.toggle(task.id)}
                onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  title: {
    fontFamily: fonts.titleBold,
    fontSize: 40,
    letterSpacing: -2,
    color: colors.text,
  },
  add: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    flex: 1,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: radius.container,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  tabTextOn: {
    color: colors.primary,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    width: 70,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  list: {
    gap: 12,
    padding: 22,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
