import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import {
  assignLockersByApplication,
  createLockerApplication,
  fetchLockerApplicationDetail,
  fetchLockerApplications,
  finishLockerApplication,
  LockerApplicationDetailInfoApi,
  LockerApplicationInfoApi,
} from '@/src/api/locker';

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
  applicationType: LockerApplicationInfoApi['applicationType'];
  isOpen: boolean;
  canAssign: boolean;
  notes?: string;
  applicants: LockerApplicant[];
};

const APPLICATION_TYPE_META: Record<
  string,
  { method: '정기' | '추가'; note?: string }
> = {
  LOCKER_MAIN: {
    method: '정기',
    note: '정기 배정 – 신청 인원은 자동으로 추첨됩니다.',
  },
  LOCKER_ADDITIONAL: {
    method: '추가',
    note: '추가 배정 – 정기 미배정자를 우선으로 합니다.',
  },
};

const FALLBACK_APPLICATION_META = { method: '정기' as const };

function toApplicationSchedule(item: LockerApplicationInfoApi): ApplicationSchedule {
  const meta = APPLICATION_TYPE_META[item.applicationType] ?? FALLBACK_APPLICATION_META;
  return {
    id: String(item.applicationId ?? item.semester ?? Date.now()),
    startAt: item.applicationStartAt,
    endAt: item.applicationEndAt,
    semester: item.semester,
    method: meta.method,
    applicationType: item.applicationType,
    isOpen: item.canApply,
    canAssign: item.canAssign,
    notes: meta.note,
    applicants: [],
  };
}

