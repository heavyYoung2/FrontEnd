import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  AdminRentalHistory,
  AdminRentalStatus,
  fetchAdminRentalHistories,
  manuallyReturnRentalHistory,
} from '@/src/api/rentalAdmin';

type RentalRecord = {
  id: string;
  rentalHistoryId: number | null;
  itemCategoryId: number | null;
  category: string;
  itemName: string;
  renterName: string;
  renterId: string;
  rentDate: string | null;
  dueDate: string | null;
  returnDate: string | null;
  status: AdminRentalStatus;
};

const STATUS_ORDER: AdminRentalStatus[] = ['IN_PROGRESS', 'OVERDUE', 'RETURNED'];

const STATUS_META: Record<
  AdminRentalStatus,
  { label: string; chipBg: string; chipColor: string; badgeBg: string; badgeColor: string }
> = {
  IN_PROGRESS: {
    label: '대여중',
    chipBg: '#EEF2FF',
    chipColor: COLORS.primary,
    badgeBg: '#EEF2FF',
    badgeColor: COLORS.primary,
  },
  OVERDUE: {
    label: '연체',
    chipBg: 'rgba(239, 68, 68, 0.1)',
    chipColor: COLORS.danger,
    badgeBg: 'rgba(239, 68, 68, 0.14)',
    badgeColor: COLORS.danger,
  },
  RETURNED: {
    label: '반납완료',
    chipBg: '#E6F9F3',
    chipColor: '#0F766E',
    badgeBg: '#E6F9F3',
    badgeColor: '#0F766E',
  },
  CANCELLED: {
    label: '취소됨',
    chipBg: COLORS.surface,
    chipColor: COLORS.textMuted,
    badgeBg: COLORS.surface,
    badgeColor: COLORS.textMuted,
  },
};

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  ...STATUS_ORDER.map((key) => ({ key, label: STATUS_META[key].label })),
] as const;

type StatusFilterKey = (typeof STATUS_FILTERS)[number]['key'];

type CategoryFilterKey = number | null;
type CategoryOption = { id: CategoryFilterKey; label: string };
const ALL_CATEGORY_ID: CategoryFilterKey = null;
const CATEGORY_LABEL_BY_ID: Record<number, string> = {
  1: '보조배터리',
  2: '노트북 충전기',
  3: '장우산',
};
const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: ALL_CATEGORY_ID, label: '전체' },
  { id: 1, label: CATEGORY_LABEL_BY_ID[1] },
  { id: 2, label: CATEGORY_LABEL_BY_ID[2] },
  { id: 3, label: CATEGORY_LABEL_BY_ID[3] },
];

const mapHistoryToRecord = (history: AdminRentalHistory): RentalRecord => {
  const identifier =
    history.rentalHistoryId != null
      ? String(history.rentalHistoryId)
      : [
          history.itemName,
          history.renterStudentId,
          history.rentalStartedAt ?? '',
          Math.random().toString(36).slice(2, 8),
        ].join('-');

  const rawCategory = history.itemCategoryName?.trim() ?? '';
  const normalizedCategory = rawCategory === '기타' ? '' : rawCategory || '기타';
  const categoryLabel =
    (history.itemCategoryId != null && CATEGORY_LABEL_BY_ID[history.itemCategoryId]) || normalizedCategory;
  return {
    id: identifier,
    rentalHistoryId: history.rentalHistoryId,
    itemCategoryId: history.itemCategoryId,
    category: categoryLabel,
    itemName: history.itemName,
    renterName: history.renterName,
    renterId: history.renterStudentId,
    rentDate: history.rentalStartedAt,
    dueDate: history.expectedReturnAt,
    returnDate: history.returnedAt,
    status: history.rentalStatus,
  };
};

