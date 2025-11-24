import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Linking,
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
import { Ionicons } from '@expo/vector-icons';
import HoebiyoungLogo from '@/src/components/HoebiyoungLogo';
import { COLORS } from '@/src/design/colors';
import { useAuth } from '@/src/auth/AuthProvider';

const TEST_EMAIL = 'heavyyoung@g.hongik.ac.kr';
const TEST_PASSWORD = 'a12345678@';
const EMAIL_FIND_URL = 'https://it.hongik.ac.kr/it/board/0102.do';

export default function AuthIndexScreen() {
  const router = useRouter();
  const { login, role, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const toastAnim = useRef(new Animated.Value(0));
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSignUp = () => {
    router.push('/auth/sign-up');
  };

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

  const handleFindEmail = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(EMAIL_FIND_URL);
      if (!supported) {
        showToast('링크를 열 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      await Linking.openURL(EMAIL_FIND_URL);
    } catch (error) {
      showToast('링크를 열 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [showToast]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastAnim.current.setValue(0);
    setToast(message);
    Animated.timing(toastAnim.current, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim.current, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setToast(null);
        });
      }, 2200);
    });
  }, []);

  const handleBypass = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setEmail(TEST_EMAIL);
      setPassword(TEST_PASSWORD);
      await login({ email: TEST_EMAIL, password: TEST_PASSWORD });
      router.replace('/(student)/(tabs)');
    } catch (error) {
      const message = getErrorMessage(error, '자동 로그인에 실패했습니다.');
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    router.push('/auth/temp-password');
  };

  useEffect(() => {
    if (loading || !role) {
      return;
    }
    router.replace('/(student)/(tabs)');
  }, [role, loading, router]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ email: email.trim(), password });
      router.replace('/(student)/(tabs)');
    } catch (error) {
      const message = getErrorMessage(error, '로그인에 실패했습니다. 다시 시도해주세요.');
      showToast(message);
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
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputField}
                  placeholder="비밀번호를 입력해주세요."
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable hitSlop={10} onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              </View>
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
            <Pressable onPress={handleFindEmail} hitSlop={8}>
              <Text style={styles.helperLinkText}>이메일 찾기</Text>
            </Pressable>
            <View style={styles.helperDivider} />
            <Pressable onPress={handleResetPassword} hitSlop={8}>
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
            <Text style={styles.bypassText}>테스트 계정으로 로그인하기</Text>
          </Pressable>
          {toast && (
            <View style={styles.toastOverlay} pointerEvents="none">
              <Animated.View
                style={[
                  styles.toastCard,
                  {
                    opacity: toastAnim.current,
                    transform: [
                      {
                        translateY: toastAnim.current.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.toastText}>{toast}</Text>
              </Animated.View>
            </View>
          )}
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
  inputRow: {
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
    paddingVertical: 0,
    paddingHorizontal: 4,
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
  toastOverlay: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  toastCard: {
    minWidth: '70%',
    maxWidth: 380,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 70, 240, 0.22)',
    backgroundColor: COLORS.blue100,
  },
  toastText: {
    color: COLORS.primaryNavy,
    fontFamily: 'Pretendard-Bold',
    fontSize: 15,
    textAlign: 'center',
  },
});