export default function LockerApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<ApplicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState<ApplicationSchedule | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadSchedules = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      setError(null);
      const list = await fetchLockerApplications();
      setSchedules(list.map(toApplicationSchedule));
    } catch (err: any) {
      console.warn('[locker-applications] fetch fail', err);
      setError(err?.response?.data?.message || err?.message || '사물함 신청 정보를 불러오지 못했습니다.');
    } finally {
      if (!options?.silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedules({ silent: true });
  }, [loadSchedules]);

  const handleRetry = useCallback(() => {
    loadSchedules();
  }, [loadSchedules]);

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [schedules]);

  const handleOpenDetail = useCallback((schedule: ApplicationSchedule) => {
    setDetailSchedule(schedule);
  }, []);

  const handleCreateSubmit = useCallback(
    async (schedule: ApplicationSchedule) => {
      try {
        await createLockerApplication({
          applicationStartAt: schedule.startAt,
          applicationEndAt: schedule.endAt,
          semester: schedule.semester,
          applicationType: schedule.applicationType,
        });
        Alert.alert('완료', `${schedule.semester} 사물함 신청을 생성했습니다.`);
        setCreateVisible(false);
        await loadSchedules();
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || '사물함 신청 생성에 실패했습니다.';
        Alert.alert('오류', message);
        throw err;
      }
    },
    [loadSchedules],
  );

  const handleToggleStatus = useCallback((scheduleId: string, updates: Partial<ApplicationSchedule>) => {
    setSchedules(prev => prev.map((item) => (item.id === scheduleId ? { ...item, ...updates } : item)));
  }, []);

  const handleFinishApplication = useCallback(
    async (target: ApplicationSchedule) => {
      const numericId = Number(target.id);
      if (Number.isNaN(numericId)) {
        Alert.alert('오류', '잘못된 신청 ID입니다.');
        return;
      }
      try {
        await finishLockerApplication(numericId);
        Alert.alert('완료', `${target.semester} 신청을 마감했습니다.`);
        handleToggleStatus(target.id, { isOpen: false });
        setDetailSchedule((prev) => (prev && prev.id === target.id ? { ...prev, isOpen: false } : prev));
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || '사물함 신청 마감에 실패했습니다.';
        Alert.alert('오류', message);
        throw err;
      }
    },
    [handleToggleStatus],
  );

  const handleAssignApplication = useCallback(
    async (target: ApplicationSchedule) => {
      const numericId = Number(target.id);
      if (Number.isNaN(numericId)) {
        Alert.alert('오류', '잘못된 신청 ID입니다.');
        return;
      }
      try {
        await assignLockersByApplication(numericId);
        Alert.alert('완료', `${target.semester} 신청에 대해 사물함을 일괄 배정했습니다.`);
        setSchedules((prev) =>
          prev.map((item) => (item.id === target.id ? { ...item, canAssign: false } : item)),
        );
        setDetailSchedule((prev) => (prev && prev.id === target.id ? { ...prev, canAssign: false } : prev));
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || '사물함 일괄 배정에 실패했습니다.';
        Alert.alert('오류', message);
        throw err;
      }
    },
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <CouncilHeader
          studentId="C246120"
          title="사물함 신청 관리"
          showBack
          backFallbackHref="/(council)/locker"
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scroll, { paddingBottom: 140 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          )}
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

        {loading && (
          <View style={styles.stateBlock}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.stateText}>신청 일정을 불러오는 중입니다.</Text>
          </View>
        )}

        {error && !loading && (
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [styles.stateBlock, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.stateText, { color: COLORS.danger }]}>{error}</Text>
            <Text style={styles.stateHelper}>다시 시도하려면 눌러주세요.</Text>
          </Pressable>
        )}

        {!loading && !error && !sortedSchedules.length && (
          <View style={styles.stateBlock}>
            <Text style={styles.stateText}>등록된 사물함 신청 일정이 없습니다.</Text>
            <Text style={styles.stateHelper}>새로운 일정을 생성하거나, 아래로 당겨 새로고침하세요.</Text>
          </View>
        )}

        {!loading && !error && sortedSchedules.map((item) => {
          const status = getScheduleStatus(item, now);
          return (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View style={{ gap: 4 }}>
                  <Text style={styles.scheduleTitle}>{item.semester} ({item.method})</Text>
                  <Text style={styles.scheduleRange}>{formatDateTime(item.startAt)} ~ {formatDateTime(item.endAt)}</Text>
                </View>
                <View style={[
                  styles.statusChip,
                  status.kind === 'available'
                    ? styles.statusOpen
                    : status.kind === 'upcoming'
                      ? styles.statusUpcoming
                      : styles.statusClosed,
                ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      status.kind === 'available'
                        ? styles.statusTextOpen
                        : status.kind === 'upcoming'
                          ? styles.statusTextUpcoming
                          : styles.statusTextClosed,
                    ]}
                  >
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleTimelineRow}>
                <View style={styles.scheduleTimelineItem}>
                  <Text style={styles.scheduleTimelineLabel}>시작</Text>
                  <Text style={styles.scheduleTimelineValue}>{formatDateTime(item.startAt)}</Text>
                </View>
                <View style={styles.scheduleTimelineItem}>
                  <Text style={styles.scheduleTimelineLabel}>종료</Text>
                  <Text style={styles.scheduleTimelineValue}>{formatDateTime(item.endAt)}</Text>
                </View>
              </View>

              {!!item.notes && <Text style={styles.scheduleNote}>{item.notes}</Text>}

              <View style={styles.scheduleMetaRow}>
                <MetaItem label="신청 방식" value={item.method} />
                <MetaItem label="배정 상태" value={item.canAssign ? '배정 가능' : '배정 마감'} />
              </View>

              <View style={styles.scheduleActions}>
                <Pressable
                  onPress={() => router.push({ pathname: '/(council)/locker/history', params: { schedule: item.semester } })}
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
          );
        })}
        </ScrollView>
      </View>

      <CreateScheduleModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreateSubmit}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        now={now}
        onClose={() => setDetailSchedule(null)}
        onFinishApplication={handleFinishApplication}
        onAssignAll={handleAssignApplication}
      />
    </SafeAreaView>
  );
}

