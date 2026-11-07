import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';

type Props = {
  visible: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// 가운데 확인창 (예: 할 일을 삭제해볼까? 예 / 아니오)
export default function ConfirmDialog({
  visible,
  message,
  confirmLabel = '예',
  cancelLabel = '아니오',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.dim} onPress={onCancel}>
        <Pressable style={styles.box}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.button}>
              <Text style={styles.buttonLabel}>{confirmLabel}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.button}>
              <Text style={styles.buttonLabel}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
  box: {
    width: '100%',
    maxWidth: 369,
    paddingTop: 29,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  message: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.xl,
    lineHeight: 35,
    letterSpacing: -1.4,
    color: colors.text,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    height: 61,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.lg,
    letterSpacing: -1,
    color: colors.textSub,
  },
});
