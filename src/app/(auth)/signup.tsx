import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/common/Button';
import { colors, fonts, fontSize } from '@/constants/theme';
import AgreeCheck from '@/features/auth/AgreeCheck';
import AuthField from '@/features/auth/AuthField';
import AuthLayout from '@/features/auth/AuthLayout';
import { authActions } from '@/mocks/store';
import { showAlert } from '@/utils/alert';

const MIN_PASSWORD_LENGTH = 15;
const MAX_PASSWORD_LENGTH = 128;

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    const address = email.trim().toLowerCase();
    if (address.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(address)
      || address.startsWith('.') || address.includes('..') || address.includes('.@')) {
      showAlert('이메일을 확인해줘', '이메일을 올바른 형식으로 입력해줘.');
      return;
    }
    const passwordLength = Array.from(password).length;
    if (passwordLength < MIN_PASSWORD_LENGTH || passwordLength > MAX_PASSWORD_LENGTH) {
      showAlert('비밀번호를 확인해줘', `비밀번호는 ${MIN_PASSWORD_LENGTH}~${MAX_PASSWORD_LENGTH}자로 입력해줘.`);
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      showAlert('약관 동의가 필요해', '이용약관과 개인정보 수집 및 이용에 동의해줘.');
      return;
    }
    setLoading(true);
    try {
      await authActions.registerWithEmail(address, password);
      showAlert('가입했어', '이메일 인증은 아직 제공되지 않아. 바로 시작할 수 있어.');
      router.replace('/');
    } catch (error) {
      showAlert('가입하지 못했어', error instanceof Error ? error.message : '잠시 후 다시 시도해줘.');
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
      <Text style={styles.note}>비밀번호는 {MIN_PASSWORD_LENGTH}~{MAX_PASSWORD_LENGTH}자로 입력해줘.</Text>
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
