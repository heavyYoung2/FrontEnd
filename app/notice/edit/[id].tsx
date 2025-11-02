// app/notice/edit/[id].tsx
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAdminEventDetail, updateAdminEvent } from '../../../src/api/adminEvents';
import CouncilHeader from '@/components/CouncilHeader';

const COLORS = {
  primary: '#2E46F0', text: '#111827', muted: '#6F7680',
  border: '#E6E8EE', surface: '#FFFFFF', bg: '#F5F7FA',
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const d = await getAdminEventDetail(Number(id));
        setTitle(d.title ?? '');
        setContent(d.content ?? '');
        setStart(d.eventStartDate ?? '');
        setEnd(d.eventEndDate ?? '');
      } catch (e: any) {
        Alert.alert('에러', e?.response?.data?.message || e?.message || '불러오기 실패');
      }
    })();
  }, [id]);

  const onSubmit = async () => {
    if (!title.trim()) return Alert.alert('오류', '제목을 입력하세요.');
    if (!content.trim()) return Alert.alert('오류', '내용을 입력하세요.');
    try {
      await updateAdminEvent(Number(id), {
        title: title.trim(),
        content: content.trim(),
        eventStartDate: start || undefined,
        eventEndDate: end || undefined,
      });
      Alert.alert('완료', '수정되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('실패', e?.response?.data?.message || e?.message || '수정 실패');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'left', 'right']}>
      <CouncilHeader studentId="C246120" title="공지 수정" showBack />

      <View style={styles.card}>
        <Text style={styles.label}>제목</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="제목" />

        <Text style={[styles.label, { marginTop: 12 }]}>내용</Text>
        <TextInput
          style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
          value={content}
          onChangeText={setContent}
          multiline
          placeholder="내용"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>시작일 (yyyy-MM-dd)</Text>
        <TextInput style={styles.input} value={start} onChangeText={setStart} placeholder="2025-07-06" />

        <Text style={[styles.label, { marginTop: 12 }]}>종료일 (yyyy-MM-dd)</Text>
        <TextInput style={styles.input} value={end} onChangeText={setEnd} placeholder="2025-07-07" />

        <Pressable onPress={onSubmit} style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.95 }]}>
          <Text style={styles.submitText}>저장하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 12 },
  label: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: COLORS.text,
  },
  submitBtn: {
    marginTop: 16, height: 52, borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'Pretendard-SemiBold' },
});
