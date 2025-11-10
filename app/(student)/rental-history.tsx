import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { RentalHistoryRecord, useRentalHistory } from './(tabs)/rental/hooks';

const STATUS_META: Record<
  RentalHistoryRecord['status'],
  { label: string; background: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  IN_PROGRESS: { label: '대여중', background: '#EEF2FF', color: COLORS.primary, icon: 'time-outline' },
  OVERDUE: { label: '연체', background: 'rgba(239, 68, 68, 0.12)', color: COLORS.danger, icon: 'alert-circle-outline' },
  RETURNED: { label: '반납완료', background: 'rgba(34, 197, 94, 0.12)', color: '#16A34A', icon: 'checkmark-circle-outline' },
  CANCELLED: { label: '취소됨', background: '#E5E7EB', color: COLORS.textMuted, icon: 'close-circle-outline' },
};

export default function StudentRentalHistoryScreen() {
  const { records, isLoading, error, refetch } = useRentalHistory();

  const showEmpty = !isLoading && !error && records.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="전체 대여 내역" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
      >
        {error ? (
          <Pressable style={styles.errorCard} onPress={refetch} hitSlop={6}>
            <Ionicons name="warning-outline" size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>대여 내역을 불러오지 못했어요</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
            <Ionicons name="refresh" size={18} color={COLORS.danger} />
          </Pressable>
        ) : null}

        {isLoading && records.length === 0 ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>대여 내역을 불러오는 중입니다...</Text>
          </View>
        ) : null}

        {showEmpty ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={24} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>조회할 내역이 없어요</Text>
            <Text style={styles.emptyMessage}>대여 이력이 생성되면 이곳에서 확인할 수 있어요.</Text>
          </View>
        ) : (
          records.map((record) => {
            const meta = STATUS_META[record.status];
            const returnValue = record.returnedAt ?? '-';

            return (
              <View key={record.id} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.itemName}>{record.itemName}</Text>
                    <Text style={styles.itemSub}>대여/반납 일정을 확인하세요.</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: meta.background }]}>
                    <Ionicons name={meta.icon} size={14} color={meta.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaBlock}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <View>
                      <Text style={styles.metaLabel}>대여 날짜</Text>
                      <Text style={styles.metaValue}>{record.rentedAt}</Text>
                    </View>
                  </View>
                  <View style={styles.metaBlock}>
                    <Ionicons name="alarm-outline" size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
                    <View>
                      <Text style={styles.metaLabel}>반납일</Text>
                      <Text style={styles.metaValue}>{returnValue}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 18,
  },
  errorCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.danger,
  },
  errorMessage: {
    ...TYPO.bodySm,
    color: COLORS.danger,
    marginTop: 2,
  },
  loadingCard: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  emptyMessage: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  historyCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  itemName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 17,
    color: COLORS.text,
  },
  itemSub: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F7F8FA',
  },
  metaLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
});
