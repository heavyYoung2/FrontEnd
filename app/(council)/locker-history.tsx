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
import { TYPO } from '@/src/design/typography';
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
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section} 구역</Text>
                  <Text style={styles.sectionMeta}>{lockers.length}칸</Text>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>사물함</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>학번</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>이름</Text>
                </View>

                <View style={styles.tableBody}>
                  {lockers.map((locker, index) => {
                    const theme = STATUS_THEME[locker.status.toUpperCase()] ?? STATUS_THEME.IN_USE;
                    return (
                      <View
                        key={locker.id}
                        style={[
                          styles.tableRow,
                          index === lockers.length - 1 && styles.tableRowLast,
                        ]}
                      >
                        <Text style={[styles.tableCell, { flex: 0.9, color: theme.text }]}>{locker.label}</Text>
                        <Text style={[styles.tableCell, { flex: 1.1 }]}>{locker.studentId ?? '-'}</Text>
                        <Text style={[styles.tableCell, { flex: 1.2 }]}>{locker.studentName ?? '-'}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
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
    paddingBottom: 40,
    paddingTop: 18,
    gap: 20,
  },
  spacer: {
    height: 4,
  },
  semesterRow: {
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'flex-start',
  },
  semesterLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  semesterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  semesterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  semesterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  semesterChipText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.text,
  },
  semesterChipTextActive: {
    color: COLORS.primary,
  },
  semesterEmpty: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#6B7280',
    paddingVertical: 8,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  sectionMeta: {
    fontFamily: 'Pretendard-Medium',
    color: '#6B7280',
  },
  loadingBlock: {
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.text,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  tableHeaderCell: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: '#4B5563',
  },
  tableBody: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#1F2937',
  },
  tableRowDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
});

function normalizeLockers(raw: LockerInfoApi[], fallbackSection: SectionId): LockerItem[] {
  return raw.map((item, index) => {
    const parsedFromName = Number(String(item.lockerName ?? '').replace(/\D/g, ''));
    const normalizedFromName = Number.isFinite(parsedFromName) && parsedFromName > 0 ? parsedFromName : undefined;
    const lockerNumber =
      item.lockerNumber ??
      item.lockerNum ??
      item.lockerNo ??
      item.lockerId ??
      normalizedFromName ??
      index + 1;

    const rawSection = (
      item.lockerSection ??
      item.section ??
      item.sectionName ??
      fallbackSection
    )
      .toString()
      .toUpperCase();

    const normalizedSectionChar = rawSection.charAt(0);
    const normalizedSection = isSectionId(rawSection)
      ? rawSection
      : isSectionId(normalizedSectionChar)
        ? (normalizedSectionChar as SectionId)
        : fallbackSection;

    const displayLabel = `${normalizedSection}${lockerNumber}`;

    const status = (item.lockerStatus ?? 'IN_USE').toString().toUpperCase();

    const studentId =
      item.studentId ??
      item.studentNumber ??
      item.memberNumber ??
      item.memberId ??
      undefined;

    const studentName = item.studentName ?? item.memberName ?? item.name ?? undefined;

    return {
      id: `${rawSection || normalizedSection}-${lockerNumber}`,
      label: displayLabel,
      section: normalizedSection,
      number: lockerNumber,
      status,
      studentId,
      studentName,
    };
  });
}