export default function RentalOverviewScreen() {
  const [records, setRecords] = useState<RentalRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>(ALL_CATEGORY_ID);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [pendingRecord, setPendingRecord] = useState<RentalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRecords = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const histories = await fetchAdminRentalHistories();
      setRecords(histories.map(mapHistoryToRecord));
    } catch (err) {
      console.warn('[council rental] failed to load histories', err);
      const message = err instanceof Error ? err.message : '대여 내역을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }, [loadRecords]);

  const categoryOptions = CATEGORY_OPTIONS;

  useEffect(() => {
    if (!categoryOptions.some((option) => option.id === categoryFilter)) {
      setCategoryFilter(ALL_CATEGORY_ID);
    }
  }, [categoryFilter, categoryOptions]);

  const filteredRecords = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (categoryFilter !== ALL_CATEGORY_ID && record.itemCategoryId !== categoryFilter) return false;
      if (selectedDate && !matchesSelectedDate(record.rentDate, selectedDate)) return false;
      if (keyword) {
        const target = `${record.itemName} ${record.renterName} ${record.renterId} ${record.category}`.toLowerCase();
        if (!target.includes(keyword)) return false;
      }
      return true;
    });
  }, [records, statusFilter, categoryFilter, searchTerm, selectedDate]);

  const handleManualReturn = (record: RentalRecord) => {
    setPendingRecord(record);
  };

  const openDatePicker = () => {
    setTempDate(selectedDate ?? new Date());
    setIsDatePickerOpen(true);
  };

  const handleConfirmDate = () => {
    setSelectedDate(tempDate);
    setIsDatePickerOpen(false);
  };

  const clearDateFilter = () => setSelectedDate(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="대여 현황 및 관리"
        showBack
        backFallbackHref="/(council)/rental"
        right={(
          <Pressable onPress={isDatePickerOpen ? undefined : openDatePicker} hitSlop={10} style={styles.dateIconBtn}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.text} />
          </Pressable>
        )}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.filtersCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="이름, 학번, 물품명 검색"
              placeholderTextColor={COLORS.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
            />
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categoryOptions.map((category) => {
              const active = categoryFilter === category.id;
              return (
                <Pressable
                  key={`${category.id ?? 'all'}-${category.label}`}
                  onPress={() => setCategoryFilter(category.id)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.statusRow}>
            {STATUS_FILTERS.map((item) => {
              const active = statusFilter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setStatusFilter(item.key)}
                  style={[styles.statusChip, active && styles.statusChipActive]}
                >
                  <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedDate && (
            <View style={styles.dateFilterBadge}>
              <Text style={styles.dateFilterText}>{formatSelectedDate(selectedDate)} 기준</Text>
              <Pressable onPress={clearDateFilter} hitSlop={10}>
                <Ionicons name="close" size={16} color={COLORS.text} />
              </Pressable>
            </View>
          )}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={loadRecords} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.85 }]}>
              <Ionicons name="refresh" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.retryBtnText}>다시 불러오기</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.listSection}>
          {loading && records.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>대여 내역을 불러오는 중입니다.</Text>
            </View>
          ) : (
            <>
              {filteredRecords.map((record) => (
                <RentalRecordCard
                  key={record.id}
                  record={record}
                  onManualReturn={handleManualReturn}
                />
              ))}

              {!loading && filteredRecords.length === 0 && (
                <View style={styles.emptyBox}>
                  <Ionicons name="file-tray" size={28} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyText}>조건에 해당하는 대여 기록이 없습니다.</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {isDatePickerOpen && (
        <DateModal
          value={tempDate}
          onChange={setTempDate}
          onClose={() => setIsDatePickerOpen(false)}
          onConfirm={handleConfirmDate}
        />
      )}

      <ConfirmReturnModal
        visible={!!pendingRecord}
        record={pendingRecord}
        submitting={submitting}
        onCancel={() => (submitting ? undefined : setPendingRecord(null))}
        onConfirm={async () => {
          if (!pendingRecord?.rentalHistoryId) {
            Alert.alert('반납 처리 실패', '대여 이력 정보를 찾을 수 없어요.');
            setPendingRecord(null);
            return;
          }
          try {
            setSubmitting(true);
            await manuallyReturnRentalHistory(pendingRecord.rentalHistoryId);
            await loadRecords();
            setPendingRecord(null);
          } catch (err) {
            const message = err instanceof Error ? err.message : '반납 처리에 실패했습니다.';
            Alert.alert('반납 처리 실패', message);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

type RentalRecordCardProps = {
  record: RentalRecord;
  onManualReturn: (record: RentalRecord) => void;
};

function RentalRecordCard({ record, onManualReturn }: RentalRecordCardProps) {
  const isReturned = record.status === 'RETURNED';
  const isDisabled = isReturned || record.status === 'CANCELLED';
  const buttonLabel = isReturned
    ? '반납 완료'
    : record.status === 'OVERDUE'
      ? '연체 처리'
      : '수동 반납 처리';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        {record.category && <Text style={styles.cardTitle}>{record.category}</Text>}
        <StatusBadge status={record.status} />
      </View>

      <View style={styles.cardInfoRow}>
        <Ionicons name="cube-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.cardInfoText}>{record.itemName}</Text>
      </View>

      <View style={styles.cardInfoRow}>
        <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
        <Text style={styles.cardInfoText}>
          {record.renterName} ({record.renterId})
        </Text>
      </View>

      <View style={styles.datesGrid}>
        <DateLine label="대여 일자" value={record.rentDate} />
        <DateLine label="반납 예정" value={record.dueDate} />
        <DateLine label="실제 반납" value={record.returnDate} />
      </View>

      <Pressable
        onPress={() => (isDisabled ? undefined : onManualReturn(record))}
        style={({ pressed }) => [
          styles.cardButton,
          isDisabled ? styles.cardButtonDisabled : styles.cardButtonActive,
          pressed && !isDisabled && { opacity: 0.92 },
        ]}
      >
        <Text
          style={[styles.cardButtonText, isDisabled ? styles.cardButtonTextDisabled : styles.cardButtonTextActive]}
        >
          {buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
}

type StatusBadgeProps = { status: AdminRentalStatus };

function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META.IN_PROGRESS;
  return (
    <View style={[styles.statusBadge, { backgroundColor: meta.badgeBg }]}>
      <Text style={[styles.statusBadgeText, { color: meta.badgeColor }]}>{meta.label}</Text>
    </View>
  );
}

type DateLineProps = { label: string; value: string | null };

function DateLine({ label, value }: DateLineProps) {
  return (
    <View style={styles.dateLine}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{formatDateValue(value)}</Text>
    </View>
  );
}

type DateModalProps = {
  value: Date;
  onChange: (value: Date) => void;
  onConfirm: () => void;
  onClose: () => void;
};

function DateModal({ value, onChange, onConfirm, onClose }: DateModalProps) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={value}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              locale="ko"
              onChange={(_, selected) => {
                if (selected) onChange(selected);
              }}
            />
          </View>

          <View style={styles.modalActionsRow}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.modalGhostBtn, pressed && { opacity: 0.9 }]}>
              <Text style={styles.modalGhostText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.modalPrimaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.modalPrimaryText}>적용</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type ConfirmReturnModalProps = {
  visible: boolean;
  record: RentalRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
};

function ConfirmReturnModal({ visible, record, onConfirm, onCancel, submitting }: ConfirmReturnModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalContainer, { gap: 20 }]}> 
          <View style={styles.confirmIconWrapper}>
            <Ionicons name="alert-circle" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.confirmTitle}>해당 물품을 반납 처리 하시겠습니까?</Text>
          {record && (
            <View style={styles.confirmDetails}>
              <Text style={styles.confirmDetailText}>대여자 정보 : {record.renterId} {record.renterName}</Text>
              <Text style={styles.confirmDetailText}>물품명 : {record.itemName}</Text>
            </View>
          )}
          <View style={styles.confirmActions}>
            <Pressable
              onPress={onCancel}
              disabled={submitting}
              style={({ pressed }) => [styles.modalGhostBtn, pressed && { opacity: 0.9 }, submitting && { opacity: 0.5 }]}
            >
              <Text style={styles.modalGhostText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={submitting}
              style={({ pressed }) => [
                styles.modalPrimaryBtn,
                pressed && { opacity: 0.9 },
                submitting && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.modalPrimaryText}>{submitting ? '처리 중...' : '확인'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function parseDateValue(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateValue(value: string | null) {
  const date = parseDateValue(value);
  if (!date) return '-';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function matchesSelectedDate(value: string | null, selected: Date) {
  const date = parseDateValue(value);
  if (!date) return false;
  return (
    date.getFullYear() === selected.getFullYear() &&
    date.getMonth() === selected.getMonth() &&
    date.getDate() === selected.getDate()
  );
}

function formatSelectedDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.page },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 140, paddingTop: 16, gap: 16 },
  filtersCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  categoryRow: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  statusChipText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  statusChipTextActive: {
    color: COLORS.primary,
  },
  dateFilterBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  dateFilterText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.primary,
    fontSize: 12,
  },
  listSection: {
    gap: 14,
    paddingBottom: 12,
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.danger,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.blue100,
  },
  retryBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
    fontSize: 12,
  },
  loadingBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textMuted,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInfoText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  datesGrid: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
    gap: 8,
  },
  dateLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  dateValue: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  cardButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonActive: {
    backgroundColor: COLORS.primary,
  },
  cardButtonDisabled: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardButtonText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  cardButtonTextActive: {
    color: '#FFFFFF',
  },
  cardButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textMuted,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 16,
  },
  pickerWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalGhostBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalGhostText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  modalPrimaryBtn: {
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalPrimaryText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  dateIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  confirmTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 17,
    color: COLORS.text,
    textAlign: 'center',
  },
  confirmDetails: {
    gap: 6,
  },
  confirmDetailText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
