import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/common/Button';
import { colors, fonts, fontSize } from '@/constants/theme';
import AgreeCheck from '@/features/auth/AgreeCheck';
import AuthField from '@/features/auth/AuthField';
import AuthLayout from '@/features/auth/AuthLayout';
import { authActions } from '@/mocks/store';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      Alert.alert('가입 정보를 입력해줘', '이메일과 비밀번호를 확인해줘.');
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      Alert.alert('약관 동의가 필요해', '이용약관과 개인정보 수집 및 이용에 동의해줘.');
      return;
    }
    setLoading(true);
    try {
      await authActions.registerWithEmail(email, password);
      Alert.alert('가입했어', '이메일 인증은 아직 제공되지 않아. 바로 시작할 수 있어.');
      router.replace('/');
    } catch (error) {
      Alert.alert('가입하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>이메일로 가입하기</Text>
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
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        onSubmitEditing={submit}
        returnKeyType="go"
      />
      <View style={styles.agreements}>
        <AgreeCheck label="[필수] 이용약관 동의" checked={termsAccepted} onChange={setTermsAccepted} />
        <AgreeCheck label="[필수] 개인정보 수집 및 이용 동의" checked={privacyAccepted} onChange={setPrivacyAccepted} />
      </View>
      <Text style={styles.note}>가입 후 이메일 인증은 아직 제공되지 않아.</Text>
      <Button
        label={loading ? '가입 중...' : '가입하고 시작하기'}
        size="md"
        disabled={loading || !termsAccepted || !privacyAccepted}
        onPress={submit}
      />
      <Pressable accessibilityRole="button" disabled={loading} onPress={() => router.replace('/login')}>
        <Text style={styles.link}>이미 계정이 있어? 로그인</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 4, fontFamily: fonts.titleBold, fontSize: fontSize.lg, color: colors.text },
  agreements: { gap: 8, marginVertical: 6 },
  note: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textSub },
  link: {
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSub,
  },
});
