// app/notice/write.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addEvent } from '../../src/api/event';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
};

export default function NoticeWriteScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');

  const onSubmit = async () => {
    if (!title.trim()) return Alert.alert('오류', '제목을 입력하세요.');
    if (!content.trim()) return Alert.alert('오류', '내용을 입력하세요.');

    try {
      const res = await addEvent({
        title: title.trim(),
        content: content.trim(),
        eventStartDate: start || '', // yyyy-MM-dd
        eventEndDate: end || '',
      });
      Alert.alert('완료', `공지 생성 성공 (id=${res.eventId})`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '요청 실패';
      Alert.alert('실패', String(msg));
    }
  };  
 
  return (
    <SafeAreaView style={styles.safe}>
      {/* (1) 아이덴티티: 학생회 + 학번 */}
      <View style={styles.identityWrap}>
        <View style={styles.identity}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>학생회</Text>
          </View>
          <Text style={styles.studentId}>C246120</Text>
        </View>
      </View>

      {/* (2) 헤더: 뒤로가기 + 중앙 타이틀 */}
      <View style={styles.headerWrap}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle}>공지 작성</Text>

        {/* 균형 맞춤용 공간 */}
        <View style={{ width: 22 }} />
      </View>

      {/* (3) 입력 카드 */}
      <View style={styles.card}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="제목을 입력하세요"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>내용</Text>
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          value={content}
          onChangeText={setContent}
          multiline
          placeholder="내용을 입력하세요"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>시작일 (yyyy-MM-dd)</Text>
        <TextInput
          style={styles.input}
          value={start}
          onChangeText={setStart}
          placeholder="예: 2025-07-06"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>종료일 (yyyy-MM-dd)</Text>
        <TextInput
          style={styles.input}
          value={end}
          onChangeText={setEnd}
          placeholder="예: 2025-07-07"
        />

        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.95 },
          ]}
        >
          <Text style={styles.submitText}>등록하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  /** 아이덴티티 (맨 위) */
  identityWrap: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },

  /** 헤더 */
  headerWrap: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },

  /** 입력 카드 */
  card: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 12,
  },
  label: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: COLORS.text,
  },
  submitBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
});
