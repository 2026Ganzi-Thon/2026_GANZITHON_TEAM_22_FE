import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/common/Icon';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { goBack } from '@/utils/navigation';

type Props = {
  /** 뒤로가기 옆 글자 (예: 홈, 스터디룸) */
  backLabel: string;
  onBack?: () => void;
  /** 오른쪽 영역 (HeaderAction, 연필 등) */
  right?: ReactNode;
};

// 상세·수정 화면 공통 헤더: < 이전 화면 ……… 오른쪽 액션
export default function Header({ backLabel, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Pressable accessibilityRole="button" onPress={() => (onBack ? onBack() : goBack())} style={styles.back} hitSlop={8}>
        <Icon name="back" size={30} style={styles.backIcon} />
        <Text style={styles.backLabel}>{backLabel}</Text>
      </Pressable>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

// 헤더 오른쪽 코랄 버튼 (완료 / 삭제)
export function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

// 헤더 연필 버튼
export function HeaderEdit({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="수정" onPress={onPress} hitSlop={8}>
      <Icon name="pencil" size={29} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 24,
    paddingBottom: 8,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  backLabel: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  action: {
    height: 41,
    minWidth: 73,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.lg,
    color: colors.surface,
  },
});
