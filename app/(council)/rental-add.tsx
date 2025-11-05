import React, { useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';

export default function RentalAddScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');

  const isSubmitDisabled = useMemo(() => {
    const trimmedName = name.trim();
    const parsedTotal = parseInt(total, 10);
    return trimmedName.length === 0 || Number.isNaN(parsedTotal) || parsedTotal <= 0;
  }, [name, total]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const parsedTotal = parseInt(total, 10);

    if (trimmedName.length === 0) {
      Alert.alert('대여 물품 추가', '대여 물품명을 입력해주세요.');
      return;
    }
    if (Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      Alert.alert('대여 물품 추가', '대여 물품 총 수량을 1 이상 숫자로 입력해주세요.');
      return;
    }

    Alert.alert(
      '대여 물품 추가',
      `다음과 같은 정보로 대여 물품을 추가하시겠습니까?\n\n대여 물품명 : ${trimmedName}\n대여 총 수량 : ${parsedTotal}개`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Alert.alert(
              '추가 완료',
              '새로운 대여 물품 유형이 목록에 반영됩니다.',
              [
                {
                  text: '확인',
                  onPress: () => router.back(),
                },
              ],
            );
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.label}>대여 물품 명을 입력해주세요</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="예) 장우산"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              returnKeyType="next"
            />

            <Text style={[styles.label, { marginTop: 20 }]}>대여 물품 총 수량을 입력해주세요</Text>
            <TextInput
              value={total}
              onChangeText={(text) => setTotal(text.replace(/[^0-9]/g, ''))}
              placeholder="예) 30"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              style={styles.input}
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        <View style={styles.bottomArea}>
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              isSubmitDisabled && styles.submitButtonDisabled,
            ]}
          >
            <Text style={styles.submitText}>대여 물품 추가 하기</Text>
          </Pressable>
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
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#6F737C',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.7,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
