// app/(council)/notice/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getAdminEventDetail, toYMDfromDateTime } from '../../src/api/adminEvents';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
};

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminEventDetail>> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await getAdminEventDetail(Number(id));
        if (mounted) setData(detail);
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.message || e?.message || '요청 실패');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* 상단: 뒤로가기 + 학생회/학번 + 타이틀 */}
      <View style={styles.headerWrap}>
        <View style={styles.identity}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>학생회</Text>
          </View>
          <Text style={styles.studentId}>C246120</Text>
        </View>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingRight: 4 }}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>
          <Text style={styles.title}>공지사항</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: '#DC2626' }}>{error}</Text>
        </View>
      ) : !data ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: COLORS.muted }}>데이터가 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            {/* 헤더 영역 */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>{data.title}</Text>
              <Text style={styles.metaRight}>등록 : {toYMDfromDateTime(data.eventCreatedAt)}</Text>
            </View>

            <View style={{ marginTop: 10 }}>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>시작 :</Text>
                <Text style={styles.kvVal}>{data.eventStartDate}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>종료 :</Text>
                <Text style={styles.kvVal}>{data.eventEndDate}</Text>
              </View>
            </View>

            <View style={styles.hr} />

            {/* 본문 */}
            <Text style={styles.content}>{data.content}</Text>

            {/* 이미지들 (있으면) */}
            {data.imageUrls?.length ? (
              <View style={styles.imageGrid}>
                {data.imageUrls.map((url, idx) => (
                  <Image
                    key={`${url}-${idx}`}
                    source={{ uri: url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWrap: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  title: { textAlign: 'center', paddingVertical: 8, color: COLORS.text, fontSize: 18, fontFamily: 'Pretendard-SemiBold' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },

  card: {
    borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16,
  },
  cardTitle: { fontSize: 20, color: COLORS.text, fontFamily: 'Pretendard-SemiBold' },
  metaRight: { fontSize: 12, color: COLORS.muted, alignSelf: 'flex-end' },
  kvRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  kvKey: { width: 44, color: COLORS.muted, fontFamily: 'Pretendard-Medium' },
  kvVal: { color: COLORS.text, fontFamily: 'Pretendard-Medium' },
  hr: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  content: { color: COLORS.text, lineHeight: 22, fontSize: 15, marginBottom: 12 },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  image: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
});
