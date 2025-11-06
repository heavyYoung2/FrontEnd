import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { useRentalDashboard } from './hooks';
import { fetchMemberBlacklist, MemberBlacklistInfo } from '@/src/api/member';

const CARD_GAP = 18;

export default function StudentRentalDashboardScreen() {
  const router = useRouter();
  const {
    items,
    blacklistUntil,
    statusError,
    refetchStatus,
    itemsLoading,
    itemsError,
    refetchItems,
  } = useRentalDashboard();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const [refreshing, setRefreshing] = useState(false);
  const [blacklistInfo, setBlacklistInfo] = useState<MemberBlacklistInfo | null>(null);
  const [blacklistLoading, setBlacklistLoading] = useState(true);
  const [blacklistError, setBlacklistError] = useState<Error | null>(null);

  const loadBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    setBlacklistError(null);
    try {
      const result = await fetchMemberBlacklist();
      setBlacklistInfo(result);
    } catch (err) {
      console.warn('[student rental] blacklist fetch failed', err);
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
      await Promise.allSettled([refetchStatus(), refetchItems(), loadBlacklist()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadBlacklist, refetchItems, refetchStatus]);

  const effectiveBlacklistUntil = useMemo(() => {
    if (blacklistInfo?.blacklistUntil) return blacklistInfo.blacklistUntil;
    return blacklistUntil;
  }, [blacklistInfo?.blacklistUntil, blacklistUntil]);

  const blacklistBanner = useMemo(() => {
    if (!blacklistInfo?.blacklisted) return { visible: false, label: '' };
    const label = effectiveBlacklistUntil ? `블랙리스트 기한 : ${effectiveBlacklistUntil}` : '블랙리스트 대상';
    return { visible: true, label };
  }, [blacklistInfo?.blacklisted, effectiveBlacklistUntil]);

  const blacklistCardView = useMemo(() => {
    if (blacklistLoading) {
      return { label: '조회 중...', type: 'loading' as const };
    }
    if (blacklistError) {
      return { label: '불러오기에 실패했어요. 다시 시도해주세요.', type: 'error' as const };
    }
    if (!blacklistInfo || !blacklistInfo.blacklisted) {
      return { label: '경고 없음', type: 'safe' as const };
    }
    return {
      label: effectiveBlacklistUntil ? `블랙리스트 기한 : ${effectiveBlacklistUntil}` : '블랙리스트 대상',
      type: 'blacklisted' as const,
    };
  }, [blacklistError, blacklistInfo, blacklistLoading, effectiveBlacklistUntil]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="대여 물품" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 200 }]}
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
        {statusError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{statusError.message}</Text>
          </View>
        ) : null}

        {itemsError ? (
          <Pressable style={styles.errorBanner} onPress={refetchItems} hitSlop={6}>
            <Ionicons name="warning-outline" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{itemsError.message}</Text>
            <Ionicons name="refresh" size={16} color={COLORS.danger} style={styles.errorActionIcon} />
          </Pressable>
        ) : null}

        <View style={styles.actionPanel}>
          <Pressable
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
            onPress={() => router.push('/(student)/(tabs)/rental/guides')}
            hitSlop={6}
          >
            <Ionicons name="information-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionText}>대여 물품 안내 사항</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
            onPress={() => router.push('/(student)/(tabs)/rental/my-status')}
            hitSlop={6}
          >
            <Ionicons name="clipboard-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryActionText}>내 대여 현황 조회하기</Text>
          </Pressable>
        </View>

        {itemsLoading && items.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>대여 가능한 물품을 불러오는 중입니다...</Text>
          </View>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.cardList}>
            {items.map((item) => {
              const total = item.totalCount;
              const available = item.availableCount;
              const rented = Math.max(total - available, 0);
              const availabilityRatio = total === 0 ? 0 : available / total;

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                    </View>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/(student)/rent-item',
                          params: { itemId: String(item.categoryId) },
                        })
                      }
                      hitSlop={8}
                      style={({ pressed }) => [styles.chipButton, pressed && styles.chipButtonPressed]}
                    >
                      <Ionicons name="arrow-redo" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.chipButtonText}>대여하기</Text>
                    </Pressable>
                  </View>

                  <View style={styles.statsRow}>
                    <StatPill label="총 수량" value={total} />
                    <StatPill label="대여 가능" value={available} tone="positive" />
                    <StatPill label="대여 중" value={rented} tone="negative" />
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { flex: availabilityRatio, backgroundColor: COLORS.primary },
                      ]}
                    />
                    <View style={{ flex: 1 - availabilityRatio }} />
                  </View>

                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>대여 가능 {available}개</Text>
                    <Text style={styles.progressLabelMuted}>전체 {total}개</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {!itemsLoading && items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={20} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>현재 대여 가능한 물품이 없습니다.</Text>
          </View>
        ) : null}

        {blacklistBanner.visible ? (
          <View style={styles.blacklistCard}>
            <Ionicons name="warning-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.blacklistText}>{blacklistBanner.label}</Text>
          </View>
        ) : null}

        <View style={styles.blacklistSection}>
          <Text style={styles.sectionTitle}>경고 누적 조회</Text>
          {blacklistError ? (
            <Pressable
              hitSlop={10}
              onPress={loadBlacklist}
              style={[styles.warningCard, styles.warningError]}
            >
              <Ionicons name="warning-outline" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
              <Text style={[styles.warningText, styles.warningTextError]}>{blacklistCardView.label}</Text>
              <Ionicons name="refresh" size={18} color={COLORS.danger} style={{ marginLeft: 8 }} />
            </Pressable>
          ) : (
            <View
              style={[
                styles.warningCard,
                blacklistCardView.type === 'blacklisted'
                  ? styles.warningActive
                  : blacklistCardView.type === 'loading'
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
                    blacklistCardView.type === 'blacklisted'
                      ? styles.warningTextActive
                      : styles.warningTextSafe,
                  ]}
                >
                  {blacklistCardView.label}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StatTone = 'default' | 'positive' | 'negative';

function StatPill({ label, value, tone = 'default' }: { label: string; value: number; tone?: StatTone }) {
  const toneColor = tone === 'positive' ? COLORS.primary : tone === 'negative' ? COLORS.danger : COLORS.text;
  return (
    <View style={[styles.statPill, { borderColor: toneColor }]}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={[styles.statPillValue, { color: toneColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 24,
  },
  cardList: {
    gap: CARD_GAP,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  errorText: {
    ...TYPO.bodySm,
    flex: 1,
    color: COLORS.danger,
  },
  errorActionIcon: {
    marginLeft: 4,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  loadingText: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  card: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  itemDesc: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
  },
  chipButtonPressed: {
    opacity: 0.9,
  },
  chipButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
  },
  statPillLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statPillValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...TYPO.caption,
    color: COLORS.text,
  },
  progressLabelMuted: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  blacklistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  blacklistText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  blacklistSection: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: COLORS.text,
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
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    paddingVertical: 40,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  emptyText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.textMuted,
  },
  actionPanel: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryAction: {
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionPressed: {
    opacity: 0.92,
  },
  primaryActionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryAction: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionPressed: {
    opacity: 0.9,
  },
  secondaryActionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.primary,
  },
});
