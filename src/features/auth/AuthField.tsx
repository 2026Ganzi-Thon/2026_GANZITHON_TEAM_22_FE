import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInputProps } from 'react-native';

import TextField from '@/components/common/TextField';
import { colors, fonts, fontSize } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  /** 비밀번호 칸: 오른쪽 보기 버튼 */
  password?: boolean;
};

// 로그인·회원가입 입력칸 (제목 + 입력)
export default function AuthField({ label, password, style, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View>
        <TextField
          autoCapitalize="none"
          secureTextEntry={password && !visible}
          style={[styles.input, password && styles.withEye, style]}
          {...props}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
            onPress={() => setVisible((v) => !v)}
            style={styles.eye}>
            <Text style={styles.eyeText}>{visible ? '숨김' : '보기'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.text,
  },
  input: {
    height: 44,
    fontSize: fontSize.sm,
  },
  withEye: {
    paddingRight: 56,
  },
  eye: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
