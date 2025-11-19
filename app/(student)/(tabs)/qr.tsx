import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';
import { generateStudentFeeQrToken, StudentFeeStatus } from '../../../src/api/studentFee';

const EXPIRATION_SECONDS = 30;

type FetchState = 'idle' | 'loading' | 'success' | 'error';

export default function StudentQRScreen() {
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [feeStatus, setFeeStatus] = useState<StudentFeeStatus | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const requestToken = useCallback(async (): Promise<StudentFeeStatus | null> => {
    setFetchState('loading');
    setErrorMessage(null);
    try {
      const result = await generateStudentFeeQrToken();
      setQrToken(result.qrToken);
      setFeeStatus(result.studentFeeStatus);
      const issuedAt = Date.now();
      setExpiresAt(issuedAt + EXPIRATION_SECONDS * 1000);
      setNow(issuedAt);
      setFetchState('success');
      return result.studentFeeStatus;
    } catch (err) {
      console.warn('[student fee QR] fetch failed', err);
      setFetchState('error');
      setErrorMessage('QR 코드를 불러오지 못했어요. 다시 시도해주세요.');
      setQrToken(null);
      setFeeStatus(null);
      setExpiresAt(null);
      return null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      requestToken();
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
      return { label: '납부 완료', background: COLORS.blue100, color: COLORS.primary };
    }
    switch (feeStatus) {
      case 'PAID':
        return { label: '납부 완료', background: COLORS.blue100, color: COLORS.primary };
      case 'NOT_PAID':
        return { label: '미납', background: 'rgba(239, 68, 68, 0.12)', color: COLORS.danger };
      case 'YET':
        return { label: '확인전', background: COLORS.border, color: COLORS.textMuted };
      default:
        return { label: '확인전', background: COLORS.border, color: COLORS.textMuted };
    }
  }, [feeStatus, isLoading]);

  const timerLabel = useMemo(() => {
    if (isLoading) return '생성 중...';
    if (fetchState === 'error') return '생성 실패';
    if (isExpired) return '만료됨';
    if (remainingSeconds > 0) return `${remainingSeconds}초 뒤 만료`;
    return '';
  }, [fetchState, isExpired, isLoading, remainingSeconds]);

  const handleRefresh = useCallback(() => {
    if (isLoading) return;
    requestToken();
  }, [isLoading, requestToken]);

  const showDuesButton = !isLoading && feeStatus !== 'PAID';

  const handleOpenDuesCheck = useCallback(async () => {
    if (isLoading) return;
    const status = await requestToken();
    if (status === 'NOT_PAID') {
      setToast('학생회비 미납 대상입니다. 회비 납부는 학생회에 문의해주세요');
      toastOpacity.setValue(0);
      Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start(() => {
        setTimeout(() => {
          Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
            setToast(null),
          );
        }, 800);
      });
    }
  }, [isLoading, requestToken, toastOpacity]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="QR코드" />

      <View style={styles.container}>
        <View style={styles.card}>

          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>QR코드</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={[styles.qrWrapper, isExpired && styles.qrExpired]}>
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
            {isExpired && qrToken && (
              <View style={styles.expiredOverlay}>
                <View style={styles.expiredMessage}>
                  <Text style={styles.expiredMessageTitle}>만료된 QR코드</Text>
                  <Text style={styles.expiredMessageDesc}>새로고침으로 다시 발급받아주세요.</Text>
                  <Pressable
                    onPress={handleRefresh}
                    style={({ pressed }) => [
                      styles.expiredRefreshButton,
                      pressed && !isLoading && { opacity: 0.85 },
                      isLoading && styles.refreshDisabled,
                    ]}
                    disabled={isLoading}
                    hitSlop={8}
                  >
                    <Text style={styles.expiredRefreshText}>새로고침</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <View style={styles.timerRow}>
            <View style={[styles.timerBadge, isExpired && styles.timerBadgeExpired]}>
              <Text style={[styles.timerText, isExpired && styles.timerTextExpired]}>{timerLabel}</Text>
            </View>
            <Pressable
              onPress={handleRefresh}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.refreshButton,
                isLoading && styles.refreshDisabled,
                pressed && !isLoading && { opacity: 0.8 },
              ]}
              hitSlop={10}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={isLoading ? COLORS.textMuted : COLORS.text}
              />
            </Pressable>
          </View>

          <View style={styles.statusBlock}>
            <Text style={styles.statusLabel}>학생 회비 납부 여부</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: feeBadge.background }]}>
                <Text style={[styles.statusText, { color: feeBadge.color }]}>{feeBadge.label}</Text>
              </View>
              {showDuesButton ? (
                <Pressable
                  hitSlop={6}
                  onPress={handleOpenDuesCheck}
                  style={({ pressed }) => [styles.statusButton, pressed && { opacity: 0.92 }]}
                >
                  <Text style={styles.statusButtonText}>확인하기</Text>
                </Pressable>
              ) : null}
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
      {toast && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <Animated.View style={[styles.toastCard, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        </View>
      )}
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
  qrExpired: {
    borderColor: '#D9DDE4',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 250, 253, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  expiredMessage: {
    alignItems: 'center',
    gap: 8,
  },
  expiredMessageTitle: {
    ...TYPO.body,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  expiredMessageDesc: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  expiredRefreshButton: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  expiredRefreshText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
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
  statusRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  statusButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
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
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  toastCard: {
    minWidth: '70%',
    maxWidth: 360,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(46,70,240,0.92)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastText: {
    ...TYPO.body,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
