import { Pressable, StyleSheet } from 'react-native';

import Icon from '@/components/common/Icon';
import { colors } from '@/constants/theme';

// 점선 + 버튼 (세부 할 일 추가)
export default function DashedAddButton({ onPress, label = '추가' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}>
      <Icon name="plusSmall" size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 13,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
