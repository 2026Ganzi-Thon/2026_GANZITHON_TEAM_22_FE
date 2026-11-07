// 로그인 (이메일 / 비밀번호)
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/common/Button';
import { colors, fonts } from '@/constants/theme';
import AuthField from '@/features/auth/AuthField';
import AuthLayout from '@/features/auth/AuthLayout';
import { authActions } from '@/mocks/store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // TODO(API): 로그인 요청 → 토큰 저장(expo-secure-store). 지금은 바로 홈으로
  const login = () => {
    authActions.login();
    router.replace('/');
  };

  return (
    <AuthLayout>
      <AuthField label="이메일" value={email} onChangeText={setEmail} placeholder="이메일을 입력해주세요." keyboardType="email-address" />
      <AuthField label="비밀번호" value={password} onChangeText={setPassword} placeholder="비밀번호를 입력해주세요." password />
      <View style={styles.buttons}>
        <Button label="로그인" size="md" onPress={login} />
        <Button label="회원가입" size="md" variant="outline" onPress={() => router.push('/signup')} />
      </View>
      {/* TODO: 아이디·비밀번호 찾기 화면 (와이어프레임 없음) */}
      <Text style={styles.find}>아이디 · 비밀번호 찾기</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  buttons: {
    gap: 10,
    marginTop: 14,
  },
  find: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSub,
  },
});
