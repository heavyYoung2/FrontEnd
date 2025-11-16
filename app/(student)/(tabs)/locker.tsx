import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import {
  applyLocker,
  fetchLockersBySection,
  fetchMyLocker,
  LockerInfoApi,
  LockerStatusApi,
  MyLockerInfoApi,
} from '@/src/api/locker';

const SECTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type LockerStatus = 'mine' | 'inUse' | 'available' | 'pending' | 'broken';

type LockerCell = {
  id: string;
  label: string;
  status: LockerStatus;
};

type SectionState = {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  lockers: LockerCell[];
  counts: {
    mine: number;
    inUse: number;
    available: number;
    broken: number;
  };
  error?: string | null;
};

const STATUS_THEME: Record<LockerStatus, { bg: string; border: string; text: string; label: string }> = {
  mine: {
    bg: '#DBEAFE',
    border: '#BFDBFE',
    text: COLORS.primary,
    label: '내 사물함',
  },
  inUse: {
    bg: '#FEE2E2',
    border: '#FECACA',
    text: '#B91C1C',
    label: '사용중',
  },
  available: {
    bg: '#DCFCE7',
    border: '#A7F3D0',
    text: '#15803D',
    label: '신청 가능',
  },
  pending: {
    bg: '#FEF9C3',
    border: '#FDE68A',
    text: '#B45309',
    label: '대여 신청중',
  },
  broken: {
    bg: '#E5E7EB',
    border: '#D1D5DB',
    text: '#4B5563',
    label: '사용 불가',
  },
};

const createEmptySectionState = (): SectionState => ({
  status: 'idle',
  lockers: [],
  counts: { mine: 0, inUse: 0, available: 0, broken: 0 },
});

const buildInitialSectionStates = () =>
  SECTION_KEYS.reduce((acc, key) => {
    acc[key] = createEmptySectionState();
    return acc;
  }, {} as Record<SectionKey, SectionState>);

const SECTION_STATE_FALLBACK: SectionState = {
  status: 'idle',
  lockers: [],
  counts: { mine: 0, inUse: 0, available: 0, broken: 0 },
};

const mapApiLockerStatus = (value?: LockerStatusApi | string | null): LockerStatus => {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'MY') return 'mine';
  if (normalized === 'IN_USE') return 'inUse';
  if (normalized === 'BROKEN') return 'broken';
  return 'available';
};

function parseLockerLocation(value?: string | number | null) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const sectionChar = raw.charAt(0).toUpperCase();
  if (!SECTION_KEYS.includes(sectionChar as SectionKey)) return null;
  const numericPart = raw.slice(1).replace(/[^0-9]/g, '');
  const number = parseInt(numericPart, 10);
  if (Number.isNaN(number)) return null;
  return {
    section: sectionChar as SectionKey,
    number,
  };
}

function getMyLockerTarget(myLocker: MyLockerInfoApi | null) {
  if (!myLocker) return null;
  const status = (myLocker.lockerRentalStatus ?? myLocker.status)?.toUpperCase();
  if (status !== 'RENTING') return null;
  const parsed = parseLockerLocation(myLocker.lockerNumber ?? myLocker.lockerName);
  if (parsed) {
    return { section: parsed.section, number: parsed.number };
  }
  if (myLocker.lockerSection) {
    const sectionChar = myLocker.lockerSection.toUpperCase();
    if (SECTION_KEYS.includes(sectionChar as SectionKey)) {
      const numeric = parseInt(String(myLocker.lockerNumber ?? myLocker.lockerName ?? '').replace(/[^0-9]/g, ''), 10);
      if (!Number.isNaN(numeric)) {
        return { section: sectionChar as SectionKey, number: numeric };
      }
    }
  }
  return null;
}

function normalizeSectionLockers(raw: LockerInfoApi[], myLockerInfo?: MyLockerInfoApi | null) {
  const target = getMyLockerTarget(myLockerInfo ?? null);
  const counts = { mine: 0, inUse: 0, available: 0, broken: 0 };

  const lockers = raw
    .map((item) => {
      const locationSource =
        item.lockerName ||
        item.lockerNumber ||
        item.lockerNum ||
        item.lockerNo ||
        item.sectionName ||
        (item.lockerSection
          ? `${item.lockerSection}${item.lockerNumber ?? item.lockerNum ?? item.lockerNo ?? item.lockerId ?? ''}`
          : null);

      let parsed = parseLockerLocation(locationSource);
      if (!parsed && item.lockerSection) {
        const numericSource = item.lockerNumber ?? item.lockerNum ?? item.lockerNo ?? item.lockerId ?? null;
        const numeric = numericSource ? parseInt(String(numericSource).replace(/[^0-9]/g, ''), 10) : NaN;
        if (!Number.isNaN(numeric)) {
          const sectionChar = item.lockerSection.trim().charAt(0).toUpperCase();
          if (SECTION_KEYS.includes(sectionChar as SectionKey)) {
            parsed = { section: sectionChar as SectionKey, number: numeric };
          }
        }
      }

      if (!parsed) return null;
      return {
        id: String(item.lockerId ?? `${parsed.section}-${parsed.number}`),
        section: parsed.section,
        number: parsed.number,
        status: mapApiLockerStatus(item.lockerStatus),
      };
    })
    .filter((item): item is { id: string; section: SectionKey; number: number; status: LockerStatus } => item !== null)
    .sort((a, b) => a.number - b.number)
    .map((locker) => {
      let status = locker.status;
      if (target && locker.section === target.section && locker.number === target.number) {
        status = 'mine';
      }

      if (status === 'mine') counts.mine += 1;
      else if (status === 'inUse') counts.inUse += 1;
      else if (status === 'broken') counts.broken += 1;
      else counts.available += 1;

      return {
        id: locker.id,
        label: `${locker.section}${locker.number}`,
        status,
      };
    });

  return { lockers, counts };
}

