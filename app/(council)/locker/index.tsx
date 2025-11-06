import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { fetchLockersBySection, LockerInfoApi, LockerStatusApi } from '@/src/api/locker';

const SECTION_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
type SectionId = (typeof SECTION_LIST)[number];

const isSectionId = (value: string): value is SectionId =>
  SECTION_LIST.includes(value as SectionId);

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
    inUse: number;
    available: number;
    broken: number;
    my: number;
  };
  error?: string;
};

const EMPTY_SECTION: SectionState = {
  status: 'idle',
  lockers: [],
  counts: { inUse: 0, available: 0, broken: 0, my: 0 },
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

export default function LockerTab() {
  const router = useRouter();
  const [sectionStates, setSectionStates] = useState<Record<SectionId, SectionState>>(() =>
    SECTION_LIST.reduce((acc, section) => {
      acc[section] = { ...EMPTY_SECTION };
      return acc;
    }, {} as Record<SectionId, SectionState>),
  );
  const [selectedSection, setSelectedSection] = useState<SectionId>('A');
  const [modalVisible, setModalVisible] = useState(false);

  const summaries = useMemo(() => {
    return SECTION_LIST.map((section) => {
      const state = sectionStates[section];
      return {
        section,
        counts: state.counts,
        status: state.status,
      };
    });
  }, [sectionStates]);

  const selectedState = sectionStates[selectedSection] ?? EMPTY_SECTION;

  useEffect(() => {
    if (sectionStates.A.status === 'idle') {
      loadSection('A');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSection = async (section: SectionId) => {
    setSectionStates((prev) => ({
      ...prev,
      [section]: { ...prev[section], status: 'loading', error: undefined },
    }));
    try {
      const raw = await fetchLockersBySection(section);
      const lockers = normalizeLockers(raw, section);
      const counts = summarizeLockers(lockers);
      setSectionStates((prev) => ({
        ...prev,
        [section]: { status: 'loaded', lockers, counts },
      }));
    } catch (error: any) {
      console.warn('[locker] fetch fail', error);
      setSectionStates((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          status: 'error',
          error: error?.response?.data?.message || error?.message || '사물함 정보를 불러오지 못했습니다.',
        },
      }));
      Alert.alert('오류', error?.response?.data?.message || error?.message || '사물함 조회 실패');
    }
  };

  const handleOpenSection = (section: SectionId) => {
    setSelectedSection(section);
    const current = sectionStates[section];
    if (current.status === 'idle' || current.status === 'error') {
      loadSection(section);
    }
    setModalVisible(true);
  };

  const onBulkReturn = () => {
    Alert.alert(
      '일괄 반납',
      '현재 학기 사물함을 모두 반납 처리할까요? (고장은 유지됩니다)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          style: 'destructive',
          onPress: () => {
            setSectionStates((prev) => {
              const next = { ...prev };
              SECTION_LIST.forEach((section) => {
                const state = next[section];
                if (state.status === 'loaded') {
                  const updated = state.lockers.map((locker) =>
                    locker.status.toUpperCase() === 'IN_USE' || locker.status.toUpperCase() === 'MY'
                      ? { ...locker, status: 'AVAILABLE', studentId: undefined, studentName: undefined }
                      : locker,
                  );
                  next[section] = { status: 'loaded', lockers: updated, counts: summarizeLockers(updated) };
                }
              });
              return next;
            });
            Alert.alert('완료', '반납 처리가 완료되었습니다.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="사물함 관리하기"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.shortcuts}>
          <Pressable
            onPress={() => router.push('/(council)/locker/applications')}
            style={({ pressed }) => [styles.shortcutBtn, pressed && styles.shortcutPressed]}
          >
            <Ionicons name="people-outline" size={18} color={COLORS.primary} />
            <Text style={styles.shortcutLabel}>사물함 신청 관리</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(council)/locker/history')}
            style={({ pressed }) => [styles.shortcutBtn, pressed && styles.shortcutPressed]}
          >
            <Ionicons name="list-outline" size={18} color={COLORS.primary} />
            <Text style={styles.shortcutLabel}>전체 사물함 배정 내역</Text>
          </Pressable>
        </View>

        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>사물함 상태</Text>
          <View style={styles.legendRow}>
            {['MY', 'IN_USE', 'AVAILABLE', 'BROKEN'].map((key) => {
              const theme = STATUS_THEME[key];
              return (
                <View key={key} style={[styles.legendChip, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.legendText, { color: theme.text }]}>{theme.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionGrid}>
          {summaries.map(({ section, counts, status }) => (
            <Pressable
              key={section}
              onPress={() => handleOpenSection(section)}
              style={({ pressed }) => [
                styles.sectionCard,
                selectedSection === section && styles.sectionCardActive,
                pressed && styles.sectionCardPressed,
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionName}>{section} 구역</Text>
                <Text style={styles.sectionTotal}>
                  {status === 'loaded' ? `${counts.inUse + counts.available + counts.broken + counts.my}칸` : '미확인'}
                </Text>
              </View>
              <View style={styles.sectionStack}>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.IN_USE.text }]}>
                  사용중 {counts.inUse}
                </Text>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.AVAILABLE.text }]}>
                  가능 {counts.available}
                </Text>
                <Text style={[styles.sectionStat, { color: STATUS_THEME.BROKEN.text }]}>
                  불가 {counts.broken}
                </Text>
                {counts.my > 0 && (
                  <Text style={[styles.sectionStat, { color: STATUS_THEME.MY.text }]}>
                    내 사물함 {counts.my}
                  </Text>
                )}
                {status === 'loading' && (
                  <View style={styles.sectionLoadingRow}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.sectionLoadingText}>불러오는 중...</Text>
                  </View>
                )}
                {status === 'error' && (
                  <Text style={[styles.sectionLoadingText, { color: COLORS.danger }]}>오류, 다시 시도하세요</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onBulkReturn} style={({ pressed }) => [styles.bulkButton, pressed && styles.bulkPressed]}>
          <Ionicons name="refresh-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.bulkText}>현재 학기 사물함 일괄 반납하기</Text>
        </Pressable>
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

function LockerSectionModal({
  section,
  visible,
  onClose,
  state,
  onReload,
}: {
  section: SectionId;
  visible: boolean;
  onClose: () => void;
  state: SectionState;
  onReload: () => void;
}) {
  const themeKeys = ['MY', 'IN_USE', 'AVAILABLE', 'BROKEN'] as const;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{section} 구역 사물함</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
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
                <Ionicons name="reload" size={14} color="#FFFFFF" />
                <Text style={styles.reloadBtnText}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {state.status === 'loaded' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <View style={styles.lockersWrap}>
                {state.lockers.map((locker) => {
                  const theme = STATUS_THEME[locker.status.toUpperCase()] ?? STATUS_THEME.AVAILABLE;
                  return (
                    <View
                      key={locker.id}
                      style={[
                        styles.lockerTile,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.bg,
                        },
                      ]}
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

function normalizeLockers(raw: LockerInfoApi[], section: SectionId): LockerItem[] {
  return raw
    .map((item) => {
      const sectionId = item.location?.charAt(0);
      if (!sectionId || !isSectionId(sectionId)) return null;
      const number = parseInt(item.location.slice(1), 10);
      if (Number.isNaN(number)) return null;
      const statusUpper = item.status?.toUpperCase() ?? 'AVAILABLE';

      const base: LockerItem = {
        id: item.id,
        label: `${sectionId}-${number}`,
        number,
        section: sectionId,
        status: (statusUpper as LockerStatusApi) ?? 'AVAILABLE',
      };

      if (item.owner) {
        base.studentId = item.owner.studentId;
        base.studentName = item.owner.name;
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
    .filter((item): item is LockerItem => item !== null)
    .sort((a, b) => a.number - b.number);
}

function summarizeLockers(lockers: LockerItem[]) {
  return lockers.reduce(
    (acc, locker) => {
      const status = locker.status.toUpperCase();
      if (status === 'IN_USE') acc.inUse += 1;
      else if (status === 'MY') acc.my += 1;
      else if (status === 'AVAILABLE') acc.available += 1;
      else if (status === 'BROKEN') acc.broken += 1;
      return acc;
    },
    { inUse: 0, available: 0, broken: 0, my: 0 },
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F8FD',
  },
  scroll: {
    padding: 20,
    paddingBottom: 140,
    gap: 24,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 12,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF2',
    shadowColor: '#1c2a58',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  shortcutPressed: {
    opacity: 0.85,
  },
  shortcutLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  legendCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6F2',
    gap: 12,
  },
  legendTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  sectionHeaderRow: {
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
  sectionStack: {
    gap: 6,
    marginTop: 4,
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
  bulkButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#1c2a58',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bulkPressed: {
    opacity: 0.9,
  },
  bulkText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  reloadBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
  },
  lockersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 8,
    paddingTop: 4,
  },
  lockerTile: {
    width: '30%',
    minWidth: 82,
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
