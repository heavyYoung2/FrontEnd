import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import HoebiyoungLogo from '@/src/components/HoebiyoungLogo';
import { COLORS } from '@/src/design/colors';
import { useAuth } from '@/src/auth/AuthProvider';

const TEST_EMAIL = 'test@g.hongik.ac.kr';
const TEST_PASSWORD = '12345678';

export default function AuthIndexScreen() {
  const router = useRouter();
  const { login, role, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showWipAlert = () =>
    Alert.alert('준비 중입니다', '해당 기능은 곧 제공될 예정이에요.');

  const handleSignUp = () => {
    router.push('/auth/sign-up');
  };

  const handleBypass = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setEmail(TEST_EMAIL);
      setPassword(TEST_PASSWORD);
      await login({ email: TEST_EMAIL, password: TEST_PASSWORD });
      router.replace('/(student)/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : '자동 로그인에 실패했습니다.';
      Alert.alert('자동 로그인 실패', message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (loading || !role) {
      return;
    }
    router.replace('/(student)/(tabs)');
  }, [role, loading, router]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('로그인 정보 확인', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ email: email.trim(), password });
      router.replace('/(student)/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      Alert.alert('로그인 실패', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <View style={styles.logoBlock}>
            <HoebiyoungLogo />
          </View>

          <View style={styles.form}>
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="이메일을 입력해주세요."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력해주세요."
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.9 },
                  submitting && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.bg} />
                ) : (
                  <Text style={styles.primaryButtonText}>로그인</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={handleSignUp}
              >
                <Text style={styles.secondaryButtonText}>회원가입</Text>
              </Pressable>
            </View>

            <View style={styles.helperLinks}>
              <Pressable onPress={showWipAlert} hitSlop={8}>
                <Text style={styles.helperLinkText}>아이디 찾기</Text>
              </Pressable>
              <View style={styles.helperDivider} />
              <Pressable onPress={showWipAlert} hitSlop={8}>
                <Text style={styles.helperLinkText}>비밀번호 찾기</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.bypassButton,
              pressed && { opacity: 0.75 },
            ]}
            onPress={handleBypass}
          >
            <Text style={styles.bypassText}>로그인 없이 이용하기</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  logoBlock: {
    alignItems: 'center',
    marginTop: 12,
  },
  form: {
    gap: 24,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d2bb8',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
  },
  helperLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  helperDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
  },
  helperLinkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: 'Pretendard-Medium',
  },
  bypassButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  bypassText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },
});
