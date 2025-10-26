// app/(council)/(tabs)/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAdminEvents, AdminEventInfo, toYMDfromDateTime } from '../../../src/api/adminEvents';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
};

export default function CouncilHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [list, setList] = useState<AdminEventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      // 기간필터 필요하면 getAdminEvents({ from:'2025-10-01', to:'2025-10-31' })
      const data = await getAdminEvents();
      setList(data);
    } catch (e) {
      console.warn('[getAdminEvents] fail', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setList(await getAdminEvents());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderItem = ({ item }: { item: AdminEventInfo }) => (
    <Pressable
      onPress={() => router.push(`/notice/${item.eventId}`)} // 상세 재사용(관리자 상세가 따로면 그 경로로)
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.95 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <View style={styles.metaList}>
          <Text style={styles.metaText}>
            등록 | <Text style={styles.metaDate}>{toYMDfromDateTime(item.eventCreatedAt)}</Text>
          </Text>
          <Text style={styles.metaText}>
            시작 | <Text style={styles.metaDate}>{item.eventStartDate}</Text>
          </Text>
          <Text style={styles.metaText}>
            종료 | <Text style={styles.metaDate}>{item.eventEndDate}</Text>
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* 상단 영역: 학생회 태그 + 학번 + 타이틀 + 우측 액션 */}
      <View style={styles.headerWrap}>
        <View style={styles.identity}>
          <View style={styles.badge}><Text style={styles.badgeText}>학생회</Text></View>
          <Text style={styles.studentId}>C246120</Text>
        </View>
        <Text style={styles.title}>공지사항</Text>
        <View style={styles.rightLinks}>
          <Pressable onPress={() => router.push('/notice/write')} hitSlop={10} style={styles.linkBtn}>
            <Text style={styles.linkText}>공지 작성</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/notice/calendar')} hitSlop={10} style={styles.linkBtn}>
            <Text style={styles.linkText}>달력 보기</Text>
          </Pressable>
        </View>
      </View>

      {/* 리스트 카드 */}
      <View style={styles.card}>
        {loading ? (
          <View style={{ paddingVertical: 36 }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(it) => String(it.eventId)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            contentContainerStyle={{ paddingVertical: 6 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ paddingVertical: 28 }}>
                <Text style={[styles.metaText, { textAlign: 'center' }]}>등록된 공지가 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  headerWrap: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4, backgroundColor: COLORS.surface },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },

  title: { textAlign: 'center', marginTop: 10, marginBottom: 10, color: COLORS.text, fontSize: 16, fontFamily: 'Pretendard-SemiBold' },

  rightLinks: { position: 'absolute', right: 16, bottom: 12, flexDirection: 'row', gap: 16 },
  linkBtn: { paddingVertical: 4 },
  linkText: { fontSize: 12, color: '#6B7280', fontFamily: 'Pretendard-Medium' },

  card: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 4,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  row: { paddingHorizontal: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 15, color: COLORS.text, fontFamily: 'Pretendard-SemiBold', marginBottom: 8 },

  metaList: { gap: 3 },
  metaText: { fontSize: 12, color: COLORS.muted, fontFamily: 'Pretendard-Medium' },
  metaDate: { color: COLORS.muted, fontFamily: 'Pretendard-Medium' },

  separator: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 8 },
});
