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
import { generateRentalQrToken } from '@/src/api/rental';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { useRentalDashboard } from './(tabs)/rental/hooks';

const EXPIRATION_SECONDS = 30;

type FetchState = 'idle' | 'loading' | 'success' | 'error';

export default function StudentRentItemScreen() {
  const params = useLocalSearchParams<{ itemId?: string }>();
  const rawItemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  const { items } = useRentalDashboard();

  const selectedItem = useMemo(() => {
    if (!rawItemId) return null;
    return (
      items.find((item) => String(item.categoryId) === rawItemId) ??
      items.find((item) => item.id === rawItemId)
    );
  }, [items, rawItemId]);

  const itemCategoryId = useMemo(() => {
    if (selectedItem) return selectedItem.categoryId;
    if (!rawItemId) return null;
    const parsed = Number(rawItemId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [rawItemId, selectedItem]);

  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [studentFeePaid, setStudentFeePaid] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const requestToken = useCallback(async () => {
    if (itemCategoryId == null) {
      setFetchState('error');
      setErrorMessage('대여 물품 정보를 찾을 수 없어요.');
      setQrToken(null);
      setStudentFeePaid(null);
      setExpiresAt(null);
      return;
    }

    setFetchState('loading');
    setErrorMessage(null);
    try {
      const result = await generateRentalQrToken(itemCategoryId);
      setQrToken(result.qrToken);
      setStudentFeePaid(result.studentFeePaid);
      const issuedAt = Date.now();
      setExpiresAt(issuedAt + EXPIRATION_SECONDS * 1000);
      setNow(issuedAt);
      setFetchState('success');
    } catch (err) {
      console.warn('[student rental QR] fetch failed', itemCategoryId, err);
      setFetchState('error');
      setErrorMessage('QR 코드를 불러오지 못했어요. 다시 시도해주세요.');
      setQrToken(null);
      setStudentFeePaid(null);
      setExpiresAt(null);
    }
  }, [itemCategoryId]);

  useFocusEffect(
    useCallback(() => {
      requestToken();
      return undefined;
    }, [requestToken]),
  );

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 500);
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
    if (studentFeePaid === true) {
      return { label: '납부', background: COLORS.blue100, color: COLORS.primary };
    }
    if (studentFeePaid === false) {
      return { label: '미납', background: 'rgba(239, 68, 68, 0.12)', color: COLORS.danger };
    }
    return { label: '확인중', background: COLORS.border, color: COLORS.textMuted };
  }, [isLoading, studentFeePaid]);

  const timerLabel = useMemo(() => {
    if (itemCategoryId == null) return '물품 정보 없음';
    if (isLoading) return '생성 중...';
    if (fetchState === 'error') return '생성 실패';
    if (isExpired) return '만료됨';
    if (remainingSeconds > 0) return `${remainingSeconds}초 뒤 만료`;
    return '';
  }, [fetchState, isExpired, isLoading, itemCategoryId, remainingSeconds]);

  const handleRefresh = useCallback(() => {
    if (isLoading || itemCategoryId == null) return;
    requestToken();
  }, [isLoading, itemCategoryId, requestToken]);

  const itemMeta = useMemo(() => {
    if (!selectedItem) return null;
    return `대여 가능 ${selectedItem.availableCount}개 · 전체 ${selectedItem.totalCount}개`;
  }, [selectedItem]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="대여 QR코드" showBack />

      <View style={styles.container}>
        <View style={styles.itemCard}>
          <Text style={styles.itemLabel}>선택한 물품</Text>
          <Text style={styles.itemName}>{selectedItem ? selectedItem.name : '알 수 없는 물품'}</Text>
          {selectedItem?.description ? (
            <Text style={styles.itemDesc}>{selectedItem.description}</Text>
          ) : null}
          {itemMeta ? <Text style={styles.itemMeta}>{itemMeta}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>QR코드</Text>
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
              disabled={isLoading || itemCategoryId == null}
              style={({ pressed }) => [
                styles.refreshButton,
                (isLoading || itemCategoryId == null) && styles.refreshDisabled,
                pressed && !(isLoading || itemCategoryId == null) && { opacity: 0.85 },
              ]}
              hitSlop={10}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={isLoading || itemCategoryId == null ? COLORS.textMuted : COLORS.text}
              />
            </Pressable>
          </View>

          <View style={styles.statusBlock}>
            <Text style={styles.statusLabel}>학생 회비 납부 여부</Text>
            <View style={[styles.statusBadge, { backgroundColor: feeBadge.background }]}>
              <Text style={[styles.statusText, { color: feeBadge.color }]}>{feeBadge.label}</Text>
            </View>
          </View>

          {fetchState === 'error' && errorMessage && (
            <Pressable onPress={handleRefresh} style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Pressable>
          )}
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
  itemCard: {
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  itemLabel: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  itemName: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  itemDesc: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  itemMeta: {
    ...TYPO.caption,
    color: COLORS.textMuted,
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
  statusBadge: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  errorBanner: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    ...TYPO.bodySm,
    color: COLORS.danger,
    flexShrink: 1,
  },
});
