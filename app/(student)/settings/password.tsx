import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';
import { changePassword } from '@/src/api/auth';
import { useAuth } from '@/src/auth/AuthProvider';

type Step = 'form' | 'done';
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).{8,}$/;

export default function StudentPasswordScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [originPw, setOriginPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOrigin, setShowOrigin] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordGuide = useMemo(
    () => '8자 이상, 영문/숫자/특수문자 각각 1개 이상 포함',
    [],
  );

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    const resMessage =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response?.data?.message === 'string'
        ? (error as any).response.data.message
        : null;
    if (resMessage) return resMessage;
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }, []);

  const handleChangePassword = async () => {
    if (!originPw.trim()) {
      Alert.alert('확인', '기존 비밀번호를 입력해주세요.');
      return;
    }
    if (!PASSWORD_REGEX.test(newPw)) {
      Alert.alert('확인', '비밀번호는 8자 이상이며, 영문/숫자/특수문자를 최소 1개씩 포함해야 합니다.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('확인', '새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setSubmitting(true);
      await changePassword({
        originPassword: originPw,
        newPassword: newPw,
        newPasswordConfirm: confirmPw,
      });
      try {
        await logout();
      } catch (logoutErr) {
        console.warn('[password] logout after change failed', logoutErr);
      }
      router.replace('/auth');
    } catch (error) {
      const message = getErrorMessage(error, '비밀번호 변경에 실패했습니다.');
      Alert.alert('실패', message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep('form');
    setOriginPw('');
    setNewPw('');
    setConfirmPw('');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="비밀번호 변경" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.card}>
          {step !== 'done' && (
            <View style={{ gap: 6 }}>
              <Text style={styles.stepTitle}>현재 비밀번호와 새 비밀번호를 입력해주세요</Text>
              <Text style={styles.helper}>{passwordGuide}</Text>
            </View>
          )}

          {step === 'form' && (
            <>
              <Text style={styles.label}>현재 비밀번호</Text>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="현재 비밀번호 입력"
                  secureTextEntry={!showOrigin}
                  value={originPw}
                  onChangeText={setOriginPw}
                  style={styles.inputField}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable hitSlop={10} onPress={() => setShowOrigin((v) => !v)}>
                  <Ionicons
                    name={showOrigin ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>새 비밀번호</Text>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="새 비밀번호 입력"
                  secureTextEntry={!showNew}
                  value={newPw}
                  onChangeText={setNewPw}
                  style={styles.inputField}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable hitSlop={10} onPress={() => setShowNew((v) => !v)}>
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="새 비밀번호 확인"
                  secureTextEntry={!showConfirm}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  style={styles.inputField}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable hitSlop={10} onPress={() => setShowConfirm((v) => !v)}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  submitting && styles.disabledBtn,
                ]}
                onPress={handleChangePassword}
                disabled={submitting}
              >
                <Text style={styles.primaryText}>{submitting ? '변경 중...' : '변경하기'}</Text>
              </Pressable>
            </>
          )}

          {step === 'done' && (
            <View style={styles.doneCard}>
              <Text style={styles.doneText}>비밀번호가 변경되었습니다!</Text>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={resetFlow}
              >
                <Text style={styles.primaryText}>확인</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
  helper: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  label: {
    ...TYPO.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 4,
    fontFamily: 'Pretendard-Medium',
    fontSize: 15,
    color: COLORS.text,
  },
  primaryBtn: {
    marginTop: 8,
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
  disabledBtn: {
    opacity: 0.7,
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
