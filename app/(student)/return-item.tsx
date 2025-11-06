import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import CouncilHeader from '@/components/CouncilHeader';
import { generateReturnRentalQrToken } from '@/src/api/rental';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { ActiveRental, useMyActiveRentals } from './(tabs)/rental/hooks';

const EXPIRATION_SECONDS = 30;

type FetchState = 'idle' | 'loading' | 'success' | 'error';

const STATUS_META: Record<
  ActiveRental['status'],
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  IN_PROGRESS: { label: '대여중', bg: '#EEF2FF', text: COLORS.primary, icon: 'time-outline' },
  OVERDUE: { label: '연체', bg: '#FEE2E2', text: COLORS.danger, icon: 'alert-circle-outline' },
};

export default function StudentReturnItemScreen() {
  const params = useLocalSearchParams<{ rentalHistoryId?: string }>();
  const rawRentalHistoryId = Array.isArray(params.rentalHistoryId) ? params.rentalHistoryId[0] : params.rentalHistoryId;

  const rentalHistoryId = useMemo(() => {
    if (!rawRentalHistoryId) return null;
    const parsed = Number(rawRentalHistoryId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [rawRentalHistoryId]);

  const { rentals, isLoading: rentalsLoading, error: rentalsError, refetch } = useMyActiveRentals();

  const selectedRental = useMemo(() => {
    if (rentalHistoryId == null) return null;
    return rentals.find((item) => item.rentalHistoryId === rentalHistoryId) ?? null;
  }, [rentalHistoryId, rentals]);

  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [feePaid, setFeePaid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const requestToken = useCallback(async () => {
    if (rentalHistoryId == null) {
      setFetchState('error');
      setErrorMessage('대여 정보를 찾을 수 없어요. 목록에서 다시 시도해주세요.');
      setQrToken(null);
      setFeePaid(null);
      setExpiresAt(null);
      return;
    }

    setFetchState('loading');
    setErrorMessage(null);
    try {
      const result = await generateReturnRentalQrToken(rentalHistoryId);
      setQrToken(result.qrToken);
      setFeePaid(result.studentFeePaid);
      const issuedAt = Date.now();
      setExpiresAt(issuedAt + EXPIRATION_SECONDS * 1000);
      setNow(issuedAt);
      setFetchState('success');
    } catch (err) {
      console.warn('[student return QR] fetch failed', rentalHistoryId, err);
      setFetchState('error');
      setErrorMessage('QR 코드를 불러오지 못했어요. 다시 시도해주세요.');
      setQrToken(null);
      setFeePaid(null);
      setExpiresAt(null);
    }
  }, [rentalHistoryId]);

  useFocusEffect(
    useCallback(() => {
      requestToken();
      return undefined;
    }, [requestToken]),
  );

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const remainingSeconds = useMemo(() => {
    if (!expiresAt) return 0;
    const diff = Math.ceil((expiresAt - now) / 1000);
    return diff > 0 ? diff : 0;
  }, [expiresAt, now]);

  const isExpired = Boolean(expiresAt) && remainingSeconds === 0;
  const isLoading = fetchState === 'loading';

  const feeBadge = useMemo(() => {
    if (isLoading) {
      return { label: '확인중', background: COLORS.border, color: COLORS.textMuted };
    }
    if (feePaid === true) {
      return { label: '납부', background: COLORS.blue100, color: COLORS.primary };
    }
    if (feePaid === false) {
      return { label: '미납', background: 'rgba(239, 68, 68, 0.12)', color: COLORS.danger };
    }
    return { label: '확인중', background: COLORS.border, color: COLORS.textMuted };
  }, [feePaid, isLoading]);

  const timerLabel = useMemo(() => {
    if (rentalHistoryId == null) return '대여 정보 없음';
    if (isLoading) return '생성 중...';
    if (fetchState === 'error') return '생성 실패';
    if (isExpired) return '만료됨';
    if (remainingSeconds > 0) return `${remainingSeconds}초 뒤 만료`;
    return '';
  }, [fetchState, isExpired, isLoading, remainingSeconds, rentalHistoryId]);

  const handleRefresh = useCallback(() => {
    if (isLoading) return;
    requestToken();
    refetch();
  }, [isLoading, refetch, requestToken]);

  const selectedMeta = useMemo(() => {
    if (!selectedRental) return null;
    const meta = STATUS_META[selectedRental.status];
    return {
      status: meta,
      rentedAt: selectedRental.rentedAt,
      expectedReturnAt: selectedRental.expectedReturnAt,
    };
  }, [selectedRental]);

  const showRentalLoading = rentalsLoading && !selectedRental;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="반납 QR코드" showBack />

      <View style={styles.container}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>선택한 대여</Text>
          {rentalsError ? (
            <Pressable style={styles.errorBanner} onPress={() => refetch()} hitSlop={6}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{rentalsError.message}</Text>
              <Ionicons name="refresh" size={16} color={COLORS.danger} style={{ marginLeft: 6 }} />
            </Pressable>
          ) : null}

          {showRentalLoading ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : selectedRental && selectedMeta ? (
            <>
              <View style={styles.infoHeader}>
                <Text style={styles.itemName}>{selectedRental.itemName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: selectedMeta.status.bg }]}>
                  <Ionicons name={selectedMeta.status.icon} size={14} color={selectedMeta.status.text} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusBadgeText, { color: selectedMeta.status.text }]}>
                    {selectedMeta.status.label}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>대여 날짜</Text>
                  <Text style={styles.metaValue}>{selectedMeta.rentedAt}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>반납 마감</Text>
                  <Text style={styles.metaValue}>{selectedMeta.expectedReturnAt}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyMeta}>대여 정보를 확인할 수 없어요.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>반납 QR코드</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={[styles.qrWrapper, (isExpired || !qrToken) && styles.qrInactive]}>
            {isLoading && (
              <View style={styles.loader}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            )}
            {!isLoading && qrToken && (
              <QRCode
                value={qrToken}
                size={220}
                color={isExpired ? '#BFC4CF' : COLORS.text}
                backgroundColor="#FFFFFF"
              />
            )}
            {!isLoading && !qrToken && (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR을 가져오지 못했어요</Text>
              </View>
            )}
          </View>

          <View style={styles.timerRow}>
            <View style={[styles.timerBadge, isExpired && styles.timerBadgeExpired]}>
              <Text style={[styles.timerText, isExpired && styles.timerTextExpired]}>{timerLabel}</Text>
            </View>
            <Pressable
              onPress={handleRefresh}
              disabled={isLoading || rentalHistoryId == null}
              style={({ pressed }) => [
                styles.refreshButton,
                (isLoading || rentalHistoryId == null) && styles.refreshDisabled,
                pressed && !(isLoading || rentalHistoryId == null) && { opacity: 0.85 },
              ]}
              hitSlop={10}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={isLoading || rentalHistoryId == null ? COLORS.textMuted : COLORS.text}
              />
            </Pressable>
          </View>

          <View style={styles.statusBlock}>
            <Text style={styles.statusLabel}>학생 회비 납부 여부</Text>
            <View style={[styles.statusPill, { backgroundColor: feeBadge.background }]}>
              <Text style={[styles.statusText, { color: feeBadge.color }]}>{feeBadge.label}</Text>
            </View>
          </View>

          {fetchState === 'error' && errorMessage ? (
            <Pressable onPress={handleRefresh} style={styles.errorBannerWide} hitSlop={6}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  infoCard: {
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  infoLabel: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaCol: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F7F8FA',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  metaLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  emptyMeta: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  inlineLoader: {
    alignSelf: 'center',
  },
  errorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBannerText: {
    ...TYPO.bodySm,
    color: COLORS.danger,
    flexShrink: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  titleRow: {
    width: '100%',
    alignItems: 'flex-start',
    gap: 8,
  },
  sectionTitle: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  sectionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
  },
  qrWrapper: {
    width: 240,
    height: 240,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrInactive: {
    borderColor: '#D9DDE4',
  },
  loader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  qrPlaceholderText: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  timerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerBadge: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  timerBadgeExpired: {
    backgroundColor: '#E4E6EB',
  },
  timerText: {
    ...TYPO.bodySm,
    color: COLORS.text,
    textAlign: 'center',
  },
  timerTextExpired: {
    color: COLORS.textMuted,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    backgroundColor: COLORS.surface,
  },
  refreshDisabled: {
    opacity: 0.5,
  },
  statusBlock: {
    width: '100%',
    gap: 12,
  },
  statusLabel: {
    ...TYPO.body,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  statusPill: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  errorBannerWide: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
