import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { ActiveRental } from '@/src/features/rental/hooks';
import { fetchMyPageInfo, MemberBlacklistInfo } from '@/src/api/member';
import { MyLockerInfoApi } from '@/src/api/locker';
import { StudentFeeStatus } from '@/src/api/studentFee';
import { MemberRentalItem } from '@/src/api/rental';
import { toYMD } from '@/src/utils/date';

const RENTAL_STATUS_BADGE: Record<
  ActiveRental['status'],
  { label: string; background: string; color: string }
> = {
  IN_PROGRESS: { label: '대여중', background: '#EEF2FF', color: COLORS.primary },
  OVERDUE: { label: '연체', background: 'rgba(239, 68, 68, 0.12)', color: COLORS.danger },
};

const LOCKER_STATUS_BADGE: Record<
  'RENTING' | 'RENTAL_REQUESTED' | 'NO_RENTAL' | 'UNKNOWN',
  { label: string; background: string; color: string }
> = {
  RENTING: { label: '대여중', background: '#EEF2FF', color: COLORS.primary },
  RENTAL_REQUESTED: { label: '신청 처리중', background: '#FEF9C3', color: '#B45309' },
  NO_RENTAL: { label: '신청 가능', background: '#DCFCE7', color: '#15803D' },
  UNKNOWN: { label: '확인 필요', background: '#E5E7EB', color: '#4B5563' },
};

