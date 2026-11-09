import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/common/Button';
import { colors, fonts, fontSize } from '@/constants/theme';

type Props = {
  message?: string;
  /** 있으면 "다시 시도" 버튼을 보여준다 */
  onRetry?: () => void;
};

// 요청이 실패했을 때 보여주는 화면. 이전 값을 성공한 것처럼 남기지 않고 이걸로 바꿔 보여준다
export default function ErrorView({ message = '잠깐 문제가 생겼어. 다시 해볼까?', onRetry }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{message}</Text>
      {onRetry && <Button label="다시 시도" size="md" variant="outline" onPress={onRetry} style={styles.button} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 32,
  },
  text: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  button: {
    paddingHorizontal: 24,
  },
});
