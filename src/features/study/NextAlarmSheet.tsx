import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import BottomSheet from '@/components/common/BottomSheet';
import Button from '@/components/common/Button';
import { colors, fonts, fontSize, radius } from '@/constants/theme';

const PRESETS = [
  { label: '30분 뒤', minutes: 30 },
  { label: '1시간 뒤', minutes: 60 },
  { label: '3시간 뒤', minutes: 180 },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 직접 설정할게 → 날짜·시간 시트 */
  onCustom: () => void;
  /** 알림 시각(ISO) 또는 알림 없이 나가기(null) */
  onExit: (remindAt: string | null) => void;
};

// ST-04 다음 시작 알림 (이따 다시 하자 다음)
export default function NextAlarmSheet({ visible, onClose, onCustom, onExit }: Props) {
  const [minutes, setMinutes] = useState<number>();

  const save = () => {
    if (!minutes) return;
    onExit(new Date(Date.now() + minutes * 60_000).toISOString());
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>언제 다시 만날까?</Text>
      {PRESETS.map((p) => {
        const selected = minutes === p.minutes;
        return (
          <Pressable
            key={p.minutes}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setMinutes(p.minutes)}
            style={[styles.option, selected && styles.optionOn]}>
            <Text style={[styles.optionText, selected && styles.optionTextOn]}>{p.label}</Text>
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" onPress={onCustom} style={styles.option}>
        <Text style={styles.optionText}>직접 설정할게 ›</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onExit(null)} style={styles.option}>
        <Text style={styles.optionText}>알림 없이 나갈게</Text>
      </Pressable>
      <Button label="저장하고 나갈게" size="md" disabled={!minutes} onPress={save} style={styles.save} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 6,
    fontFamily: fonts.titleBold,
    fontSize: fontSize.xl,
    letterSpacing: -1.4,
    color: colors.text,
  },
  option: {
    marginTop: 8,
    height: 42,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionOn: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontFamily: fonts.titleBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  optionTextOn: {
    color: colors.white,
  },
  save: {
    marginTop: 12,
  },
});
