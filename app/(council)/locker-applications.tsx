import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

type LockerApplicant = {
  id: string;
  memberId: string;
  name: string;
  appliedAt: string;
};

type ApplicationSchedule = {
  id: string;
  startAt: string;
  endAt: string;
  semester: string;
  method: '정기' | '추가';
  isOpen: boolean;
  notes?: string;
  applicants: LockerApplicant[];
};

const MOCK_APPLICANTS: LockerApplicant[] = Array.from({ length: 6 }).map((_, idx) => ({
  id: `app-${idx + 1}`,
  memberId: `C0${11130 + idx}`,
  name: ['윤현일', '김지우', '박서연', '최민준', '이도현', '정하늘'][idx % 6],
  appliedAt: `2025-08-04T21:0${idx}:31.512`,
}));

const INITIAL_SCHEDULES: ApplicationSchedule[] = [
  {
    id: 'schedule-2025-regular',
    startAt: '2025-08-04T18:00:00',
    endAt: '2025-08-07T18:00:00',
    semester: '2025-1',
    method: '정기',
    isOpen: true,
    notes: '정기 배정 – 신청 인원은 자동으로 추첨됩니다.',
    applicants: MOCK_APPLICANTS,
  },
  {
    id: 'schedule-2024-extra',
    startAt: '2024-09-04T18:00:00',
    endAt: '2024-09-07T18:00:00',
    semester: '2024-2',
    method: '추가',
    isOpen: false,
    notes: '추가 배정 – 정기 미배정자를 우선으로 합니다.',
    applicants: MOCK_APPLICANTS.slice(0, 3),
  },
  {
    id: 'schedule-2024-regular',
    startAt: '2024-02-26T09:00:00',
    endAt: '2024-03-01T18:00:00',
    semester: '2024-1',
    method: '정기',
    isOpen: false,
    applicants: [],
  },
];

