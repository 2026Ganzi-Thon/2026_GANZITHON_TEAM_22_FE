// CH-01 감정콩 대화 (양 TALK)
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CroppedImage from '@/components/common/CroppedImage';
import type { CharacterId } from '@/constants/characters';
import { colors, fonts } from '@/constants/theme';
import ChatRoom from '@/features/chat/ChatRoom';
import FriendToggleMenu from '@/features/chat/FriendToggleMenu';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  // TODO(API): 대화할 친구 설정 저장 (단체 대화방·스터디룸 대화 공통)
  const [enabled, setEnabled] = useState<Record<CharacterId, boolean>>({ angry: true, sad: true, joy: true });

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>양 TALK</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="대화할 친구" onPress={() => setMenuOpen((v) => !v)}>
          <CroppedImage
            source={require('@/assets/images/icons/etc/friends.png')}
            width={40}
            height={34}
            crop={{ width: '100%', height: '125%', left: '0%', top: '0%' }}
          />
        </Pressable>
        {menuOpen && (
          <FriendToggleMenu enabled={enabled} onToggle={(id) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))} />
        )}
      </View>
      <ChatRoom />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 6,
  },
  title: {
    fontFamily: fonts.titleBold,
    fontSize: 24,
    color: colors.text,
  },
});
