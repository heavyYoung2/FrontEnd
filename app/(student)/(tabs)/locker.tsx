import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
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
  fetchMyLocker,
  MyLockerInfoApi,
} from '@/src/api/locker';

const SECTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type LockerStatus = 'mine' | 'inUse' | 'available' | 'pending' | 'broken';

type LockerInfo = {
  id: string;
  status: LockerStatus;
};

type SectionInfo = {
  key: SectionKey;
  lockers: LockerInfo[];
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

function createMockSections(): SectionInfo[] {
  return SECTION_KEYS.map((key) => {
    return {
      key,
      lockers: Array.from({ length: 30 }).map((_, lockerIdx) => {
        const status: LockerStatus = lockerIdx % 6 === 0 ? 'available' : lockerIdx % 7 === 0 ? 'broken' : 'inUse';
        return {
          id: `${key}${lockerIdx + 1}`,
          status,
        } satisfies LockerInfo;
      }),
    } satisfies SectionInfo;
  });
}

function markMyLocker(base: SectionInfo[], locker: MyLockerInfoApi | null) {
  if (!locker || locker.status !== 'RENTING') return base;
  const sectionKey = (locker.lockerSection ?? '').toUpperCase();
  if (!SECTION_KEYS.includes(sectionKey as SectionKey)) return base;
  const numeric = locker.lockerNumber
    ?? locker.lockerName?.replace(/^[A-Za-z]+/, '')
    ?? '';
  if (!numeric) return base;

  return base.map((section) => {
    if (section.key !== sectionKey) return section;
    return {
      ...section,
      lockers: section.lockers.map((item) =>
        item.id === `${sectionKey}${numeric}` ? { ...item, status: 'mine' } : item,
      ),
    };
  });
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
  const [sections, setSections] = useState<SectionInfo[]>(createMockSections());
  const [myLocker, setMyLocker] = useState<MyLockerInfoApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusChips = useMemo(() => (
    (['mine', 'inUse', 'available', 'pending', 'broken'] as LockerStatus[]).map((key) => ({
      key,
      theme: STATUS_THEME[key],
    }))
  ), []);

  const loadLocker = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const myInfo = await fetchMyLocker();
      setMyLocker(myInfo);

      const marked = markMyLocker(createMockSections(), myInfo);
      setSections(marked);

      if (myInfo?.lockerSection && SECTION_KEYS.includes(myInfo.lockerSection as SectionKey)) {
        setSelectedSection(myInfo.lockerSection as SectionKey);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || '사물함 정보를 불러오지 못했습니다.');
      setSections(createMockSections());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocker();
  }, [loadLocker]);

  const selectedSectionInfo = useMemo(() => {
    return sections.find((section) => section.key === selectedSection) ?? sections[0];
  }, [sections, selectedSection]);

  const myLockerLabel = useMemo(() => {
    if (!myLocker) return '-';
    if (myLocker.lockerSection) {
      const number = myLocker.lockerNumber
        ?? myLocker.lockerName?.replace(/^[A-Za-z]+/, '')
        ?? '';
      return `${myLocker.lockerSection}${number}`;
    }
    return myLocker.lockerName ?? myLocker.lockerNumber ?? '-';
  }, [myLocker]);

  const myStatus = mapStatus(myLocker?.status);
  const canApply = myLocker?.status !== 'RENTING' && myLocker?.status !== 'RENTAL_REQUESTED';
  const applyHelperText = myLocker?.status === 'RENTING'
    ? '이미 사물함을 사용 중입니다.'
    : '현재 사물함 신청이 처리 중입니다.';

  const handleApply = () => {
    if (!canApply) {
      Alert.alert('신청 불가', applyHelperText);
      return;
    }

    Alert.alert(
      '사물함 신청',
      '다음 정보로 사물함을 신청하시겠습니까? 신청 이후 배정 시 결과를 안내드립니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: () => Alert.alert('신청 완료', '사물함 신청이 접수되었습니다. 결과는 알림으로 안내됩니다.') },
      ],
    );
  };

  const handleLockerLongPress = (locker: LockerInfo) => {
    if (!canApply) {
      Alert.alert('신청 불가', applyHelperText);
      return;
    }

    if (locker.status !== 'available') {
      Alert.alert('신청 불가', '신청 가능한 사물함을 선택해주세요.');
      return;
    }

    Alert.alert('사물함 신청', `${locker.id} 사물함을 신청하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: handleApply },
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
              style={({ pressed }) => [
                styles.applyButton,
                !canApply && styles.applyButtonDisabled,
                pressed && canApply && { opacity: 0.9 },
              ]}
            >
              <Text
                style={[
                  styles.applyButtonText,
                  !canApply && { color: '#94A3B8' },
                ]}
              >
                {canApply ? '사물함 신청하기' : myLocker?.status === 'RENTAL_REQUESTED' ? '신청 처리중' : '대여중'}
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
              {myLocker?.status === 'RENTING'
                ? '대여중'
                : myLocker?.status === 'RENTAL_REQUESTED'
                  ? '대여 신청 접수'
                  : '신청 가능'}
            </Text>
          </View>

          <Text style={styles.myLockerNote}>
            {myLocker?.status === 'RENTING'
              ? '현재 사용 중인 사물함입니다. 이용 규칙을 꼭 지켜주세요.'
              : myLocker?.status === 'RENTAL_REQUESTED'
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
          {SECTION_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setSelectedSection(key)}
              style={({ pressed }) => [
                styles.sectionTile,
                selectedSection === key && styles.sectionTileActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[styles.sectionTileText, selectedSection === key && styles.sectionTileTextActive]}>{key}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{selectedSection} 구역</Text>
          <Text style={styles.sectionSubtitle}>
            {canApply ? '희망하는 사물함을 길게 눌러 신청할 수 있습니다.' : applyHelperText}
          </Text>
        </View>

        <View style={styles.lockersGrid}>
          {selectedSectionInfo.lockers.map((locker) => {
            const theme = STATUS_THEME[locker.status];
            const isMine = locker.status === 'mine';
            return (
              <Pressable
                key={locker.id}
                onLongPress={() => handleLockerLongPress(locker)}
                disabled={!canApply && locker.status === 'available'}
                style={({ pressed }) => [
                  styles.lockerTile,
                  { backgroundColor: theme.bg, borderColor: theme.border },
                  isMine && styles.lockerTileMine,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={[styles.lockerLabel, { color: theme.text }]}>{locker.id}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && (
          <View style={styles.loadingHint}>
            <Text style={styles.loadingText}>사물함 정보를 불러오는 중입니다...</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    gap: 8,
  },
  legendChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 92,
    alignItems: 'center',
  },
  legendText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTile: {
    width: '30%',
    minWidth: 90,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTileActive: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTileText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 20,
    color: '#475569',
  },
  sectionTileTextActive: {
    color: COLORS.primary,
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
