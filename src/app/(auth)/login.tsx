import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/common/Button';
import { colors, fonts, fontSize } from '@/constants/theme';
import AuthField from '@/features/auth/AuthField';
import AuthLayout from '@/features/auth/AuthLayout';
import { authActions } from '@/mocks/store';
import { showAlert } from '@/utils/alert';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      showAlert('로그인 정보를 입력해줘', '이메일과 비밀번호를 확인해줘.');
      return;
    }
    setLoading(true);
    try {
      await authActions.loginWithEmail(email, password);
      router.replace('/');
    } catch (error) {
      showAlert('로그인하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    } finally {
      setLoading(false);
    }
  };

  const startAsGuest = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await authActions.loginAsGuest();
      router.replace('/');
    } catch (error) {
      showAlert('시작하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        placeholder="이메일을 입력해줘"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />
      <AuthField
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        placeholder="비밀번호를 입력해줘"
        password
        autoComplete="password"
        textContentType="password"
        editable={!loading}
        onSubmitEditing={submit}
        returnKeyType="go"
      />
      <View style={styles.buttons}>
        <Button label={loading ? '로그인 중...' : '로그인'} size="md" disabled={loading} onPress={submit} />
        <Button label="게스트로 시작하기" size="md" variant="outline" disabled={loading} onPress={startAsGuest} />
      </View>
      <Pressable accessibilityRole="button" disabled={loading} onPress={() => router.push('/signup')}>
        <Text style={styles.link}>처음이야? 이메일로 가입하기</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: 10, marginTop: 8 },
  link: {
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSub,
  },
});