export default function LockerApplicationsScreen() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ApplicationSchedule[]>(INITIAL_SCHEDULES);
  const [createVisible, setCreateVisible] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState<ApplicationSchedule | null>(null);

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [schedules]);

  const handleOpenDetail = useCallback((schedule: ApplicationSchedule) => {
    setDetailSchedule(schedule);
  }, []);

  const handleCreateSubmit = useCallback((schedule: ApplicationSchedule) => {
    setSchedules(prev => [schedule, ...prev]);
  }, []);

  const handleToggleStatus = useCallback((scheduleId: string) => {
    setSchedules(prev => prev.map((item) => (item.id === scheduleId ? { ...item, isOpen: !item.isOpen } : item)));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="사물함 신청 관리"
        showBack
        backFallbackHref="/(council)/locker"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setCreateVisible(true)}
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.createBtnText}>사물함 신청 생성하기</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>신청 일정 목록</Text>
          <Text style={styles.sectionCaption}>관리가 필요한 일정을 선택해 상세 정보를 확인하고 제어하세요.</Text>
        </View>

        {sortedSchedules.map((item) => (
          <View key={item.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View style={{ gap: 4 }}>
                <Text style={styles.scheduleTitle}>{item.semester} ({item.method})</Text>
                <Text style={styles.scheduleRange}>{formatDateTime(item.startAt)} ~ {formatDateTime(item.endAt)}</Text>
              </View>
              <View style={[styles.statusChip, item.isOpen ? styles.statusOpen : styles.statusClosed]}>
                <Text style={[styles.statusText, item.isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                  {item.isOpen ? '신청 가능' : '마감'}
                </Text>
              </View>
            </View>

            {!!item.notes && <Text style={styles.scheduleNote}>{item.notes}</Text>}

            <View style={styles.scheduleMetaRow}>
              <MetaItem label="신청 방식" value={item.method} />
              <MetaItem label="신청자" value={`${item.applicants.length}명`} />
            </View>

            <View style={styles.scheduleActions}>
              <Pressable
                onPress={() => router.push({ pathname: '/(council)/locker-history', params: { schedule: item.id } })}
                style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.outlineBtnText}>배정 내역</Text>
              </Pressable>
              <Pressable
                onPress={() => handleOpenDetail(item)}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.primaryBtnText}>상세보기</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <CreateScheduleModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={(schedule) => {
          handleCreateSubmit(schedule);
          setCreateVisible(false);
        }}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        onClose={() => setDetailSchedule(null)}
        onToggleStatus={(scheduleId) => {
          handleToggleStatus(scheduleId);
          setDetailSchedule((prev) => (prev ? { ...prev, isOpen: !prev.isOpen } : prev));
        }}
        onAssignAll={(schedule) => {
          Alert.alert('사물함 배정', `${schedule.semester} 학기 사물함을 일괄 배정했습니다.`);
        }}
      />
    </SafeAreaView>
  );
}

function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return format(date, 'yyyy-MM-dd HH:mm');
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

type CreateScheduleModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (schedule: ApplicationSchedule) => void;
};

function CreateScheduleModal({ visible, onClose, onSubmit }: CreateScheduleModalProps) {
  const now = new Date();
  const [startDate, setStartDate] = useState(now);
  const [endDate, setEndDate] = useState(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000));
  const [semesterYear, setSemesterYear] = useState(now.getFullYear());
  const [semesterTerm, setSemesterTerm] = useState<'1' | '2'>('1');
  const [method, setMethod] = useState<'정기' | '추가'>('정기');
  const [isOpen, setIsOpen] = useState(true);
  const [notes, setNotes] = useState('');
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const semesterText = `${semesterYear}-${semesterTerm}`;
  const canSave = startDate <= endDate;

  const handlePickerChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (!date) return;
    if (activePicker === 'start') {
      setStartDate(date);
      if (date > endDate) setEndDate(date);
    } else if (activePicker === 'end') {
      setEndDate(date < startDate ? startDate : date);
    }
  };

  const handleSubmit = () => {
    if (!canSave) return;
    const payload: ApplicationSchedule = {
      id: `schedule-${Date.now()}`,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      semester: semesterText,
      method,
      isOpen,
      notes: notes.trim() || undefined,
      applicants: [],
    };
    onSubmit(payload);
    const resetBase = new Date();
    setStartDate(resetBase);
    setEndDate(new Date(resetBase.getTime() + 3 * 24 * 60 * 60 * 1000));
    setSemesterYear(resetBase.getFullYear());
    setSemesterTerm('1');
    setMethod('정기');
    setIsOpen(true);
    setNotes('');
    setActivePicker(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCardLarge}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>사물함 신청 생성하기</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>시작일</Text>
              <Pressable onPress={() => setActivePicker('start')} style={styles.fieldButton}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.fieldButtonText}>{formatDateTime(startDate)}</Text>
              </Pressable>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>종료일</Text>
              <Pressable onPress={() => setActivePicker('end')} style={styles.fieldButton}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.fieldButtonText}>{formatDateTime(endDate)}</Text>
              </Pressable>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>신청 학기</Text>
              <View style={styles.semesterRowInline}>
                <Pressable onPress={() => setSemesterYear((prev) => prev - 1)} hitSlop={8} style={styles.semesterArrow}>
                  <Ionicons name="chevron-back" size={18} color={COLORS.text} />
                </Pressable>
                <Text style={styles.semesterValue}>{semesterYear}년</Text>
                <Pressable onPress={() => setSemesterYear((prev) => prev + 1)} hitSlop={8} style={styles.semesterArrow}>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
                </Pressable>
              </View>
              <View style={styles.toggleRow}>
                {(['1', '2'] as const).map((term) => (
                  <Pressable
                    key={term}
                    onPress={() => setSemesterTerm(term)}
                    style={[styles.toggleChip, semesterTerm === term && styles.toggleChipActive]}
                  >
                    <Text style={[styles.toggleChipText, semesterTerm === term && styles.toggleChipTextActive]}>
                      {term}학기
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>신청 방식</Text>
              <View style={styles.toggleRow}>
                {(['정기', '추가'] as const).map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setMethod(value)}
                    style={[styles.toggleChip, method === value && styles.toggleChipActive]}
                  >
                    <Text style={[styles.toggleChipText, method === value && styles.toggleChipTextActive]}>
                      {value} 신청
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>신청 가능 여부</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  onPress={() => setIsOpen(true)}
                  style={[styles.toggleChip, isOpen && styles.toggleChipActive]}
                >
                  <Text style={[styles.toggleChipText, isOpen && styles.toggleChipTextActive]}>신청 가능</Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsOpen(false)}
                  style={[styles.toggleChip, !isOpen && styles.toggleChipActive]}
                >
                  <Text style={[styles.toggleChipText, !isOpen && styles.toggleChipTextActive]}>신청 불가</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>비고</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="필요 시 안내 문구를 입력하세요."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.modalActionBtn, styles.modalCancelBtn]}>
              <Text style={styles.modalCancelText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSave}
              style={[styles.modalActionBtn, styles.modalSaveBtn, !canSave && { opacity: 0.5 }]}
            >
              <Text style={styles.modalSaveText}>저장하기</Text>
            </Pressable>
          </View>

          {activePicker && (
            <View style={styles.inlinePicker}>
              <DateTimePicker
                value={activePicker === 'start' ? startDate : endDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

type ScheduleDetailModalProps = {
  schedule: ApplicationSchedule | null;
  onClose: () => void;
  onToggleStatus: (scheduleId: string) => void;
  onAssignAll: (schedule: ApplicationSchedule) => void;
};

function ScheduleDetailModal({ schedule, onClose, onToggleStatus, onAssignAll }: ScheduleDetailModalProps) {
  if (!schedule) return null;

  const handleToggle = () => {
    const nextState = schedule.isOpen ? '마감' : '재오픈';
    Alert.alert(`신청 ${nextState}`, `해당 일정을 ${nextState}하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        style: 'destructive',
        onPress: () => onToggleStatus(schedule.id),
      },
    ]);
  };

  const handleAssign = () => {
    Alert.alert('사물함 일괄 배정', '선택한 신청의 인원을 일괄 배정하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: () => onAssignAll(schedule) },
    ]);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCardLarge}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>사물함 신청 관리</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.detailSummary}>
            <Text style={styles.detailLine}>시작일 : {formatDateTime(schedule.startAt)}</Text>
            <Text style={styles.detailLine}>종료일 : {formatDateTime(schedule.endAt)}</Text>
            <Text style={styles.detailLine}>현재 학기 : {schedule.semester}</Text>
            <Text style={styles.detailLine}>신청 방식 : {schedule.method}</Text>
            <Text style={styles.detailLine}>신청 가능 여부 : {schedule.isOpen ? '가능' : '불가'}</Text>
          </View>

          <View style={styles.detailActions}>
            <Pressable
              onPress={handleToggle}
              style={[styles.detailActionBtn, schedule.isOpen ? styles.detailCloseBtn : styles.detailReopenBtn]}
            >
              <Text style={styles.detailActionText}>
                {schedule.isOpen ? '사물함 신청 마감하기' : '사물함 신청 다시 열기'}
              </Text>
            </Pressable>
            <Pressable onPress={handleAssign} style={[styles.detailActionBtn, styles.detailSecondaryBtn]}>
              <Text style={[styles.detailActionText, { color: COLORS.primary }]}>사물함 일괄 배정</Text>
            </Pressable>
          </View>

          <View style={styles.applicantHeader}>
            <Text style={styles.applicantTitle}>신청자 총원</Text>
            <Text style={styles.applicantCount}>{schedule.applicants.length}명</Text>
          </View>

          <ScrollView contentContainerStyle={styles.applicantList} showsVerticalScrollIndicator={false}>
            {schedule.applicants.length === 0 ? (
              <Text style={styles.emptyApplicant}>신청자가 아직 없습니다.</Text>
            ) : (
              schedule.applicants.map((applicant) => (
                <View key={applicant.id} style={styles.applicantCard}>
                  <Text style={styles.applicantName}>{applicant.memberId} {applicant.name}</Text>
                  <Text style={styles.applicantTime}>신청 일시 : {formatDateTime(applicant.appliedAt)}</Text>
                </View>
              ))
            )}
          </ScrollView>
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
    paddingBottom: 40,
    paddingTop: 18,
    gap: 18,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  createBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.primary,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  sectionCaption: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#6B7280',
  },
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 17,
    color: COLORS.text,
  },
  scheduleRange: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusOpen: {
    backgroundColor: '#D1FAE5',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  statusTextOpen: {
    color: '#047857',
  },
  statusTextClosed: {
    color: '#B91C1C',
  },
  scheduleNote: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#4B5563',
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  metaLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  metaValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCardLarge: {
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    padding: 20,
    maxHeight: '90%',
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
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
  modalContent: {
    gap: 18,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.text,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
  },
  fieldButtonText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.text,
  },
  semesterRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  semesterArrow: {
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  semesterValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  toggleChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  toggleChipText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.text,
  },
  toggleChipTextActive: {
    color: COLORS.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
  },
  modalCancelText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  modalSaveText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  inlinePicker: {
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    paddingTop: 12,
  },
  detailSummary: {
    gap: 6,
  },
  detailLine: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.text,
  },
  detailActions: {
    gap: 10,
  },
  detailActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseBtn: {
    backgroundColor: '#FDE68A',
  },
  detailReopenBtn: {
    backgroundColor: '#DBEAFE',
  },
  detailSecondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  detailActionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applicantTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  applicantCount: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  applicantList: {
    gap: 10,
    paddingBottom: 12,
  },
  emptyApplicant: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  applicantCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  applicantName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  applicantTime: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
});
