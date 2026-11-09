// MY-01 내 정보
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CroppedImage from '@/components/common/CroppedImage';
import Toggle from '@/components/common/Toggle';
import { colors, fonts, fontSize } from '@/constants/theme';
import { MOCK_ME as ME } from '@/mocks/me';

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  // TODO(API): 전체 알림 ON/OFF 저장 + 알림 권한 요청
  const [notify, setNotify] = useState(false);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 70 }]}>
      <View style={styles.profile}>
        <Image source={require('@/assets/images/characters/profile/me.png')} style={styles.avatar} contentFit="cover" />
        {/* TODO: 닉네임 누르면 프로필·계정 화면 (와이어프레임 없음) */}
        <Pressable style={styles.nameRow}>
          <Text style={styles.name}>{ME.nickname}님</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Text style={styles.handle}>{ME.handle}</Text>
      </View>

      <View style={styles.setting}>
        <CroppedImage
          source={require('@/assets/images/icons/etc/bell.png')}
          width={26}
          height={26}
          crop={{ width: '100%', height: '125%', left: '0%', top: '0%' }}
        />
        <Text style={styles.settingLabel}>알림 설정</Text>
        <View style={styles.spacer} />
        <Toggle value={notify} onChange={setNotify} accessibilityLabel="알림 설정" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profile: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 30,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.text,
  },
  chevron: {
    fontFamily: fonts.body,
    fontSize: 20,
    color: colors.text,
  },
  handle: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
  },
  setting: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 30,
    backgroundColor: colors.surfaceSub,
  },
  settingLabel: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  spacer: {
    flex: 1,
  },
});
