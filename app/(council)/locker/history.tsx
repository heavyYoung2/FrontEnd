import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  fetchLockerAssignmentSemesters,
  fetchLockerAssignments,
  LockerAssignmentInfoApi,
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
  status: 'IN_USE' | 'AVAILABLE';
  studentId?: string;
  studentName?: string;
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
        const list = await fetchLockerAssignmentSemesters();
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

  const loadAssignments = useCallback(async (semester?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const raw = await fetchLockerAssignments(semester ? { semester } : undefined);
        setLockersBySection(normalizeAssignments(raw));
    } catch (err: any) {
      console.warn('[locker-history] fetch fail', err);
      setError(err?.response?.data?.message || err?.message || '사물함 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!semesterLoading) {
      loadAssignments(selectedSemester);
    }
  }, [loadAssignments, selectedSemester, semesterLoading]);

  const flatList = useMemo(() => {
    const entries = Object.values(lockersBySection).flat();
    return entries.sort((a, b) => {
      if (a.section === b.section) return a.number - b.number;
      return a.section.localeCompare(b.section);
    });
  }, [lockersBySection]);

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

        {!loading && !error && (
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>사물함</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>학번</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>이름</Text>
              <Text style={[styles.tableHeaderText, { width: 70 }]}>상태</Text>
            </View>
            {flatList.length > 0 ? (
              flatList.map((locker) => (
                <View key={locker.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableLocker]}>{locker.label}</Text>
                  <Text style={styles.tableCell}>{locker.studentId || '-'}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{locker.studentName || '배정자 없음'}</Text>
                  <View style={styles.tableStatusCell}>
                    <Text
                      style={[
                        styles.tableStatus,
                        locker.status === 'IN_USE' ? styles.tableStatusInUse : styles.tableStatusAvailable,
                      ]}
                    >
                      {locker.status === 'IN_USE' ? '사용중' : '사용 가능'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.tableEmptyRow}>
                <Text style={styles.emptyState}>사물함 내역이 없습니다.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeAssignments(raw: LockerAssignmentInfoApi[]): Record<SectionId, LockerItem[]> {
  const grouped: Record<SectionId, LockerItem[]> = SECTION_LIST.reduce((acc, section) => {
    acc[section] = [];
    return acc;
  }, {} as Record<SectionId, LockerItem[]>);

  raw.forEach((assignment) => {
    const parsed = parseLockerLocation(assignment.lockerNumber);
    if (!parsed) return;
    const { section, number, label } = parsed;
    const status = assignment.studentName ? 'IN_USE' : 'AVAILABLE';
    grouped[section].push({
      id: String(assignment.lockerId ?? `${label}`),
      label,
      number,
      section,
      status,
      studentId: assignment.studentId,
      studentName: assignment.studentName,
    });
  });

  SECTION_LIST.forEach((section) => {
    grouped[section].sort((a, b) => a.number - b.number);
  });

  return grouped;
}

function parseLockerLocation(value?: string | number | null) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const sectionChar = raw.charAt(0).toUpperCase();
  if (!isSectionId(sectionChar)) return null;
  const numericPart = raw.slice(1).replace(/[^0-9]/g, '');
  const number = parseInt(numericPart, 10);
  if (Number.isNaN(number)) return null;
  return {
    section: sectionChar,
    number,
    label: `${sectionChar}-${number}`,
  };
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F4F6FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: '#1F2937',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCell: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
  },
  tableLocker: {
    flex: 0.8,
  },
  tableStatusCell: {
    width: 80,
    alignItems: 'center',
  },
  tableStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    textAlign: 'center',
  },
  tableStatusInUse: {
    backgroundColor: '#FEE2E2',
    color: COLORS.danger,
  },
  tableStatusAvailable: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  tableEmptyRow: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
