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
import { ActiveRental, useMyActiveRentals } from './rental/hooks';
import { fetchMemberBlacklist, MemberBlacklistInfo } from '@/src/api/member';

const lockerInfo = {
  number: 'A12번',
  statusLabel: '대여중',
  assignedAt: '2025-07-01',
};

const membershipStatus = {
  paid: true,
  label: '납부',
  checkedAt: '2025-03-10',
};

const RENTAL_STATUS_BADGE: Record<
  ActiveRental['status'],
  { label: string; background: string; color: string }
> = {
  IN_PROGRESS: { label: '대여중', background: '#EEF2FF', color: COLORS.primary },
  OVERDUE: { label: '연체', background: 'rgba(239, 68, 68, 0.12)', color: COLORS.danger },
};

export default function StudentMyPageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const { rentals, isLoading: rentalsLoading, error: rentalsError, refetch } = useMyActiveRentals();

  const hasRentals = rentals.length > 0;
  const [blacklist, setBlacklist] = useState<MemberBlacklistInfo | null>(null);
  const [blacklistLoading, setBlacklistLoading] = useState(true);
  const [blacklistError, setBlacklistError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    setBlacklistError(null);
    try {
      const data = await fetchMemberBlacklist();
      setBlacklist(data);
    } catch (err) {
      console.warn('[member blacklist] fetch failed', err);
      setBlacklistError(err instanceof Error ? err : new Error('블랙리스트 정보를 불러오지 못했습니다.'));
    } finally {
      setBlacklistLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlacklist();
  }, [loadBlacklist]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), loadBlacklist()]);
    } catch (err) {
      console.warn('[student mypage] refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadBlacklist, refetch]);

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
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.lockerId}>{lockerInfo.number}</Text>
              <View style={[styles.statusPill, styles.statusActive]}>
                <Text style={styles.statusPillText}>{lockerInfo.statusLabel}</Text>
              </View>
            </View>
            <Text style={styles.meta}>배정일 : {lockerInfo.assignedAt}</Text>
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
              <Pressable style={styles.errorBanner} onPress={refetch} hitSlop={6}>
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
                        <Text style={styles.metaLabel}>반납 예정일</Text>
                        <Text style={styles.metaValue}>{item.expectedReturnAt}</Text>
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
            <View style={styles.cardRow}>
              <Text style={styles.metaLabel}>학생 회비 납부 여부</Text>
              <View style={[styles.statusPill, styles.statusSuccess]}>
                <Text style={styles.statusPillText}>{membershipStatus.label}</Text>
              </View>
            </View>
            <Text style={styles.meta}>마지막 확인일 : {membershipStatus.checkedAt}</Text>

            <Pressable
              hitSlop={10}
              onPress={() => router.push('/(student)/dues-check')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedPrimary]}
            >
              <Text style={styles.primaryButtonText}>확인하기</Text>
            </Pressable>
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
          <Text style={styles.sectionTitle}>경고 누적 조회</Text>
          {blacklistError ? (
            <Pressable
              hitSlop={10}
              onPress={loadBlacklist}
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
  statusActive: {
    backgroundColor: '#EEF2FF',
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
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
  primaryButton: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  pressedPrimary: {
    opacity: 0.92,
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
