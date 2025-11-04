import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';

type Step = 'email' | 'code' | 'new' | 'done';

export default function StudentPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const disabledColor = '#F3F4F6';

  const goNextFromEmail = () => {
    if (!email.includes('@')) {
      Alert.alert('확인', '학교 이메일을 입력해주세요.');
      return;
    }
    // TODO: request auth code
    setStep('code');
  };

  const goNextFromCode = () => {
    if (code.trim().length < 4) {
      Alert.alert('확인', '전송된 인증 번호를 입력해주세요.');
      return;
    }
    setStep('new');
  };

  const changePassword = () => {
    if (newPw.length < 6) {
      Alert.alert('확인', '비밀번호는 6자 이상이어야 해요.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('확인', '비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    // TODO: call update password API
    setStep('done');
  };

  const resetFlow = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPw('');
    setConfirmPw('');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="비밀번호 변경" showBack />

      <View style={styles.card}>
        {step !== 'done' && (
          <Text style={styles.stepTitle}>
            {step === 'email' && '학교 이메일을 입력해주세요'}
            {step === 'code' && '이메일로 받은 인증 번호를 입력하세요'}
            {step === 'new' && '새 비밀번호를 입력해주세요'}
          </Text>
        )}

        {step === 'email' && (
          <>
            <TextInput
              placeholder="이메일 입력"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={goNextFromEmail}>
              <Text style={styles.primaryText}>인증 번호 전송</Text>
            </Pressable>
          </>
        )}

        {step === 'code' && (
          <>
            <TextInput
              value={email}
              editable={false}
              style={[styles.input, { backgroundColor: disabledColor }]}
            />
            <TextInput
              placeholder="인증 번호 입력"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              style={styles.input}
            />
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={goNextFromCode}>
              <Text style={styles.primaryText}>확인</Text>
            </Pressable>
          </>
        )}

        {step === 'new' && (
          <>
            <TextInput
              placeholder="새 비밀번호 입력"
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
              style={styles.input}
            />
            <TextInput
              placeholder="새 비밀번호 확인"
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
              style={styles.input}
            />
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={changePassword}>
              <Text style={styles.primaryText}>확인</Text>
            </Pressable>
          </>
        )}

        {step === 'done' && (
          <View style={styles.doneCard}>
            <Text style={styles.doneText}>비밀번호가 변경되었습니다!</Text>
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={resetFlow}>
              <Text style={styles.primaryText}>확인</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  card: {
    margin: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  stepTitle: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Pretendard-Medium',
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  primaryText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.9,
  },
  doneCard: {
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  doneText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.danger,
  },
});