function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return format(date, 'yyyy-MM-dd HH:mm');
}

function formatDateTimeWithMillis(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
}

function formatLocalDatePayload(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

type ScheduleStatusKind = 'upcoming' | 'available' | 'closed';

function getScheduleStatus(schedule: ApplicationSchedule, referenceTime: number): {
  label: string;
  kind: ScheduleStatusKind;
} {
  if (schedule.isOpen) {
    return { label: '신청 가능', kind: 'available' };
  }

  const start = Date.parse(schedule.startAt);
  const end = Date.parse(schedule.endAt);

  if (!Number.isNaN(start) && referenceTime < start) {
    return { label: '신청 전', kind: 'upcoming' };
  }

  if (!Number.isNaN(end) && referenceTime > end) {
    return { label: '신청 마감', kind: 'closed' };
  }

  return { label: '신청 불가', kind: 'closed' };
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
  onSubmit: (schedule: ApplicationSchedule) => Promise<void>;
}) {
  const [semester, setSemester] = useState('');
  const [method, setMethod] = useState<'정기' | '추가'>('정기');
  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(new Date(Date.now() + 1000 * 60 * 60 * 24));
  const [notes, setNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!semester.trim()) {
      Alert.alert('입력 필요', '학기를 입력해주세요.');
      return;
    }

    const payload: ApplicationSchedule = {
      id: `schedule-${semester}-${method}-${Date.now()}`,
      semester,
      method,
      applicationType: method === '추가' ? 'LOCKER_ADDITIONAL' : 'LOCKER_MAIN',
      startAt: formatLocalDatePayload(startAt),
      endAt: formatLocalDatePayload(endAt),
      isOpen,
      canAssign: true,
      notes: notes.trim() || undefined,
      applicants: [],
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch {
      // 부모에서 오류 메시지를 안내하므로 여기서는 상태만 복구
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
              disabled={submitting}
              style={({ pressed }) => [styles.modalCancel, pressed && !submitting && { opacity: 0.8 }]}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={submitting}
              style={({ pressed }) => [
                styles.modalConfirm,
                pressed && !submitting && { opacity: 0.9 },
                submitting && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.modalConfirmText}>{submitting ? '생성 중...' : '생성'}</Text>
            </Pressable>
          </View>
        </View>
        </View>
      </TouchableWithoutFeedback>
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
  const [tempDate, setTempDate] = useState(value);

  useEffect(() => {
    if (!showPicker) {
      setTempDate(value);
    }
  }, [showPicker, value]);

  const handleChange = (_event: any, nextDate?: Date) => {
    setShowPicker(false);
    if (nextDate) onChange(nextDate);
  };

  return (
    <View style={styles.dateInputWrap}>
      <Text style={styles.dateInputLabel}>{label}</Text>
      <Pressable
        onPress={() => {
          setTempDate(value);
          setShowPicker(true);
        }}
        style={({ pressed }) => [styles.dateInputBtn, pressed && { opacity: 0.9 }]}
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        <Text style={styles.dateInputValue}>{formatDateTime(value)}</Text>
      </Pressable>

      {Platform.OS !== 'ios' && showPicker && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="default"
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="fade">
          <View style={styles.pickerContainer}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setShowPicker(false)} />
            <View style={styles.pickerSheet}>
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display="spinner"
                onChange={(_, nextDate) => nextDate && setTempDate(nextDate)}
              />
              <View style={styles.pickerActions}>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  style={({ pressed }) => [styles.pickerActionBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.pickerActionText}>취소</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChange(tempDate);
                    setShowPicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.pickerActionBtn,
                    styles.pickerActionPrimary,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.pickerActionText, styles.pickerActionPrimaryText]}>확인</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function ScheduleDetailModal({
  schedule,
  now,
  onClose,
  onFinishApplication,
  onAssignAll,
}: {
  schedule: ApplicationSchedule | null;
  now: number;
  onClose: () => void;
  onFinishApplication: (schedule: ApplicationSchedule) => Promise<void> | void;
  onAssignAll: (schedule: ApplicationSchedule) => void;
}) {
  const [detail, setDetail] = useState<LockerApplicationDetailInfoApi | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!schedule) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    const numericId = Number(schedule.id);
    if (Number.isNaN(numericId)) {
      setDetailError('잘못된 신청 ID입니다.');
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    fetchLockerApplicationDetail(numericId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const message = err?.response?.data?.message || err?.message || '사물함 신청 상세를 불러오지 못했습니다.';
        setDetailError(message);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schedule, reloadKey]);

  const handleRetryDetail = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const handleFinishPress = useCallback(async () => {
    if (!schedule) return;
    try {
      setFinishing(true);
      await onFinishApplication(schedule);
      setReloadKey((prev) => prev + 1);
    } catch {
      // parent shows alert
    } finally {
      setFinishing(false);
    }
  }, [onFinishApplication, schedule]);

  const handleAssignPress = useCallback(async () => {
    if (!schedule) return;
    const disabled = detail ? !detail.canAssign : !schedule.canAssign;
    if (disabled) return;
    try {
      setAssigning(true);
      await onAssignAll(schedule);
      setReloadKey((prev) => prev + 1);
    } catch {
      // parent handles errors
    } finally {
      setAssigning(false);
    }
  }, [detail, onAssignAll, schedule]);

  if (!schedule) return null;

  type ApplicantEntry = LockerApplicationDetailInfoApi['applicants'][number] | LockerApplicant;

  const startAt = detail?.applicationStartAt ?? schedule.startAt;
  const endAt = detail?.applicationEndAt ?? schedule.endAt;
  const applicantEntries: ApplicantEntry[] = detail ? detail.applicants : schedule.applicants;
  const applicantTotalCount = detail?.applicantTotalCount ?? applicantEntries.length;
  const assignDisabled = detail ? !detail.canAssign : !schedule.canAssign;
  const status = getScheduleStatus(schedule, now);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={!!schedule}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{schedule.semester} 신청 상세</Text>
            <View style={styles.modalHeaderActions}>
              <View
                style={[
                  styles.statusChip,
                  status.kind === 'available'
                    ? styles.statusOpen
                    : status.kind === 'upcoming'
                      ? styles.statusUpcoming
                      : styles.statusClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    status.kind === 'available'
                      ? styles.statusTextOpen
                      : status.kind === 'upcoming'
                        ? styles.statusTextUpcoming
                        : styles.statusTextClosed,
                  ]}
                >
                  {status.label}
                </Text>
              </View>

              <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.scheduleMetaRow}>
              <MetaItem label="신청 방식" value={schedule.method} />
            </View>

            <View style={styles.detailTimelineRow}>
              <DetailTimelineItem label="시작" value={formatDateTime(startAt)} />
              <DetailTimelineItem label="종료" value={formatDateTime(endAt)} />
            </View>

            <View style={styles.detailStatsRow}>
              <DetailStatCard label="신청자 수" value={`${applicantTotalCount}명`} />
              <DetailStatCard
                label="배정 상태"
                value={assignDisabled ? '배정 마감' : '배정 가능'}
                tone={assignDisabled ? 'danger' : 'primary'}
              />
            </View>

            {!!schedule.notes && (
              <View style={styles.detailNotes}>
                <Text style={styles.detailNotesLabel}>알림</Text>
                <Text style={styles.detailNotesValue}>{schedule.notes}</Text>
              </View>
            )}

            {detailLoading && (
              <View style={styles.detailStateBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.detailStateText}>신청 상세를 불러오는 중입니다.</Text>
              </View>
            )}

            {detailError && !detailLoading && (
              <Pressable
                onPress={handleRetryDetail}
                style={({ pressed }) => [styles.detailStateBox, pressed && { opacity: 0.9 }]}
              >
                <Text style={[styles.detailStateText, { color: COLORS.danger }]}>{detailError}</Text>
                <Text style={styles.detailStateHelper}>다시 시도하려면 눌러주세요.</Text>
              </Pressable>
            )}

            <Pressable
              disabled={finishing || !schedule.isOpen}
              onPress={handleFinishPress}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || finishing) && { opacity: 0.9 },
                (!schedule.isOpen || finishing) && { backgroundColor: '#94A3B8' },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {finishing ? '마감 처리 중...' : '사물함 신청 마감하기'}
              </Text>
            </Pressable>

            <Pressable
              disabled={assignDisabled || assigning}
              onPress={handleAssignPress}
              style={({ pressed }) => [
                styles.outlineBtn,
                (assignDisabled || assigning) && styles.disabledBtn,
                pressed && !assignDisabled && !assigning && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.outlineBtnText,
                  (assignDisabled || assigning) && styles.disabledBtnText,
                ]}
              >
                {assigning ? '배정 중...' : '사물함 일괄 배정'}
              </Text>
            </Pressable>

            <View style={styles.applicantsSection}>
              <Text style={styles.applicantsTitle}>신청자 목록 ({applicantTotalCount}명)</Text>
              {applicantEntries.length === 0 ? (
                <Text style={styles.emptyApplicants}>신청자가 없습니다.</Text>
              ) : (
                applicantEntries.map((applicant, index) => {
                  const name = 'studentName' in applicant ? applicant.studentName : applicant.name;
                  const idValue = 'studentId' in applicant ? applicant.studentId : applicant.memberId;
                  const key = idValue ? `${idValue}-${index}` : `applicant-${index}`;
                  return (
                    <View key={key} style={styles.applicantRow}>
                      <View>
                        <Text style={styles.applicantName}>{name}</Text>
                        {!!idValue && <Text style={styles.applicantId}>{idValue}</Text>}
                      </View>
                    <Text style={styles.applicantApplied}>
                      {formatDateTimeWithMillis(applicant.appliedAt)}
                    </Text>
                    </View>
                  );
                })
              )}
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalConfirm, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.modalConfirmText}>닫기</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailTimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailTimelineItem}>
      <Text style={styles.detailTimelineLabel}>{label}</Text>
      <Text style={styles.detailTimelineValue}>{value}</Text>
    </View>
  );
}

function DetailStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'danger';
}) {
  return (
    <View style={styles.detailStatCard}>
      <Text style={styles.detailStatLabel}>{label}</Text>
      <Text
        style={[
          styles.detailStatValue,
          tone === 'primary' && { color: COLORS.primary },
          tone === 'danger' && { color: COLORS.danger },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scrollArea: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
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
  stateBlock: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  stateHelper: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusOpen: {
    backgroundColor: '#E0EBFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusUpcoming: {
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statusClosed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  statusTextOpen: {
    color: COLORS.primary,
  },
  statusTextUpcoming: {
    color: '#B45309',
  },
  statusTextClosed: {
    color: '#DC2626',
  },
  scheduleNote: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#4B5563',
  },
  scheduleTimelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleTimelineItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  scheduleTimelineLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: '#6B7280',
  },
  scheduleTimelineValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.text,
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
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
  disabledBtn: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  disabledBtnText: {
    color: '#9CA3AF',
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
  detailTimelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailTimelineItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  detailTimelineLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: '#6B7280',
  },
  detailTimelineValue: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: COLORS.text,
  },
  detailStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailStatCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  detailStatLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: '#6B7280',
  },
  detailStatValue: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 18,
    color: COLORS.text,
  },
  detailStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  detailStateText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
  },
  detailStateHelper: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
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
    width: '100%',
  },
  modalScroll: {
    paddingBottom: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  pickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  pickerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  pickerActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pickerActionText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  pickerActionPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerActionPrimaryText: {
    color: '#FFFFFF',
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
