// app/(tabs)/mypage.tsx
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/** 디자인 토큰 */
const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
  success: '#16A34A',
  danger: '#E11D48',
};

type RentalItem = {
  id: string;
  name: string;
  rentDate: string;
  dueDate?: string;
};

export default function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  /** ---- 더미 데이터 ---- */
  const lockerNo = 'A12번'; // 없으면 undefined
  const feePaid = true;     // false면 미납
  const rentals = useMemo<RentalItem[]>(
    () => [
      {
        id: 'r1',
        name: '보조배터리',
        rentDate: '2025-07-05',
        dueDate: '2025-07-12',
      },
      {
        id: 'r2',
        name: '우산',
        rentDate: '2025-07-06',
        dueDate: '2025-07-07',
      },
    ],
    []
  );

  /** ---- 렌탈 행 ---- */
  const renderRental = ({ item }: { item: RentalItem }) => (
    <View style={styles.rentalRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rentalName}>{item.name}</Text>
        <Text style={styles.rentalMeta}>
          대여일 : <Text style={styles.rentalMetaStrong}>{item.rentDate}</Text>
          {item.dueDate ? `   |   반납 예정일 : ${item.dueDate}` : ''}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push('/rental')}
        style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.smallBtnText}>반납하기</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* 상단: 타이틀 + 학생회/학번 */}
      <View style={styles.headerWrap}>
        <Text style={styles.title}>나의 회비영</Text>

        <View style={styles.identityRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>학생회</Text>
          </View>
          <Text style={styles.studentId}>C246120</Text>
        </View>
      </View>

      <View style={{ height: 8 }} />

      {/* 나의 사물함 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>나의 사물함</Text>
          <Pressable
            onPress={() => router.push('/locker')}
            hitSlop={10}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>관리</Text>
          </Pressable>
        </View>

        <View style={styles.lockerRow}>
          <Ionicons name="grid-outline" size={20} color={COLORS.muted} />
          <Text style={styles.lockerNum}>{lockerNo ?? '-'}</Text>
        </View>
      </View>

      {/* 내 대여중인 물품 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>내 대여중인 물품</Text>
          <Pressable
            onPress={() => router.push('/rental')}
            hitSlop={10}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>전체 내역 보기</Text>
          </Pressable>
        </View>

        {rentals.length === 0 ? (
          <Text style={styles.emptyText}>대여중인 물품이 없습니다</Text>
        ) : (
          <FlatList
            data={rentals}
            keyExtractor={(it) => it.id}
            renderItem={renderRental}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
            contentContainerStyle={{ paddingVertical: 6 }}
          />
        )}
      </View>

      {/* 학생 회비 납부 여부 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>학생 회비 납부 여부</Text>
          <View
            style={[
              styles.chip,
              { backgroundColor: feePaid ? '#E7F6ED' : '#FDECEC' },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: feePaid ? COLORS.success : COLORS.danger },
              ]}
            >
              {feePaid ? '납부' : '미납'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {/* 확인/납부 화면 */}}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.95 }]}
        >
          <Text style={styles.primaryBtnText}>
            {feePaid ? '확인하기' : '납부하기'}
          </Text>
        </Pressable>
      </View>

      {/* 하단 대화 버튼 */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Pressable
          onPress={() => {/* 챗봇 라우팅 */}}
          style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.95 }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
          <Text style={styles.ghostBtnText}>챗봇과 대화하기</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  headerWrap: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingBottom: 10 },
  title: {
    textAlign: 'center',
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Pretendard-SemiBold',
  },
  linkBtn: { padding: 6 },
  linkText: { fontSize: 12, color: COLORS.muted, fontFamily: 'Pretendard-Medium' },

  lockerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  lockerNum: { fontSize: 16, color: COLORS.text, fontFamily: 'Pretendard-SemiBold' },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    paddingVertical: 10,
    fontFamily: 'Pretendard-Medium',
  },

  rentalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rentalName: { fontSize: 15, color: COLORS.text, fontFamily: 'Pretendard-SemiBold' },
  rentalMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2, fontFamily: 'Pretendard-Medium' },
  rentalMetaStrong: { fontFamily: 'Pretendard-SemiBold' },
  smallBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { fontSize: 12, color: COLORS.text, fontFamily: 'Pretendard-SemiBold' },
  separator: { height: 1, backgroundColor: COLORS.border },

  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontFamily: 'Pretendard-SemiBold' },

  primaryBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Pretendard-SemiBold' },

  ghostBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostBtnText: { color: COLORS.primary, fontSize: 15, fontFamily: 'Pretendard-SemiBold' },
});
