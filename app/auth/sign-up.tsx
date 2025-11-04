import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HoebiyoungLogo from '@/src/components/HoebiyoungLogo';
import { COLORS } from '@/src/design/colors';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = () => {
    if (!name || !email || !password || !passwordConfirm) {
      Alert.alert('입력 확인', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert('비밀번호 불일치', '비밀번호가 서로 다릅니다.');
      return;
    }

    Alert.alert('준비 중입니다', '회원 가입 연동 전이라 UI만 확인할 수 있어요.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            <Text style={styles.backText}>뒤로</Text>
          </Pressable>

          <View style={styles.logoBlock}>
            <HoebiyoungLogo />
            <Text style={styles.subtitle}>회원 정보를 입력해주세요.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                placeholder="이름을 입력해주세요."
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
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

            <View style={styles.field}>
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

            <View style={styles.field}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 다시 입력해주세요."
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryButtonText}>회원가입 완료</Text>
            </Pressable>
            <Text style={styles.termsText}>
              가입 시 회비영 서비스 약관과 개인정보 처리방침에 동의하게 됩니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Pretendard-Medium',
  },
  logoBlock: {
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontFamily: 'Pretendard-Medium',
  },
  form: {
    marginTop: 32,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Pretendard-SemiBold',
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
  actions: {
    marginTop: 40,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
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
  termsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
});
