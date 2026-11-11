// MY-01 내 정보
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CroppedImage from '@/components/common/CroppedImage';
import ErrorView from '@/components/common/ErrorView';
import LoadingView from '@/components/common/LoadingView';
import Toggle from '@/components/common/Toggle';
import { colors, fonts, fontSize } from '@/constants/theme';
import { getMe, type MeDTO } from '@/services/backend';
import {
  cancelAllStartReminders,
  getNotificationsEnabledPreference,
  hasLocalNotificationPermission,
  requestLocalNotificationPermission,
  scheduleStartReminder,
} from '@/services/localNotifications';
import { useMockStore } from '@/mocks/store';
import { writePreference } from '@/utils/preferences';

const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const reminder = useMockStore().reminder;
  const [profile, setProfile] = useState<MeDTO | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [notify, setNotify] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      setProfile(await getMe());
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : '내 정보를 불러오지 못했어.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  useEffect(() => {
    let active = true;
    Promise.all([getNotificationsEnabledPreference(), hasLocalNotificationPermission()])
      .then(([enabled, permitted]) => {
        if (active) setNotify(enabled && permitted);
      })
      .catch(() => {
        if (active) setNotify(false);
      })
      .finally(() => {
        if (active) setNotifyLoading(false);
      });
    return () => { active = false; };
  }, []);

  const changeNotificationSetting = async (enabled: boolean) => {
    if (notifyLoading) return;
    try {
      if (enabled) {
        const granted = await requestLocalNotificationPermission();
        if (!granted) {
          Alert.alert('알림 권한이 필요해', '기기 설정에서 알림을 허용하면 공부 알림을 받을 수 있어.');
          return;
        }
        await writePreference(NOTIFICATIONS_ENABLED_KEY, true);
        if (reminder?.status === 'ACTIVE') await scheduleStartReminder(reminder.id, reminder.remindAt, false);
      } else {
        await writePreference(NOTIFICATIONS_ENABLED_KEY, false);
        await cancelAllStartReminders();
      }
      setNotify(enabled);
    } catch (error) {
      Alert.alert('알림 설정을 바꾸지 못했어', error instanceof Error ? error.message : '다시 시도해줘.');
    }
  };

  const isGuest = profile?.accountType.toUpperCase().includes('GUEST') ?? false;
  const profileName = profile?.email ?? (isGuest ? '게스트 계정' : '사용자');
  const profileDescription = profile?.email
    ? (profile.emailVerified ? '이메일 인증 완료' : '이메일 계정')
    : profile ? (isGuest ? '게스트로 사용 중' : profile.accountType) : '';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 70 }]}>
      <View style={styles.profile}>
        <Image source={require('@/assets/images/characters/profile/me.png')} style={styles.avatar} contentFit="cover" />
        {profileLoading
          ? <LoadingView message="내 정보를 불러오는 중이야..." />
          : profileError
            ? <ErrorView message={profileError} onRetry={() => { void loadProfile(); }} />
            : <>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profileName}</Text>
                </View>
                <Text style={styles.handle}>{profileDescription}</Text>
              </>}
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
        <Toggle
          value={notify}
          onChange={(value) => { void changeNotificationSetting(value); }}
          accessibilityLabel="기기 공부 알림"
          disabled={notifyLoading || Platform.OS === 'web'}
        />
      </View>
      {Platform.OS === 'web' && <Text style={styles.note}>기기 알림은 앱을 설치한 휴대폰에서 설정할 수 있어.</Text>}
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
  note: {
    marginTop: 10,
    paddingHorizontal: 30,
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
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