function mapStatus(apiStatus: string | undefined): LockerStatus {
  switch (apiStatus) {
    case 'RENTING':
      return 'mine';
    case 'RENTAL_REQUESTED':
      return 'pending';
    default:
      return 'available';
  }
}

export default function StudentLockerScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const [selectedSection, setSelectedSection] = useState<SectionKey>('A');
  const [sectionStates, setSectionStates] = useState<Record<SectionKey, SectionState>>(() =>
    buildInitialSectionStates(),
  );
  const [myLocker, setMyLocker] = useState<MyLockerInfoApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  const selectedSectionRef = useRef<SectionKey>('A');
  const myLockerRef = useRef<MyLockerInfoApi | null>(null);

  useEffect(() => {
    selectedSectionRef.current = selectedSection;
  }, [selectedSection]);

  useEffect(() => {
    myLockerRef.current = myLocker;
  }, [myLocker]);

  const statusChips = useMemo(() => (
    (['mine', 'inUse', 'available', 'broken'] as LockerStatus[]).map((key) => ({
      key,
      theme: STATUS_THEME[key],
    }))
  ), []);

  const loadSection = useCallback(async (section: SectionKey, lockerOverride?: MyLockerInfoApi | null) => {
    setSectionStates((prev) => ({
      ...prev,
      [section]: { ...prev[section], status: 'loading', error: null },
    }));
    try {
      const raw = await fetchLockersBySection(section);
      const normalized = normalizeSectionLockers(raw, lockerOverride ?? myLockerRef.current);
      setSectionStates((prev) => ({
        ...prev,
        [section]: {
          status: 'loaded',
          lockers: normalized.lockers,
          counts: normalized.counts,
          error: null,
        },
      }));
    } catch (e: any) {
      setSectionStates((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          status: 'error',
          error: e?.response?.data?.message || e?.message || '사물함 정보를 불러오지 못했습니다.',
        },
      }));
    }
  }, []);

  const loadLocker = useCallback(async () => {
    try {
      setError(null);
      const myInfo = await fetchMyLocker();
      setMyLocker(myInfo);

      const nextSection = (() => {
        const parsed = parseLockerLocation(myInfo?.lockerNumber ?? myInfo?.lockerName);
        if (parsed) return parsed.section;
        const candidate = myInfo?.lockerSection?.toUpperCase();
        if (candidate && SECTION_KEYS.includes(candidate as SectionKey)) {
          return candidate as SectionKey;
        }
        return selectedSectionRef.current;
      })();

      setSelectedSection(nextSection);
      await loadSection(nextSection, myInfo);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || '사물함 정보를 불러오지 못했습니다.');
      await loadSection(selectedSectionRef.current);
    }
  }, [loadSection]);

  useEffect(() => {
    loadLocker();
  }, [loadLocker]);

  const sectionSummaries = useMemo(
    () =>
      SECTION_KEYS.map((key) => {
        const state = sectionStates[key] ?? SECTION_STATE_FALLBACK;
        return {
          section: key,
          counts: state.counts,
          status: state.status,
          error: state.error,
        };
      }),
    [sectionStates],
  );

  const selectedState = sectionStates[selectedSection] ?? SECTION_STATE_FALLBACK;

  const handleSelectSection = (key: SectionKey) => {
    setSelectedSection(key);
    const state = sectionStates[key];
    if (!state || state.status === 'idle' || state.status === 'error') {
      loadSection(key);
    }
  };

  const submitLockerApplication = useCallback(async () => {
    try {
      setApplying(true);
      await applyLocker();
      Alert.alert('신청 완료', '사물함 신청이 접수되었습니다. 결과는 알림으로 안내됩니다.');
      await loadLocker();
    } catch (e: any) {
      console.warn('[student-locker] apply fail', e);
      Alert.alert('신청 실패', e?.response?.data?.message || e?.message || '사물함 신청에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  }, [loadLocker]);

  const myLockerLabel = useMemo(() => myLocker?.lockerNumber ?? myLocker?.lockerName ?? '-', [myLocker]);

  const rawMyLockerStatus = (myLocker?.lockerRentalStatus ?? myLocker?.status)?.toUpperCase();
  const myStatus = mapStatus(rawMyLockerStatus);
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
      '다음 정보로 사물함을 신청하시겠습니까? 신청 이후 배정 시 결과를 안내드립니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: submitLockerApplication },
      ],
    );
  };

  const handleLockerLongPress = (locker: LockerCell) => {
    if (!canApply) {
      Alert.alert('신청 불가', applyHelperText);
      return;
    }

    if (locker.status !== 'available') {
      Alert.alert('신청 불가', '신청 가능한 사물함을 선택해주세요.');
      return;
    }

    if (applying) {
      Alert.alert('처리중', '이전 신청 요청을 처리하고 있습니다.');
      return;
    }

    Alert.alert('사물함 신청', `${locker.label} 사물함을 신청하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: submitLockerApplication },
    ]);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadLocker();
    } finally {
      setRefreshing(false);
    }
  }, [loadLocker]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="나의 사물함" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 140 }]}
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
                backgroundColor: STATUS_THEME[myStatus].bg,
                borderColor: STATUS_THEME[myStatus].border,
              },
            ]}
          >
            <Text style={[styles.myLockerId, { color: STATUS_THEME[myStatus].text }]}>{myLockerLabel}</Text>
            <Text style={[styles.myLockerStatus, { color: STATUS_THEME[myStatus].text }]}>
              {rawMyLockerStatus === 'RENTING'
                ? '대여중'
                : rawMyLockerStatus === 'RENTAL_REQUESTED'
                  ? '대여 신청 접수'
                  : '신청 가능'}
            </Text>
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
          <Text style={styles.legendTitle}>사물함 상태</Text>
          <View style={styles.legendRow}>
            {statusChips.map(({ key, theme }) => (
              <View key={key} style={[styles.legendChip, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.legendText, { color: theme.text }]}>{theme.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionGrid}>
          {sectionSummaries.map(({ section, counts, status, error: sectionError }) => (
            <Pressable
              key={section}
              onPress={() => handleSelectSection(section)}
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
                    ? `${counts.mine + counts.inUse + counts.available + counts.broken}칸`
                    : status === 'loading'
                      ? '불러오는 중'
                      : '미확인'}
                </Text>
              </View>

              <View style={styles.sectionStats}>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.inUse.text }]}>
                  사용중 {counts.inUse}
                </Text>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.available.text }]}>
                  신청 가능 {counts.available}
                </Text>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.broken.text }]}>
                  사용 불가 {counts.broken}
                </Text>
                {counts.mine > 0 && (
                  <Text style={[styles.sectionStat, { color: STATUS_THEME.mine.text }]}>
                    내 사물함 {counts.mine}
                  </Text>
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

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{selectedSection} 구역</Text>
          <Text style={styles.sectionSubtitle}>
            {canApply ? '희망하는 사물함을 길게 눌러 신청할 수 있습니다.' : applyHelperText}
          </Text>
        </View>

        {selectedState.status === 'loaded' && selectedState.lockers.length > 0 && (
          <View style={styles.lockersGrid}>
            {selectedState.lockers.map((locker) => {
              const theme = STATUS_THEME[locker.status];
              const isMine = locker.status === 'mine';
              return (
                <Pressable
                  key={locker.id}
                  onLongPress={() => handleLockerLongPress(locker)}
                  disabled={(!canApply && locker.status === 'available') || applying}
                  style={({ pressed }) => [
                    styles.lockerTile,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                    isMine && styles.lockerTileMine,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text style={[styles.lockerLabel, { color: theme.text }]}>{locker.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {selectedState.status === 'loaded' && selectedState.lockers.length === 0 && (
          <View style={styles.loadingHint}>
            <Text style={styles.loadingText}>선택한 구역의 사물함 정보가 없습니다.</Text>
          </View>
        )}

        {selectedState.status !== 'loaded' && selectedState.status !== 'error' && (
          <View style={styles.loadingHint}>
            <Text style={styles.loadingText}>사물함 정보를 불러오는 중입니다...</Text>
          </View>
        )}

        {selectedState.status === 'error' && (
          <View style={styles.sectionError}>
            <Text style={[styles.loadingText, { color: COLORS.danger }]}>
              {selectedState.error || '사물함 정보를 불러오는 중 오류가 발생했습니다.'}
            </Text>
            <Pressable onPress={() => loadSection(selectedSection)} style={styles.reloadSectionBtn}>
              <Text style={styles.reloadSectionText}>다시 시도</Text>
            </Pressable>
          </View>
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
  legendTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
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
  sectionHeaderRow: {
    flexDirection: 'column',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  lockersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lockerTile: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockerTileMine: {
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lockerLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  sectionError: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 16,
    gap: 10,
    alignItems: 'center',
  },
  reloadSectionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  reloadSectionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  loadingHint: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
});
