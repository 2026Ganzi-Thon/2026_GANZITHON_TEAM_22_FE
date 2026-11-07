import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';

import TabItem from '@/components/layout/TabItem';
import { TABS } from '@/constants/tabs';
import { colors, radius, spacing } from '@/constants/theme';

// 피그마 HM-01 하단바: 위쪽만 둥근 흰 판 + 아이콘 4개
export default function BottomTabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  return (
    // 바깥 View: 둥근 모서리 뒤로 화면 배경색이 보이게
    <View style={styles.backdrop}>
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        return (
          <TabItem
            key={route.key}
            label={tab.label}
            icon={tab.icon}
            crop={tab.crop}
            focused={state.index === index}
            onPress={() => navigateToTab(route.key)}
          />
        );
      })}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    paddingTop: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.tabBar,
    borderTopRightRadius: radius.tabBar,
  },
});
