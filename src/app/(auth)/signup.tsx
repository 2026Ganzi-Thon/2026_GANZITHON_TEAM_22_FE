// 회원가입 (이메일 / 비밀번호)
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Button from '@/components/common/Button';
import AgreeCheck from '@/features/auth/AgreeCheck';
import AuthField from '@/features/auth/AuthField';
import AuthLayout from '@/features/auth/AuthLayout';
import { authActions } from '@/mocks/store';

export default function SignupScreen() {
  const [form, setForm] = useState({ nickname: '', email: '', password: '' });
  const [agree, setAgree] = useState({ terms: false, privacy: false });
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const canSubmit = agree.terms && agree.privacy;

  // TODO(API): 회원가입 요청 (입력값 검증·에러 문구는 API 담당과 맞추기)
  const submit = () => {
    authActions.login();
    router.replace('/');
  };

  return (
    <AuthLayout>
      <AuthField label="닉네임" value={form.nickname} onChangeText={set('nickname')} placeholder="이모양즈가 불러줄 이름" />
      <AuthField label="이메일" value={form.email} onChangeText={set('email')} placeholder="이메일을 입력해주세요." keyboardType="email-address" />
      <AuthField label="비밀번호" value={form.password} onChangeText={set('password')} placeholder="비밀번호를 입력해주세요." password />
      <View style={styles.agree}>
        <AgreeCheck label="[필수] 이용약관 동의" checked={agree.terms} onChange={(terms) => setAgree((a) => ({ ...a, terms }))} />
        <AgreeCheck label="[필수] 개인정보 수집 및 이용 동의" checked={agree.privacy} onChange={(privacy) => setAgree((a) => ({ ...a, privacy }))} />
      </View>
      <Button label="가입하고 시작하기" size="md" disabled={!canSubmit} onPress={submit} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  agree: {
    gap: 8,
    marginVertical: 8,
  },
});
