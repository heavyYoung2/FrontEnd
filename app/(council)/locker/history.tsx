import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import {
  fetchLockersBySection,
  fetchLockerSemesters,
  LockerInfoApi,
  LockerStatusApi,
} from '@/src/api/locker';

const SECTION_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
type SectionId = (typeof SECTION_LIST)[number];

const isSectionId = (value: string): value is SectionId =>
  SECTION_LIST.includes(value as SectionId);

type LockerItem = {
  id: string;
  label: string;
  section: SectionId;
  number: number;
  status: LockerStatusApi;
  studentId?: string;
  studentName?: string;
};

const STATUS_THEME: Record<string, { bg: string; border: string; text: string; label: string }> = {
  IN_USE: {
    bg: '#FEE2E2',
    border: '#FECACA',
    text: COLORS.danger,
    label: '사용중',
  },
  AVAILABLE: {
    bg: '#DCFCE7',
    border: '#A7F3D0',
    text: '#15803D',
    label: '사용 가능',
  },
  BROKEN: {
    bg: '#E5E7EB',
    border: '#D1D5DB',
    text: '#374151',
    label: '사용 불가',
  },
  MY: {
    bg: '#DBEAFE',
    border: '#BFDBFE',
    text: COLORS.primary,
    label: '내 사물함',
  },
};

export default function LockerHistoryScreen() {
  const { schedule } = useLocalSearchParams<{ schedule?: string }>();
  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [semesterLoading, setSemesterLoading] = useState(true);
  const [lockersBySection, setLockersBySection] = useState<Record<SectionId, LockerItem[]>>(() =>
    SECTION_LIST.reduce((acc, section) => {
      acc[section] = [];
      return acc;
    }, {} as Record<SectionId, LockerItem[]>),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 학기 목록 로딩
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setSemesterLoading(true);
        const list = await fetchLockerSemesters();
        if (!mounted) return;
        setSemesters(list);
        setSelectedSemester(schedule ?? list[0] ?? null);
      } catch (err: any) {
        console.warn('[locker-history] semesters fail', err);
        setError(err?.response?.data?.message || err?.message || '학기 정보를 불러오지 못했습니다.');
      } finally {
        if (mounted) setSemesterLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [schedule]);

  const loadAssignments = useCallback(
    async (semester?: string | null) => {
      try {
        setLoading(true);
        setError(null);
        const entries = await Promise.all(
          SECTION_LIST.map(async (section) => {
            const raw = await fetchLockersBySection(section, semester ? { semester } : undefined);
            return [section, normalizeLockers(raw, section)] as const;
          }),
        );
        setLockersBySection(Object.fromEntries(entries) as Record<SectionId, LockerItem[]>);
      } catch (err: any) {
        console.warn('[locker-history] fetch fail', err);
        setError(err?.response?.data?.message || err?.message || '사물함 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!semesterLoading) {
      loadAssignments(selectedSemester);
    }
  }, [loadAssignments, selectedSemester, semesterLoading]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="전체 사물함 배정 내역"
        showBack
        backFallbackHref="/(council)/locker"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.semesterRow}>
          <Text style={styles.semesterLabel}>학기 선택</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.semesterChips}
          >
            {semesters.map((item) => {
              const active = item === selectedSemester;
              return (
                <Pressable
                  key={item}
                  onPress={() => setSelectedSemester(item)}
                  style={({ pressed }) => [
                    styles.semesterChip,
                    active && styles.semesterChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.semesterChipText,
                      active && styles.semesterChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
            {!semesters.length && !semesterLoading && (
              <Text style={styles.semesterEmpty}>학기 정보가 없습니다.</Text>
            )}
          </ScrollView>
          {semesterLoading && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 8 }} />
          )}
        </View>

        <View style={styles.spacer} />

        {loading && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>사물함 데이터를 불러오는 중입니다.</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.loadingBlock}>
            <Text style={[styles.loadingText, { color: COLORS.danger }]}>{error}</Text>
          </View>
        )}

        {!loading &&
          !error &&
          SECTION_LIST.map((section) => {
            const lockers = lockersBySection[section];
            return (
              <View key={section} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{section} 구역</Text>
                <View style={styles.sectionLockers}>
                  {lockers.map((locker) => {
                    const theme = STATUS_THEME[locker.status.toUpperCase()] ?? STATUS_THEME.AVAILABLE;
                    return (
                      <View
                        key={locker.id}
                        style={[
                          styles.lockerTile,
                          {
                            backgroundColor: theme.bg,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.lockerLabel, { color: theme.text }]}>{locker.label}</Text>
                        <Text style={[styles.lockerStatus, { color: theme.text }]}>{theme.label}</Text>
                        {locker.studentName ? (
                          <View style={{ gap: 2 }}>
                            <Text style={styles.lockerMeta}>{locker.studentName}</Text>
                            {locker.studentId ? <Text style={styles.lockerMetaSecondary}>{locker.studentId}</Text> : null}
                          </View>
                        ) : (
                          <Text style={styles.lockerMetaSecondary}>배정자 없음</Text>
                        )}
                      </View>
                    );
                  })}
                  {!lockers.length && (
                    <Text style={styles.emptyState}>사물함 내역이 없습니다.</Text>
                  )}
                </View>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeLockers(raw: LockerInfoApi[], section: SectionId): LockerItem[] {
  return raw
    .map((locker) => {
      const sectionId = locker.location?.charAt(0);
      if (!sectionId || !isSectionId(sectionId)) return null;
      const number = parseInt(locker.location.slice(1), 10);
      if (Number.isNaN(number)) return null;
      const statusUpper = locker.status?.toUpperCase() ?? 'AVAILABLE';

      const base: LockerItem = {
        id: locker.id,
        label: `${sectionId}-${number}`,
        section: sectionId,
        number,
        status: (statusUpper as LockerStatusApi) ?? 'AVAILABLE',
      };

      if (locker.owner) {
        base.studentId = locker.owner.studentId;
        base.studentName = locker.owner.name;
      }

      if (statusUpper === 'BROKEN') {
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
    .filter((locker): locker is LockerItem => locker !== null)
    .sort((a, b) => a.number - b.number);
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },
  semesterRow: {
    gap: 12,
  },
  semesterLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  semesterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  semesterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  semesterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E0EBFF',
  },
  semesterChipText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#4B5563',
  },
  semesterChipTextActive: {
    color: COLORS.primary,
  },
  semesterEmpty: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#9CA3AF',
  },
  spacer: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  loadingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.text,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 18,
    color: COLORS.text,
  },
  sectionLockers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lockerTile: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  lockerLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
  },
  lockerStatus: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
  },
  lockerMeta: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: '#475569',
  },
  lockerMetaSecondary: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#9CA3AF',
  },
});
