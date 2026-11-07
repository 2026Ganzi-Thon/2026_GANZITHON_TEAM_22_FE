import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import type { TabCrop } from '@/constants/tabs';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

type Props = {
  label: string;
  icon: ImageSource;
  crop: TabCrop;
  focused: boolean;
  onPress: () => void;
};

export default function TabItem({ label, icon, crop, focused, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={styles.item}>
      <View style={styles.iconBox}>
        {/* 선택된 탭은 뒤에 노란 빛 */}
        {focused && <View style={styles.glow} />}
        <View style={styles.iconClip}>
          <View
            style={{
              position: 'absolute',
              width: crop.width as DimensionValue,
              height: crop.height as DimensionValue,
              left: crop.left as DimensionValue,
              top: crop.top as DimensionValue,
            }}>
            <Image source={icon} contentFit="fill" style={styles.iconImage} />
          </View>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: 70,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBox: {
    width: 70,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tabGlow,
    opacity: 0.35,
    shadowColor: colors.tabGlow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  iconClip: {
    width: 70,
    height: 52,
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontFamily: fonts.title,
    fontSize: fontSize.sm,
    color: colors.text,
  },
});
