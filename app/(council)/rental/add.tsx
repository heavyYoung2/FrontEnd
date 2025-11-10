import React, { useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { createAdminItemCategory } from '@/src/api/items';

export default function RentalAddScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    const trimmedName = name.trim();
    return trimmedName.length === 0 || isSubmitting;
  }, [name, isSubmitting]);

  const submitCategory = async (categoryName: string) => {
    try {
      setIsSubmitting(true);
      await createAdminItemCategory(categoryName);
      Alert.alert('추가 완료', '새로운 대여 물품 종류가 등록되었어요.', [
        {
          text: '확인',
          onPress: () => router.replace('/(council)/rental'),
        },
      ]);
    } catch (err) {
      console.warn('[council rental] create item category failed', err);
      const message =
        err instanceof Error && err.message ? err.message : '대여 물품을 추가하지 못했습니다. 잠시 후 다시 시도해주세요.';
      Alert.alert('추가 실패', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (trimmedName.length === 0) {
      Alert.alert('대여 물품 추가', '대여 물품명을 입력해주세요.');
      return;
    }

    const confirmDescription = trimmedDescription.length > 0 ? trimmedDescription : '작성되지 않았습니다.';

    Alert.alert(
      '대여 물품 추가',
      `다음과 같은 정보로 대여 물품을 추가하시겠습니까?\n\n대여 물품명 : ${trimmedName}\n설명 : ${confirmDescription}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            submitCategory(trimmedName);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="대여 물품 종류 추가하기"
        showBack
        backFallbackHref="/(council)/rental"
        withBottomBorder={false}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>대여 물품 명을 입력해주세요</Text>
              <View style={styles.inputShell}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="예) 장우산"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>물품 설명을 입력해주세요</Text>
              <View style={[styles.inputShell, styles.textAreaShell]}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="예) 우천 시 사용 가능한 자동 우산입니다."
                  placeholderTextColor={COLORS.textMuted}
                  style={[styles.input, styles.textArea]}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>등록하기</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: COLORS.surface || COLORS.bg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.text,
  },
  inputShell: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    minHeight: 44,
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  textAreaShell: {
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 96,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
});
