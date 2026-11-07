import { StyleSheet, Text } from 'react-native';

import BottomSheet from '@/components/common/BottomSheet';
import Button from '@/components/common/Button';
import { colors, fonts, fontSize } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLater: () => void;
  onDoneToday: () => void;
};

// ST-03-exit 나가기 선택. 문구는 와이어프레임 기준
export default function ExitSheet({ visible, onClose, onLater, onDoneToday }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>잠깐 나갈까?</Text>
      <Button label="이따 다시 하자" size="md" variant="outline" onPress={onLater} style={styles.gap} />
      <Button label="오늘은 그만 하자" size="md" variant="outline" onPress={onDoneToday} style={styles.gap} />
      <Button label="계속하자" size="md" onPress={onClose} style={styles.gap} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 8,
    fontFamily: fonts.titleBold,
    fontSize: fontSize.xl,
    letterSpacing: -1.4,
    color: colors.text,
  },
  gap: {
    marginTop: 10,
  },
});
