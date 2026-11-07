import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';

// 스터디룸 4번째 칸 "나의 공간" (명세 카메라 정책)
// - 기본 OFF, "카메라 켜기" 버튼을 누를 때만 권한 요청
// - 거절해도 스터디룸은 그대로 이용 가능
// - 미리보기만 하고 저장·전송하지 않는다. 나가면 화면이 사라지며 카메라도 꺼진다
export default function MyTile() {
  const [permission, requestPermission] = useCameraPermissions();
  const [on, setOn] = useState(false);
  const [denied, setDenied] = useState(false);

  // 앱에서 한 번 거절해서 다시 물어볼 수 없으면 설정 앱으로 안내
  const blocked = denied && permission?.canAskAgain === false && Platform.OS !== 'web';

  const turnOn = async () => {
    if (blocked) return Linking.openSettings();
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return setDenied(true);
    }
    setDenied(false);
    setOn(true);
  };

  return (
    <View style={styles.tile}>
      {on ? (
        <>
          <CameraView style={StyleSheet.absoluteFill} facing="front" mirror />
          <Pressable accessibilityRole="button" onPress={() => setOn(false)} style={styles.offBadge}>
            <Text style={styles.offText}>카메라 끄기</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.center}>
          <Image source={require('@/assets/images/icons/etc/camera-off.svg')} style={styles.icon} contentFit="contain" />
          <Text style={styles.text}>카메라가 꺼져있어요</Text>
          <Pressable accessibilityRole="button" onPress={turnOn} style={styles.onButton}>
            <Text style={styles.onText}>{blocked ? '설정에서 허용하기' : '카메라 켜기'}</Text>
          </Pressable>
          {denied && <Text style={styles.hint}>카메라 없이도 같이 공부할 수 있어요</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.container,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 57,
    height: 57,
  },
  text: {
    fontFamily: fonts.title,
    fontSize: fontSize.md,
    color: colors.text,
  },
  onButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
  },
  onText: {
    fontFamily: fonts.titleBold,
    fontSize: 13,
    color: colors.surface,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  offBadge: {
    position: 'absolute',
    left: 7,
    bottom: 8,
    height: 33,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: radius.container,
    backgroundColor: colors.overlay,
  },
  offText: {
    fontFamily: fonts.titleBold,
    fontSize: 14,
    color: colors.surface,
  },
});
