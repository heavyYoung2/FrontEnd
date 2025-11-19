import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import {
  applyLocker,
  fetchLockersBySection,
  fetchMyLocker,
  LockerInfoApi,
  LockerStatusApi,
  MyLockerInfoApi,
} from '@/src/api/locker';

const SECTION_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
type SectionId = (typeof SECTION_LIST)[number];

const isSectionId = (value: string): value is SectionId => SECTION_LIST.includes(value as SectionId);

type LockerItem = {
  id: string;
  label: string;
  number: number;
  section: SectionId;
  status: LockerStatusApi;
  studentId?: string;
  studentName?: string;
};

type SectionState = {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  lockers: LockerItem[];
  counts: {
    my: number;
    inUse: number;
    available: number;
    broken: number;
  };
  error?: string;
};

const EMPTY_SECTION: SectionState = {
  status: 'idle',
  lockers: [],
  counts: { my: 0, inUse: 0, available: 0, broken: 0 },
};

const STATUS_THEME: Record<string, { bg: string; border: string; text: string; label: string }> = {
  MY: {
    bg: '#DBEAFE',
    border: '#BFDBFE',
    text: COLORS.primary,
    label: '내 사물함',
  },
  IN_USE: {
    bg: '#E5E7EB',
    border: '#D1D5DB',
    text: '#374151',
    label: '사용중',
  },
  AVAILABLE: {
    bg: '#DCFCE7',
    border: '#A7F3D0',
    text: '#15803D',
    label: '사용 가능',
  },
  BROKEN: {
    bg: '#FEE2E2',
    border: '#FECACA',
    text: COLORS.danger,
    label: '사용 불가',
  },
};

const buildInitialStates = () =>
  SECTION_LIST.reduce((acc, section) => {
    acc[section] = { ...EMPTY_SECTION };
    return acc;
  }, {} as Record<SectionId, SectionState>);

const parseLockerLocation = (value?: string | number | null) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const sectionKey = raw.charAt(0).toUpperCase();
  if (!isSectionId(sectionKey)) return null;
  const numeric = parseInt(raw.slice(1).replace(/[^0-9]/g, ''), 10);
  if (Number.isNaN(numeric)) return null;
  return { section: sectionKey as SectionId, number: numeric };
};

const getPreferredSection = (info?: MyLockerInfoApi | null): SectionId | null => {
  if (!info) return null;
  const parsed = parseLockerLocation(info.lockerNumber ?? info.lockerName);
  if (parsed) return parsed.section;
  const fallback = info.lockerSection?.charAt(0).toUpperCase();
  if (fallback && isSectionId(fallback)) return fallback;
  return null;
};

const normalizeLockers = (raw: LockerInfoApi[]): LockerItem[] =>
  raw
    .map((item) => {
      const locationSource =
        item.location ||
        item.lockerNumber ||
        item.lockerNum ||
        item.lockerName ||
        item.sectionName ||
        (item.lockerSection
          ? `${item.lockerSection}${
              item.lockerNumber ?? item.lockerNo ?? item.lockerNum ?? item.lockerId ?? ''
            }`
          : null);
      if (!locationSource) return null;
      const normalizedLocation = String(locationSource);
      const sectionId = normalizedLocation.charAt(0).toUpperCase();
      if (!isSectionId(sectionId)) return null;
      const number = parseInt(normalizedLocation.slice(1), 10);
      if (Number.isNaN(number)) return null;
      const statusUpper = (item.lockerStatus ?? item.status ?? 'AVAILABLE').toUpperCase();

      const base: LockerItem = {
        id: String(item.lockerId ?? item.id ?? `${sectionId}-${number}`),
        label: `${sectionId}-${number}`,
        number,
        section: sectionId,
        status: (statusUpper as LockerStatusApi) ?? 'AVAILABLE',
      };

      if (item.studentId) base.studentId = item.studentId;
      if (item.studentName) base.studentName = item.studentName;
      if (item.owner) {
        base.studentId = item.owner.studentId ?? base.studentId;
        base.studentName = item.owner.name ?? base.studentName;
      }

      if (statusUpper === 'BROKEN' || statusUpper === 'CANT_USE' || statusUpper === 'UNAVAILABLE') {
        base.status = 'BROKEN';
      } else if (statusUpper === 'IN_USE') {
        base.status = 'IN_USE';
      } else if (statusUpper === 'MY') {
        base.status = 'MY';
      } else {
        base.status = 'AVAILABLE';
      }

      return base;
    })
    .filter((item): item is LockerItem => item !== null)
    .sort((a, b) => a.number - b.number);