export default function StudentMyPageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);

  const [rentals, setRentals] = useState<ActiveRental[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalsError, setRentalsError] = useState<Error | null>(null);
  const hasRentals = rentals.length > 0;
  const [myLocker, setMyLocker] = useState<MyLockerInfoApi | null>(null);
  const [lockerLoading, setLockerLoading] = useState(true);
  const [lockerError, setLockerError] = useState<string | null>(null);
  const [blacklist, setBlacklist] = useState<MemberBlacklistInfo | null>(null);
  const [blacklistLoading, setBlacklistLoading] = useState(true);
  const [blacklistError, setBlacklistError] = useState<Error | null>(null);
  const [feeStatus, setFeeStatus] = useState<StudentFeeStatus | null>(null);
  const [feeStatusLoading, setFeeStatusLoading] = useState(true);
  const [feeStatusCheckedAt, setFeeStatusCheckedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toActiveRental = useCallback((item: MemberRentalItem): ActiveRental | null => {
    const status = (item.rentalStatus ?? 'IN_PROGRESS').toUpperCase();
    if (status !== 'IN_PROGRESS' && status !== 'OVERDUE') return null;
    const rentedRaw = item.rentalStartedAt ?? null;
    return {
      id:
        item.rentalHistoryId != null
          ? String(item.rentalHistoryId)
          : `${item.itemName}-${item.rentalStartedAt ?? ''}`,
      itemName: item.itemName,
      rentedAt: rentedRaw ?? '-',
      expectedReturnAt: item.expectedReturnAt ?? '-',
      returnedAt: item.returnedAt ?? null,
      status: status === 'OVERDUE' ? 'OVERDUE' : 'IN_PROGRESS',
      rentalHistoryId: item.rentalHistoryId,
      itemCategoryId: item.itemCategoryId,
    };
  }, []);

  const loadMyPage = useCallback(async () => {
    setLockerLoading(true);
    setLockerError(null);
    setBlacklistLoading(true);
    setBlacklistError(null);
    setRentalsLoading(true);
    setRentalsError(null);
    setFeeStatusLoading(true);
    try {
      const result = await fetchMyPageInfo();
      setMyLocker(result.locker);
      setBlacklist(result.blacklist);
      const active = result.items
        .map(toActiveRental)
        .filter((item): item is ActiveRental => Boolean(item))
        .sort((a, b) => (Date.parse(b.rentedAt) || 0) - (Date.parse(a.rentedAt) || 0));
      setRentals(active);
      setFeeStatus(result.isStudentFeePaid ? 'PAID' : 'NOT_PAID');
      setFeeStatusCheckedAt(new Date().toISOString().slice(0, 10));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '마이페이지 정보를 불러오지 못했습니다.';
      setLockerError(message);
      setBlacklistError(err instanceof Error ? err : new Error(message));
      setRentalsError(err instanceof Error ? err : new Error(message));
      setFeeStatus('YET');
    } finally {
      setLockerLoading(false);
      setBlacklistLoading(false);
      setRentalsLoading(false);
      setFeeStatusLoading(false);
    }
  }, [toActiveRental]);

  useEffect(() => {
    loadMyPage();
  }, [loadMyPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMyPage();
    } catch (err) {
      console.warn('[student mypage] refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadMyPage]);

  const blacklistView = useMemo(() => {
    if (blacklistLoading) {
      return { label: '조회 중...', type: 'loading' as const };
    }
    if (blacklistError) {
      return { label: '불러오기에 실패했어요. 다시 시도해주세요.', type: 'error' as const };
    }
    if (!blacklist || !blacklist.blacklisted) {
      return { label: '경고 없음', type: 'safe' as const };
    }
    return {
      label: blacklist.blacklistUntil ? `블랙리스트 기한 : ${blacklist.blacklistUntil}` : '블랙리스트 대상',
      type: 'blacklisted' as const,
    };
  }, [blacklist, blacklistError, blacklistLoading]);

  const lockerStatusCode = (myLocker?.lockerRentalStatus ?? myLocker?.status ?? 'NO_RENTAL').toUpperCase() as
    | 'RENTING'
    | 'RENTAL_REQUESTED'
    | 'NO_RENTAL'
    | 'UNKNOWN';
  const lockerBadge = LOCKER_STATUS_BADGE[lockerStatusCode] ?? LOCKER_STATUS_BADGE.UNKNOWN;
  const lockerMetaText = useMemo(() => {
    if (lockerStatusCode === 'RENTING') {
      if (myLocker?.assignedAt) {
        const assigned = toYMD(myLocker.assignedAt) ?? myLocker.assignedAt;
        return `배정일 : ${assigned}`;
      }
      return '현재 사용 중인 사물함입니다.';
    }
    if (lockerStatusCode === 'RENTAL_REQUESTED') {
      return '신청이 접수되어 배정을 기다리는 중입니다.';
    }
    return '아직 배정받은 사물함이 없습니다.';
  }, [lockerStatusCode, myLocker]);
  const lockerDisplayNumber = useMemo(() => {
    const resolvedLockerNumber = myLocker?.lockerNumber ?? myLocker?.lockerName;

    if (lockerStatusCode === 'NO_RENTAL') {
      return resolvedLockerNumber && resolvedLockerNumber !== '0' ? resolvedLockerNumber : '신청 처리 중';
    }
    if (lockerStatusCode === 'RENTAL_REQUESTED') {
      return resolvedLockerNumber && resolvedLockerNumber !== '0' ? resolvedLockerNumber : '신청 처리 중';
    }
    return resolvedLockerNumber ?? '-';
  }, [lockerStatusCode, myLocker]);

  const membershipBadge = feeStatusLoading
    ? { label: '납부 완료', background: COLORS.blue100, color: COLORS.primary }
    : feeStatus === 'PAID'
      ? { label: '납부 완료', background: COLORS.blue100, color: COLORS.primary }
      : feeStatus === 'NOT_PAID'
        ? { label: '미납', background: 'rgba(239, 68, 68, 0.12)', color: COLORS.danger }
        : { label: '확인전', background: COLORS.border, color: COLORS.textMuted };
  const showMembershipButton = !feeStatusLoading && feeStatus !== 'PAID';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="나의 회비영" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 200 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나의 사물함</Text>
          <View
            style={[
              styles.card,
              lockerStatusCode === 'RENTAL_REQUESTED' && { backgroundColor: '#FEF9C3', borderColor: '#FDE68A' },
            ]}
          >
            {lockerError ? (
              <Pressable style={styles.errorBanner} onPress={loadMyPage} hitSlop={6}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>사물함 정보를 불러오지 못했어요</Text>
                  <Text style={styles.errorMessage}>{lockerError}</Text>
                </View>
                <Ionicons name="refresh" size={18} color={COLORS.danger} />
              </Pressable>
            ) : null}

            {lockerLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null}

            {!lockerLoading && !lockerError ? (
              <>
                <View style={styles.cardRow}>
                  <Text
                    style={[
                      styles.lockerId,
                      lockerDisplayNumber === '배정 정보 없음' && { color: COLORS.textMuted },
                    ]}
                  >
                    {lockerDisplayNumber}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: lockerBadge.background }]}>
                    <Text style={[styles.statusPillText, { color: lockerBadge.color }]}>{lockerBadge.label}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{lockerMetaText}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>나의 대여중인 물품</Text>
            <Pressable
              hitSlop={10}
              onPress={() => router.push('/(student)/rental-history')}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
            >
              <Text style={styles.linkText}>전체 내역 보기</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </Pressable>
          </View>

          <View style={styles.card}>
            {rentalsError ? (
              <Pressable style={styles.errorBanner} onPress={loadMyPage} hitSlop={6}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>대여 정보를 불러오지 못했어요</Text>
                  <Text style={styles.errorMessage}>{rentalsError.message}</Text>
                </View>
                <Ionicons name="refresh" size={18} color={COLORS.danger} />
              </Pressable>
            ) : null}

            {rentalsLoading && !hasRentals ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null}

            {hasRentals ? (
              <>
                {rentalsLoading ? (
                  <View style={styles.inlineLoader}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : null}
                {rentals.map((item, index) => {
                  const badge = RENTAL_STATUS_BADGE[item.status];
                  return (
                    <View key={item.id} style={index > 0 ? styles.rentalBlockSpacing : undefined}>
                      <View style={styles.cardRow}>
                        <Text style={styles.rentalName}>{item.itemName}</Text>
                        <View style={[styles.statusPill, { backgroundColor: badge.background }]}>
                          <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>대여 날짜</Text>
                        <Text style={styles.metaValue}>{item.rentedAt}</Text>
                      </View>
                      <View style={[styles.metaRow, { marginTop: 4 }]}>
                        <Text style={styles.metaLabel}>반납일</Text>
                        <Text style={styles.metaValue}>{item.returnedAt ?? '-'}</Text>
                      </View>

                      <Pressable
                        hitSlop={10}
                        onPress={() => {
                          if (item.rentalHistoryId == null) return;
                          router.push({
                            pathname: '/(student)/return-item',
                            params: { rentalHistoryId: String(item.rentalHistoryId) },
                          });
                        }}
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          pressed && styles.pressedSecondary,
                          item.rentalHistoryId == null && styles.secondaryButtonDisabled,
                        ]}
                        disabled={item.rentalHistoryId == null}
                      >
                        <Text style={styles.secondaryButtonText}>반납하기</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </>
            ) : !rentalsLoading && !rentalsError ? (
              <Text style={styles.emptyText}>현재 대여중인 물품이 없어요.</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학생 회비 납부 확인</Text>
          <View style={styles.card}>
            <Text style={styles.metaLabel}>학생 회비 납부 여부</Text>
            <View style={styles.membershipStatusRow}>
              <View style={[styles.membershipStatusBadge, { backgroundColor: membershipBadge.background }]}>
                <Text style={[styles.membershipStatusText, { color: membershipBadge.color }]}>{membershipBadge.label}</Text>
              </View>
              {showMembershipButton ? (
                <Pressable
                  hitSlop={10}
                  onPress={() => router.push('/(student)/(tabs)/qr')}
                  style={({ pressed }) => [styles.membershipButton, pressed && { opacity: 0.92 }]}
                >
                  <Text style={styles.membershipButtonText}>확인하기</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.meta}>마지막 확인일 : {feeStatusCheckedAt ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>챗봇</Text>
          <Pressable
            hitSlop={10}
            onPress={() => router.push('/(student)/chatbot')}
            style={({ pressed }) => [styles.chatButton, pressed && styles.chatButtonPressed]}
          >
            <Text style={styles.chatButtonText}>챗봇과 대화하기</Text>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연체 페널티 조회</Text>
          {blacklistError ? (
            <Pressable
              hitSlop={10}
              onPress={loadMyPage}
              style={[styles.warningCard, styles.warningError]}
            >
              <Ionicons name="warning-outline" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
              <Text style={[styles.warningText, styles.warningTextError]}>{blacklistView.label}</Text>
              <Ionicons name="refresh" size={18} color={COLORS.danger} style={{ marginLeft: 8 }} />
            </Pressable>
          ) : (
            <View
              style={[
                styles.warningCard,
                blacklistView.type === 'blacklisted'
                  ? styles.warningActive
                  : blacklistView.type === 'loading'
                    ? styles.warningLoading
                    : styles.warningSafe,
              ]}
            >
              {blacklistLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text
                  style={[
                    styles.warningText,
                    blacklistView.type === 'blacklisted'
                      ? styles.warningTextActive
                      : styles.warningTextSafe,
                  ]}
                >
                  {blacklistView.label}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.fabColumn, { bottom: bottomInset + 104 }]}>
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/(student)/settings')}
          style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }]}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
        </Pressable>

        <Pressable
          hitSlop={10}
          onPress={() => router.push('/(student)/settings/guide')}
          style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }]}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  scroll: {
    padding: 24,
    paddingBottom: 120,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockerId: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 20,
    color: COLORS.text,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  membershipStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  membershipStatusBadge: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  membershipStatusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  membershipButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: COLORS.primary,
  },
  membershipButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  statusPillText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: COLORS.primary,
  },
  meta: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  rentalName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.text,
  },
  rentalBlockSpacing: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  secondaryButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonDisabled: {
    borderColor: COLORS.border,
    backgroundColor: '#F3F4F6',
  },
  secondaryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.primary,
  },
  pressedSecondary: {
    opacity: 0.9,
  },
  emptyText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.textMuted,
  },
  chatButton: {
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatButtonPressed: {
    opacity: 0.92,
  },
  chatButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  warningCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  warningSafe: {
    backgroundColor: '#EEF2FF',
  },
  warningLoading: {
    backgroundColor: '#F3F4F6',
  },
  warningActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  warningError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  warningText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
  },
  warningTextSafe: {
    color: COLORS.primary,
  },
  warningTextActive: {
    color: COLORS.danger,
  },
  warningTextError: {
    color: COLORS.danger,
    flex: 1,
  },
  fabColumn: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    gap: 12,
  },
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  errorTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.danger,
  },
  errorMessage: {
    ...TYPO.bodySm,
    color: COLORS.danger,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  inlineLoader: {
    alignSelf: 'flex-end',
  },
});
