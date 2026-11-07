import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import CheckCircle from '@/components/common/CheckCircle';
import Icon from '@/components/common/Icon';
import { colors, fonts, fontSize, radius } from '@/constants/theme';

type Props = {
  title: string;
  done: boolean;
  onToggle?: () => void;
  /** 수정 모드: 글자 입력 + 오른쪽 – 버튼 */
  editable?: boolean;
  placeholder?: string;
  onChangeTitle?: (text: string) => void;
  onRemove?: () => void;
};

// 세부 할 일 한 줄 (자세히 보기 / 수정 / 스터디룸 지금 하는 일 공용)
export default function SubtaskRow({ title, done, onToggle, editable, placeholder, onChangeTitle, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <CheckCircle checked={done} onPress={onToggle} />
      {editable ? (
        <TextInput
          value={title}
          onChangeText={onChangeTitle}
          placeholder={placeholder}
          placeholderTextColor={colors.textSub}
          style={[styles.title, styles.input]}
        />
      ) : (
        <Text style={[styles.title, done && styles.done]}>{title}</Text>
      )}
      {editable && onRemove && (
        <Pressable accessibilityRole="button" accessibilityLabel="세부 할 일 삭제" onPress={onRemove} hitSlop={8}>
          <Icon name="minusSmall" size={24} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 17,
    paddingRight: 18,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSub,
  },
  title: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  input: {
    paddingVertical: 12,
  },
  done: {
    textDecorationLine: 'line-through',
  },
});