const summarizeLockers = (lockers: LockerItem[]) =>
  lockers.reduce(
    (acc, locker) => {
      const status = locker.status.toUpperCase();
      if (status === 'MY') acc.my += 1;
      else if (status === 'IN_USE') acc.inUse += 1;
      else if (status === 'AVAILABLE') acc.available += 1;
      else if (status === 'BROKEN') acc.broken += 1;
      return acc;
    },
    { my: 0, inUse: 0, available: 0, broken: 0 },
  );

export default function StudentLockerScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const [sectionStates, setSectionStates] = useState<Record<SectionId, SectionState>>(() => buildInitialStates());
  const [selectedSection, setSelectedSection] = useState<SectionId>('A');
  const [modalVisible, setModalVisible] = useState(false);
  const [myLocker, setMyLocker] = useState<MyLockerInfoApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadSection = useCallback(async (section: SectionId) => {
    setSectionStates((prev) => ({
      ...prev,
      [section]: { ...prev[section], status: 'loading', error: undefined },
    }));
    try {
      const raw = await fetchLockersBySection(section);
      const lockers = normalizeLockers(raw);
      const counts = summarizeLockers(lockers);
      setSectionStates((prev) => ({
        ...prev,
        [section]: { status: 'loaded', lockers, counts },
      }));
    } catch (e: any) {
      console.warn('[student-locker] fetch fail', e);
      const message = e?.response?.data?.message || e?.message || '사물함 정보를 불러오지 못했습니다.';
      setSectionStates((prev) => ({
        ...prev,
        [section]: { ...prev[section], status: 'error', error: message },
      }));
      Alert.alert('오류', message);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(SECTION_LIST.map((section) => loadSection(section)));
    } finally {
      setRefreshing(false);
    }
  }, [loadSection]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const loadLocker = useCallback(async () => {
    try {
      setError(null);
      const myInfo = await fetchMyLocker();
      setMyLocker(myInfo);
      const preferred = getPreferredSection(myInfo);
      if (preferred) setSelectedSection(preferred);
    } catch (e: any) {
      console.warn('[student-locker] my locker fetch fail', e);
      setError(e?.response?.data?.message || e?.message || '나의 사물함 정보를 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    loadLocker();
  }, [loadLocker]);

  const statusChips = useMemo(
    () =>
      (['MY', 'IN_USE', 'AVAILABLE', 'BROKEN'] as const).map((key) => ({
        key,
        theme: STATUS_THEME[key],
      })),
    [],
  );

  const sectionSummaries = useMemo(
    () =>
      SECTION_LIST.map((section) => {
        const state = sectionStates[section] ?? EMPTY_SECTION;
        return {
          section,
          counts: state.counts,
          status: state.status,
          error: state.error,
        };
      }),
    [sectionStates],
  );

  const aggregateCounts = useMemo(
    () =>
      SECTION_LIST.reduce(
        (acc, section) => {
          const state = sectionStates[section];
          if (!state || state.status !== 'loaded') return acc;
          acc.my += state.counts.my;
          acc.inUse += state.counts.inUse;
          acc.available += state.counts.available;
          acc.broken += state.counts.broken;
          acc.total += state.counts.my + state.counts.inUse + state.counts.available + state.counts.broken;
          return acc;
        },
        { total: 0, my: 0, inUse: 0, available: 0, broken: 0 },
      ),
    [sectionStates],
  );

  const selectedState = sectionStates[selectedSection] ?? EMPTY_SECTION;

  const handleOpenSection = (section: SectionId) => {
    setSelectedSection(section);
    const current = sectionStates[section];
    if (!current || current.status === 'idle' || current.status === 'error') {
      loadSection(section);
    }
    setModalVisible(true);
  };

  const submitLockerApplication = useCallback(async () => {
    try {
      setApplying(true);
      await applyLocker();
      Alert.alert('신청 완료', '사물함 신청이 접수되었습니다. 결과는 알림으로 안내됩니다.');
      await loadLocker();
      await handleRefresh();
    } catch (e: any) {
      console.warn('[student-locker] apply fail', e);
      Alert.alert('신청 실패', e?.response?.data?.message || e?.message || '사물함 신청에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  }, [handleRefresh, loadLocker]);

  const myLockerLabel = useMemo(() => myLocker?.lockerNumber ?? myLocker?.lockerName ?? '-', [myLocker]);
  const rawMyLockerStatus = (myLocker?.lockerRentalStatus ?? myLocker?.status)?.toUpperCase();
  const myStatusKey: keyof typeof STATUS_THEME =
    rawMyLockerStatus === 'RENTING' ? 'MY' : rawMyLockerStatus === 'RENTAL_REQUESTED' ? 'IN_USE' : 'AVAILABLE';
  const canApply = rawMyLockerStatus !== 'RENTING' && rawMyLockerStatus !== 'RENTAL_REQUESTED';
  const applyHelperText = rawMyLockerStatus === 'RENTING'
    ? '이미 사물함을 사용 중입니다.'
    : '현재 사물함 신청이 처리 중입니다.';

  const handleApply = () => {
    if (!canApply) {
      Alert.alert('신청 불가', applyHelperText);
      return;
    }

    if (applying) {
      Alert.alert('처리중', '이전 신청 요청을 처리하고 있습니다.');
      return;
    }

    Alert.alert(
      '사물함 신청',
      '사물함 신청을 진행할까요? 신청 이후 배정 시 결과를 안내드립니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: submitLockerApplication },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="나의 사물함" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 140 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        )}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.myLockerCard}>
          <View style={styles.myLockerHeader}>
            <Text style={styles.sectionLabel}>나의 사물함</Text>
            <Pressable
              onPress={handleApply}
              disabled={!canApply || applying}
              style={({ pressed }) => [
                styles.applyButton,
                (!canApply || applying) && styles.applyButtonDisabled,
                pressed && canApply && !applying && { opacity: 0.9 },
              ]}
            >
              <Text
                style={[
                  styles.applyButtonText,
                  (!canApply || applying) && { color: '#94A3B8' },
                ]}
              >
                {applying
                  ? '신청 중...'
                  : canApply
                    ? '사물함 신청하기'
                    : rawMyLockerStatus === 'RENTAL_REQUESTED'
                      ? '신청 처리중'
                      : '대여중'}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.myLockerBody,
              {
                backgroundColor: STATUS_THEME[myStatusKey].bg,
                borderColor: STATUS_THEME[myStatusKey].border,
              },
            ]}
          >
            <Text style={[styles.myLockerId, { color: STATUS_THEME[myStatusKey].text }]}>{myLockerLabel}</Text>
            <Text style={[styles.myLockerStatus, { color: STATUS_THEME[myStatusKey].text }]}>{{
              RENTING: '대여중',
              RENTAL_REQUESTED: '대여 신청 접수',
            }[rawMyLockerStatus as 'RENTING' | 'RENTAL_REQUESTED'] || '신청 가능'}</Text>
          </View>

          <Text style={styles.myLockerNote}>
            {rawMyLockerStatus === 'RENTING'
              ? '현재 사용 중인 사물함입니다. 이용 규칙을 꼭 지켜주세요.'
              : rawMyLockerStatus === 'RENTAL_REQUESTED'
                ? '신청이 접수되어 배정 순서를 기다리고 있습니다.'
                : '아직 배정받은 사물함이 없습니다. 원하는 구역을 확인해 신청해 보세요.'}
          </Text>
        </View>

        <View style={styles.legendCard}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>사물함 상태</Text>
            <Text style={styles.legendTotal}>
              전체: {aggregateCounts.total}개 | 사용 가능: {aggregateCounts.available}개 | 사용 불가: {aggregateCounts.broken}개
            </Text>
          </View>
          <View style={styles.legendRow}>
            {statusChips.map(({ key, theme }) => (
              <View key={key} style={[styles.legendSummaryChip, { borderColor: theme.border }]}>
                <View style={[styles.legendSummaryDot, { backgroundColor: theme.text }]} />
                <Text style={[styles.legendSummaryLabel, { color: theme.text }]}>{theme.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionGrid}>
          {sectionSummaries.map(({ section, counts, status, error: sectionError }) => (
            <Pressable
              key={section}
              onPress={() => handleOpenSection(section)}
              style={({ pressed }) => [
                styles.sectionCard,
                selectedSection === section && styles.sectionCardActive,
                pressed && styles.sectionCardPressed,
              ]}
            >
              <View style={styles.sectionCardHeader}>
                <Text style={styles.sectionName}>{section} 구역</Text>
                <Text style={styles.sectionTotal}>
                  {status === 'loaded'
                    ? `${counts.my + counts.inUse + counts.available + counts.broken}칸`
                    : status === 'loading'
                      ? '불러오는 중'
                      : '미확인'}
                </Text>
              </View>

              <View style={styles.sectionStats}>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.IN_USE.text }]}>사용중 {counts.inUse}</Text>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.AVAILABLE.text }]}>사용 가능 {counts.available}</Text>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.BROKEN.text }]}>사용 불가 {counts.broken}</Text>
                {counts.my > 0 && (
                  <Text style={[styles.sectionStat, { color: STATUS_THEME.MY.text }]}>내 사물함 {counts.my}</Text>
                )}

                {status === 'loading' && (
                  <View style={styles.sectionLoadingRow}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.sectionLoadingText}>불러오는 중...</Text>
                  </View>
                )}

                {status === 'error' && (
                  <Text style={[styles.sectionLoadingText, { color: COLORS.danger }]}>
                    {sectionError || '오류가 발생했습니다.'}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionHint}>구역을 눌러 상세 사물함 상태를 확인하세요.</Text>
      </ScrollView>

      <LockerSectionModal
        section={selectedSection}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        state={selectedState}
        onReload={() => loadSection(selectedSection)}
      />
    </SafeAreaView>
  );
}

type SectionModalProps = {
  section: SectionId;
  visible: boolean;
  onClose: () => void;
  state: SectionState;
  onReload: () => void;
};

function LockerSectionModal({ section, visible, onClose, state, onReload }: SectionModalProps) {
  const themeKeys = ['MY', 'IN_USE', 'AVAILABLE', 'BROKEN'] as const;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{section} 구역 사물함</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn}>
              <Text style={{ color: COLORS.text, fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.modalLegend}>
            {themeKeys.map((key) => {
              const theme = STATUS_THEME[key];
              return (
                <View key={key} style={[styles.legendChip, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.legendText, { color: theme.text }]}>{theme.label}</Text>
                </View>
              );
            })}
          </View>

          {state.status === 'loading' && (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.modalLoadingText}>사물함 정보를 불러오는 중입니다...</Text>
            </View>
          )}

          {state.status === 'error' && (
            <View style={styles.modalLoading}>
              <Text style={styles.modalLoadingText}>사물함을 불러오지 못했습니다.</Text>
              <Pressable onPress={onReload} style={styles.reloadBtn}>
                <Text style={styles.reloadBtnText}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {state.status === 'loaded' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <View style={styles.lockersWrap}>
                {state.lockers.map((locker) => {
                  const theme =
                    STATUS_THEME[locker.status.toUpperCase() as keyof typeof STATUS_THEME] ?? STATUS_THEME.AVAILABLE;
                  return (
                    <View
                      key={locker.id}
                      style={[styles.lockerTile, { borderColor: theme.border, backgroundColor: theme.bg }]}
                    >
                      <Text style={[styles.lockerLabel, { color: theme.text }]}>{locker.label}</Text>
                      <Text style={[styles.lockerStatus, { color: theme.text }]}>{theme.label}</Text>
                      {locker.studentName ? (
                        <>
                          <Text style={styles.lockerMeta}>{locker.studentName}</Text>
                          {locker.studentId ? <Text style={styles.lockerMetaSecondary}>{locker.studentId}</Text> : null}
                        </>
                      ) : (
                        <Text style={styles.lockerMetaSecondary}>신청자 없음</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 18,
  },
  errorBanner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#B91C1C',
  },
  myLockerCard: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  myLockerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  applyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  applyButtonDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5F5',
  },
  applyButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.primary,
  },
  myLockerBody: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  myLockerId: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 28,
  },
  myLockerStatus: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
  },
  myLockerNote: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  legendCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E6F2',
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: 12,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  legendTotal: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 10,
    color: '#6B7280',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
  },
  legendSummaryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#F9FAFB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  legendSummaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendSummaryLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
  },
  legendChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  legendText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionCard: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EAF2',
    gap: 12,
  },
  sectionCardActive: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionCardPressed: {
    opacity: 0.9,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  sectionTotal: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  sectionStats: {
    gap: 6,
  },
  sectionStat: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
  },
  sectionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sectionLoadingText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  sectionHint: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 20,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    padding: 20,
    maxHeight: '88%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 20,
    color: COLORS.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 28,
  },
  modalLoadingText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  reloadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  reloadBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  lockersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    columnGap: 0,
    paddingHorizontal: 4,
    paddingBottom: 8,
    paddingTop: 4,
  },
  lockerTile: {
    flexBasis: '30%',
    maxWidth: '30%',
    minWidth: 90,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 5,
  },
  lockerLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
  },
  lockerStatus: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
  },
  lockerMeta: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 11,
    color: '#475569',
  },
  lockerMetaSecondary: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 11,
    color: '#6B7280',
  },
});
