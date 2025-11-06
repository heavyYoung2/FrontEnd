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
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';

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
                onPress={() => router.push({ pathname: '/(council)/locker/history', params: { schedule: item.id } })}
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

function CreateScheduleModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (schedule: ApplicationSchedule) => void;
}) {
  const [semester, setSemester] = useState('');
  const [method, setMethod] = useState<'정기' | '추가'>('정기');
  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(new Date(Date.now() + 1000 * 60 * 60 * 24));
  const [notes, setNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    if (!semester.trim()) {
      Alert.alert('입력 필요', '학기를 입력해주세요.');
      return;
    }

    onSubmit({
      id: `schedule-${semester}-${method}-${Date.now()}`,
      semester,
      method,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      isOpen,
      notes: notes.trim() || undefined,
      applicants: [],
    });
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>신청 일정 생성</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>학기</Text>
            <TextInput
              placeholder="예: 2025-1"
              value={semester}
              onChangeText={setSemester}
              style={styles.formInput}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>신청 방식</Text>
            <View style={styles.methodRow}>
              {(['정기', '추가'] as const).map(option => (
                <Pressable
                  key={option}
                  onPress={() => setMethod(option)}
                  style={[
                    styles.methodChip,
                    method === option && styles.methodChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.methodChipLabel,
                      method === option && styles.methodChipLabelActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>신청 기간</Text>
            <View style={styles.datetimeRow}>
              <DateInput label="시작" value={startAt} onChange={setStartAt} />
              <DateInput label="종료" value={endAt} onChange={setEndAt} />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>알림 메모</Text>
            <TextInput
              placeholder="필요한 안내 사항을 입력하세요."
              value={notes}
              onChangeText={setNotes}
              style={[styles.formInput, styles.formTextarea]}
              multiline
            />
          </View>

          <Pressable
            onPress={() => setIsOpen(prev => !prev)}
            style={({ pressed }) => [
              styles.toggleRow,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons
              name={isOpen ? 'checkbox' : 'square-outline'}
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.toggleLabel}>바로 신청 열기</Text>
          </Pressable>

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalCancel, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [styles.modalConfirm, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.modalConfirmText}>생성</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: any, nextDate?: Date) => {
    setShowPicker(false);
    if (nextDate) onChange(nextDate);
  };

  return (
    <View style={styles.dateInputWrap}>
      <Text style={styles.dateInputLabel}>{label}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => [styles.dateInputBtn, pressed && { opacity: 0.9 }]}
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        <Text style={styles.dateInputValue}>{formatDateTime(value)}</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

function ScheduleDetailModal({
  schedule,
  onClose,
  onToggleStatus,
  onAssignAll,
}: {
  schedule: ApplicationSchedule | null;
  onClose: () => void;
  onToggleStatus: (scheduleId: string) => void;
  onAssignAll: (schedule: ApplicationSchedule) => void;
}) {
  if (!schedule) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={!!schedule}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{schedule.semester} 신청 상세</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.scheduleMetaRow}>
            <MetaItem label="신청 방식" value={schedule.method} />
            <MetaItem label="신청 상태" value={schedule.isOpen ? '신청 가능' : '신청 마감'} />
          </View>

          {!!schedule.notes && (
            <View style={styles.detailNotes}>
              <Text style={styles.detailNotesLabel}>알림</Text>
              <Text style={styles.detailNotesValue}>{schedule.notes}</Text>
            </View>
          )}

          <Pressable
            onPress={() => onToggleStatus(schedule.id)}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.primaryBtnText}>
              신청 {schedule.isOpen ? '마감하기' : '열기'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onAssignAll(schedule)}
            style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.outlineBtnText}>전체 배정 실행</Text>
          </Pressable>

          <View style={styles.applicantsSection}>
            <Text style={styles.applicantsTitle}>신청자 목록</Text>
            {schedule.applicants.length === 0 ? (
              <Text style={styles.emptyApplicants}>신청자가 없습니다.</Text>
            ) : (
              schedule.applicants.map((applicant) => (
                <View key={applicant.id} style={styles.applicantRow}>
                  <View>
                    <Text style={styles.applicantName}>{applicant.name}</Text>
                    <Text style={styles.applicantId}>{applicant.memberId}</Text>
                  </View>
                  <Text style={styles.applicantApplied}>
                    {formatDateTime(applicant.appliedAt)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.modalConfirm, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.modalConfirmText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
    gap: 18,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF2',
  },
  createBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 18,
    color: COLORS.text,
  },
  sectionCaption: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#6B7280',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E6F2',
    padding: 18,
    gap: 14,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    color: COLORS.text,
  },
  scheduleRange: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#6B7280',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusOpen: {
    backgroundColor: '#E0EBFF',
  },
  statusClosed: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  statusTextOpen: {
    color: COLORS.primary,
  },
  statusTextClosed: {
    color: '#4B5563',
  },
  scheduleNote: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#4B5563',
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: '#4B5563',
  },
  metaValue: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.text,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  outlineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  detailNotes: {
    gap: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F4F5FB',
  },
  detailNotesLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: '#4B5563',
  },
  detailNotesValue: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#4B5563',
  },
  applicantsSection: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applicantsTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  applicantName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  applicantId: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  applicantApplied: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  emptyApplicants: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#9CA3AF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 14,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 18,
    color: COLORS.text,
  },
  formField: {
    gap: 6,
  },
  formLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: '#4B5563',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  formTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  methodChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E0EBFF',
  },
  methodChipLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#4B5563',
  },
  methodChipLabelActive: {
    color: COLORS.primary,
  },
  datetimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInputWrap: {
    flex: 1,
    gap: 6,
  },
  dateInputLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: '#4B5563',
  },
  dateInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  dateInputValue: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#4B5563',
  },
  modalConfirm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  modalConfirmText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
