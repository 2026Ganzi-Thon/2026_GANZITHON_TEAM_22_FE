import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, WEB_APP_MAX_WIDTH } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

// 아래에서 올라오는 시트 공통 래퍼. 뒤 배경을 누르면 닫힌다. 높이는 내용에 맞춰진다.
// @gorhom/bottom-sheet는 웹(시연 기본)에서 열리지 않아 RN Modal로 구현했다.
// TODO(animation): 끌어내려 닫기·올라오는 모션은 애니메이션 단계에서
export default function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityLabel="닫기" style={styles.dim} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.dim,
  },
  sheet: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? WEB_APP_MAX_WIDTH : undefined,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingTop: 10,
    borderTopLeftRadius: radius.tabBar,
    borderTopRightRadius: radius.tabBar,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    marginBottom: 16,
    borderRadius: 3,
    backgroundColor: '#BDBDBD',
  },
});
