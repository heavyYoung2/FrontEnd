// app/notice/[id].tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAdminEventDetail,
  AdminEventDetail,
  deleteAdminEvent,
} from '../../src/api/adminEvents';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
  danger: '#EA4335',
};

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<AdminEventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminEventDetail(Number(id));
      setDetail(data);
    } catch (e: any) {
      Alert.alert('에러', e?.response?.data?.message || e?.message || '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 최초 1회 로딩
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // 수정 후 돌아왔을 때 자동 반영
  useFocusEffect(
    React.useCallback(() => {
      fetchDetail();
      return undefined;
    }, [fetchDetail])
  );

  const onDelete = () => {
    Alert.alert('삭제하기', '정말로 이 공지사항을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminEvent(Number(id));
            Alert.alert('완료', '삭제되었습니다.', [
              { text: '확인', onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert('실패', e?.response?.data?.message || e?.message || '삭제 실패');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ padding: 20 }}>
          <Text>데이터가 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const createdYmd =
    typeof detail.eventCreatedAt === 'string'
      ? detail.eventCreatedAt.split('T')[0]
      : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* 상단 헤더 (학생회 태그 + 학번 + 타이틀 + 뒤로가기) */}
      <View style={styles.headerWrap}>
        <View style={styles.identity}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>학생회</Text>
          </View>
        <Text style={styles.studentId}>C246120</Text>
        </View>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingRight: 4 }}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>
          <Text style={styles.title}>공지사항</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 내용 카드 */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{detail.title}</Text>
            <Text style={styles.metaRight}>등록 : {createdYmd}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.metaKey}>시작 :</Text>
            <Text style={styles.metaVal}>{detail.eventStartDate || '-'}</Text>
          </View>
          <View style={[styles.row, { marginBottom: 10 }]}>
            <Text style={styles.metaKey}>종료 :</Text>
            <Text style={styles.metaVal}>{detail.eventEndDate || '-'}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.content}>{detail.content}</Text>
        </View>

        {/* 하단 액션 버튼 */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/notice/edit/${detail.eventId}`)}
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.95 }]}
          >
            <Text style={styles.editText}>수정하기</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.95 }]}
          >
            <Text style={styles.deleteText}>삭제하기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  title: { textAlign: 'center', paddingVertical: 6, color: COLORS.text, fontSize: 18, fontFamily: 'Pretendard-SemiBold' },

  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    padding: 14,
  },
  cardTitle: { fontSize: 20, color: COLORS.text, fontFamily: 'Pretendard-SemiBold' },
  metaRight: { color: COLORS.muted, fontFamily: 'Pretendard-Medium' },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  metaKey: { color: COLORS.muted, fontFamily: 'Pretendard-Medium' },
  metaVal: { color: COLORS.text, fontFamily: 'Pretendard-Medium' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  content: { color: COLORS.text, fontFamily: 'Pretendard-Medium', lineHeight: 22 },

  actions: { marginTop: 12, flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editText: { color: COLORS.primary, fontFamily: 'Pretendard-SemiBold' },
  deleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteText: { color: COLORS.danger, fontFamily: 'Pretendard-SemiBold' },
});