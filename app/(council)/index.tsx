// app/(council)/(tabs)/index.tsx
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  getAdminEvents,
  AdminEventInfo,
  toYMDfromDateTime,
} from '../../src/api/adminEvents';
import CouncilHeader from '@/components/CouncilHeader';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
};

export default function CouncilHome() {
  const router = useRouter();

  const [list, setList] = useState<AdminEventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminEvents(); // 필요시 {from,to}
      setList(data);
    } catch (e) {
      console.warn('[getAdminEvents] fail', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getAdminEvents();
      setList(data);
    } catch (e) {
      console.warn('[refresh getAdminEvents] fail', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 화면 복귀 시마다 갱신
  useFocusEffect(
    React.useCallback(() => {
      fetchList();
      return undefined;
    }, [fetchList]),
  );

  // 최초 1회 로딩
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const renderItem = ({ item }: { item: AdminEventInfo }) => (
    <Pressable
      onPress={() => router.push(`/notice/${item.eventId}`)}
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="공지사항"
        right={(
          <View style={styles.headerLinks}>
            <Pressable onPress={() => router.push('/notice/write')} hitSlop={10} style={styles.linkBtn}>
              <Text style={styles.linkText}>공지 작성</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/notice/calendar')} hitSlop={10} style={styles.linkBtn}>
              <Text style={styles.linkText}>달력 보기</Text>
            </Pressable>
          </View>
        )}
      />

      {/* 리스트 카드 */}
      <View style={styles.card}>
        {loading ? (
          <View style={{ paddingVertical: 36 }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}                      // ⬅️ 리스트가 남은 영역을 채우도록
            data={list}
            keyExtractor={(it) => String(it.eventId)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            contentContainerStyle={{
              paddingVertical: 6,
              paddingBottom: 120,                   // ⬅️ 탭/플로팅 버튼에 가리지 않게 여백
            }}
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
  headerLinks: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  linkBtn: { paddingVertical: 4 },
  linkText: { fontSize: 12, color: '#6B7280', fontFamily: 'Pretendard-Medium' },

  card: {
    flex: 1,                                   // ⬅️ 헤더 아래 남은 공간을 차지(스크롤 가능)
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
