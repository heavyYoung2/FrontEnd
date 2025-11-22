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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { ActiveRental, useMyActiveRentals } from '@/src/features/rental/hooks';

const STATUS_META: Record<
  ActiveRental['status'],
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  IN_PROGRESS: { label: '대여중', bg: '#EEF2FF', text: COLORS.primary, icon: 'time-outline' },
  OVERDUE: { label: '연체', bg: '#FEE2E2', text: COLORS.danger, icon: 'alert-circle-outline' },
};

export default function StudentRentalStatusScreen() {
  const router = useRouter();
  const { rentals, isLoading, error, refetch } = useMyActiveRentals();

  const showEmpty = !isLoading && !error && rentals.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="내 대여 현황 조회하기" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
      >
        {error ? (
          <Pressable style={styles.errorCard} onPress={refetch} hitSlop={6}>
            <Ionicons name="warning-outline" size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>대여 현황을 불러오지 못했어요</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
            <Ionicons name="refresh" size={18} color={COLORS.danger} />
          </Pressable>
        ) : showEmpty ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cloud-outline" size={24} color={COLORS.textMuted} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>현재 대여중인 물품이 없어요</Text>
            <Text style={styles.emptyCaption}>필요한 물품은 대여 탭에서 바로 신청해 보세요.</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null}

            {rentals.map((rental) => {
              const meta = STATUS_META[rental.status];
              return (
                <View key={rental.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.itemName}>{rental.itemName}</Text>
                      <Text style={styles.itemSub}>대여 내역을 확인하고 반납 일정을 지켜주세요.</Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon} size={14} color={meta.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusChipText, { color: meta.text }]}>{meta.label}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <View>
                        <Text style={styles.metaLabel}>대여 날짜</Text>
                        <Text style={styles.metaValue}>{rental.rentedAt}</Text>
                      </View>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="alarm-outline" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
                      <View>
                        <Text style={styles.metaLabel}>반납 예정일</Text>
                        <Text style={styles.metaValue}>{rental.expectedReturnAt}</Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.returnBtn,
                      pressed && styles.returnBtnPressed,
                      rental.rentalHistoryId == null && styles.returnBtnDisabled,
                    ]}
                    onPress={() =>
                      rental.rentalHistoryId != null &&
                      router.push({
                        pathname: '/(student)/return-item',
                        params: { rentalHistoryId: String(rental.rentalHistoryId) },
                      })
                    }
                    hitSlop={6}
                    disabled={rental.rentalHistoryId == null}
                  >
                    <Ionicons name="arrow-undo" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.returnBtnText}>반납하기</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.penaltyCard}>
          <View style={styles.penaltyHeader}>
            <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.penaltyTitle}>연체 기간에 대한 페널티</Text>
          </View>
          <Text style={styles.penaltyBody}>3일 내 반납 시 · 일주일 대여 정지</Text>
          <Text style={styles.penaltyBody}>1주 내 반납 시 · 한 달 대여 정지</Text>
          <Text style={styles.penaltyBody}>1주 이상 연체 시 · 영구 정지</Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            onPress={() => router.back()}
            hitSlop={6}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
            <Text style={styles.backBtnText}>뒤로가기</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.historyBtn, pressed && styles.historyBtnPressed]}
            onPress={() => router.push('/(student)/rental-history')}
            hitSlop={6}
          >
            <Ionicons name="list" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.historyBtnText}>전체 대여 내역 조회하기</Text>
          </Pressable>
        </View>
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
  emptyCard: {
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyCaption: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  cardList: {
    gap: 16,
  },
  loadingCard: {
    paddingVertical: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 12,
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
    flexShrink: 0,
  },
  statusChipText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
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
  returnBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  returnBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  returnBtnPressed: {
    opacity: 0.92,
  },
  returnBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  penaltyCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  penaltyTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  penaltyBody: {
    ...TYPO.bodySm,
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  backBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  historyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  historyBtnPressed: {
    opacity: 0.9,
  },
  historyBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  errorCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
});
