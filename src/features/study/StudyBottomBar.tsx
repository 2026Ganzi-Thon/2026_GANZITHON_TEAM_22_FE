import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CroppedImage, { type Crop } from '@/components/common/CroppedImage';
import { colors, fonts, radius } from '@/constants/theme';

const ITEMS = [
  { key: 'todo', label: '할 일', icon: require('@/assets/images/icons/study/todo.png'), crop: { width: '100%', height: '134.57%', left: '0%', top: '0%' } },
  { key: 'chat', label: '대화', icon: require('@/assets/images/icons/study/chat.png'), crop: { width: '100%', height: '130.64%', left: '0%', top: '0%' } },
  { key: 'exit', label: '나가기', icon: require('@/assets/images/icons/study/exit.png'), crop: { width: '100%', height: '134.91%', left: '8.8%', top: '0%' } },
] as const;

type Props = {
  onPress: (key: (typeof ITEMS)[number]['key']) => void;
};

// 스터디룸 하단 3버튼: 할 일 / 대화 / 나가기
export default function StudyBottomBar({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      {ITEMS.map((item) => (
        <Pressable key={item.key} accessibilityRole="button" onPress={() => onPress(item.key)} style={styles.item}>
          <CroppedImage source={item.icon} width={80} height={60} crop={item.crop as Crop} />
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 46,
    paddingTop: 18,
    borderTopLeftRadius: radius.tabBar,
    borderTopRightRadius: radius.tabBar,
    backgroundColor: colors.surface,
  },
  item: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.title,
    fontSize: 14,
    color: colors.text,
  },
});
