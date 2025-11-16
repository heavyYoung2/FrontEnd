import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { issueTempPassword } from '@/src/api/auth';
import { COLORS } from '@/src/design/colors';

export default function TempPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('이메일 입력', '학교 이메일을 입력해주세요.');
      return;
    }
    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await issueTempPassword(trimmed);
      Alert.alert('임시 비밀번호 발급', res.message ?? '이메일을 확인해주세요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '임시 비밀번호 발급에 실패했습니다.';
      Alert.alert('발급 실패', message);
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
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
              <Text style={styles.backText}>뒤로</Text>
            </Pressable>
            <Text style={styles.title}>임시 비밀번호 발급</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.desc}>
              등록된 학교 이메일로 임시 비밀번호를 보내드려요. 이메일을 입력한 뒤
              발급 버튼을 눌러주세요.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="학교 이메일 입력"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || submitting) && { opacity: 0.9 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.primaryButtonText}>임시 비밀번호 발급</Text>
              )}
            </Pressable>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.page,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  desc: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textMuted,
    lineHeight: 20,
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d2bb8',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
  },
});
