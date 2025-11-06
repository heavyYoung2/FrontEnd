import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import DateTimePicker from '@react-native-community/datetimepicker';

type RentalStatus = 'rented' | 'returned';

type RentalRecord = {
  id: string;
  category: string;
  itemName: string;
  renterName: string;
  renterId: string;
  rentDate: string;   // yyyy-MM-dd
  dueDate: string;    // yyyy-MM-dd
  actualReturnDate?: string | null;
  status: RentalStatus;
};

const MOCK_RENTAL_HISTORY: RentalRecord[] = [
  {
    id: 'rent-1001',
    category: '보조배터리',
    itemName: '보조배터리 02',
    renterName: '윤현일',
    renterId: 'C123544',
    rentDate: '2025-07-12',
    dueDate: '2025-07-13',
    actualReturnDate: null,
    status: 'rented',
  },
  {
    id: 'rent-1002',
    category: '보조배터리',
    itemName: '보조배터리 05',
    renterName: '박형진',
    renterId: 'C123544',
    rentDate: '2025-06-11',
    dueDate: '2025-06-12',
    actualReturnDate: '2025-06-12',
    status: 'returned',
  },
  {
    id: 'rent-1003',
    category: '충전기',
    itemName: '충전기 01',
    renterName: '안제웅',
    renterId: 'C123544',
    rentDate: '2025-06-08',
    dueDate: '2025-06-09',
    actualReturnDate: '2025-06-11',
    status: 'returned',
  },
  {
    id: 'rent-1004',
    category: '장우산',
    itemName: '장우산 03',
    renterName: '이다슬',
    renterId: 'C123544',
    rentDate: '2025-05-12',
    dueDate: '2025-05-13',
    actualReturnDate: '2025-07-12',
    status: 'returned',
  },
  {
    id: 'rent-1005',
    category: '장우산',
    itemName: '장우산 01',
    renterName: '김보람',
    renterId: 'C123677',
    rentDate: '2025-07-01',
    dueDate: '2025-07-02',
    actualReturnDate: null,
    status: 'rented',
  },
];

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'rented', label: '대여중' },
  { key: 'returned', label: '반납완료' },
] as const;

const CATEGORY_FILTERS = ['전체', '보조배터리', '충전기', '장우산'] as const;

type StatusFilterKey = (typeof STATUS_FILTERS)[number]['key'];
type CategoryFilterKey = (typeof CATEGORY_FILTERS)[number];

export default function RentalOverviewScreen() {
  const [records, setRecords] = useState<RentalRecord[]>(MOCK_RENTAL_HISTORY);
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [pendingRecord, setPendingRecord] = useState<RentalRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (categoryFilter !== '전체' && record.category !== categoryFilter) return false;
      if (selectedDate) {
        const rentDate = new Date(record.rentDate);
        if (
          rentDate.getFullYear() !== selectedDate.getFullYear() ||
          rentDate.getMonth() !== selectedDate.getMonth()
        ) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const keyword = searchTerm.trim().toLowerCase();
        const target = [record.itemName, record.renterName, record.renterId, record.category]
          .join(' ')
          .toLowerCase();
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

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            {CATEGORY_FILTERS.map((category) => {
              const active = categoryFilter === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setCategoryFilter(category)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {category}
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
              <Text style={styles.dateFilterText}>{formatYearMonth(selectedDate)} 기준</Text>
              <Pressable onPress={clearDateFilter} hitSlop={10}>
                <Ionicons name="close" size={16} color={COLORS.text} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.listSection}>
          {filteredRecords.map((record) => (
            <RentalRecordCard
              key={record.id}
              record={record}
              onManualReturn={handleManualReturn}
            />
          ))}

          {filteredRecords.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray" size={28} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>조건에 해당하는 대여 기록이 없습니다.</Text>
            </View>
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
        onCancel={() => setPendingRecord(null)}
        onConfirm={() => {
          if (!pendingRecord) return;
          setRecords((prev) => prev.filter((item) => item.id !== pendingRecord.id));
          setPendingRecord(null);
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
  const isReturned = record.status === 'returned';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{record.category}</Text>
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
        <DateLine label="실제 반납" value={record.actualReturnDate ?? '-'} />
      </View>

      <Pressable
        onPress={() => (isReturned ? undefined : onManualReturn(record))}
        style={({ pressed }) => [
          styles.cardButton,
          isReturned ? styles.cardButtonDisabled : styles.cardButtonActive,
          pressed && !isReturned && { opacity: 0.92 },
        ]}
      >
        <Text style={[styles.cardButtonText, isReturned ? styles.cardButtonTextDisabled : styles.cardButtonTextActive]}>
          {isReturned ? '반납 완료' : '수동 반납 처리'}
        </Text>
      </Pressable>
    </View>
  );
}

type StatusBadgeProps = { status: RentalStatus };

function StatusBadge({ status }: StatusBadgeProps) {
  const isReturned = status === 'returned';
  return (
    <View style={[styles.statusBadge, isReturned ? styles.statusBadgeReturned : styles.statusBadgeRented]}>
      <Text style={[styles.statusBadgeText, isReturned ? styles.statusBadgeTextReturned : styles.statusBadgeTextRented]}>
        {isReturned ? '반납 완료' : '대여중'}
      </Text>
    </View>
  );
}

type DateLineProps = { label: string; value: string };

function DateLine({ label, value }: DateLineProps) {
  return (
    <View style={styles.dateLine}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{value}</Text>
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
};

function ConfirmReturnModal({ visible, record, onConfirm, onCancel }: ConfirmReturnModalProps) {
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
              style={({ pressed }) => [styles.modalGhostBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.modalGhostText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.modalPrimaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.modalPrimaryText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatYearMonth(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.page },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16, gap: 16 },
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
  statusBadgeRented: {
    backgroundColor: '#EEF2FF',
  },
  statusBadgeReturned: {
    backgroundColor: '#E6F9F3',
  },
  statusBadgeText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
  },
  statusBadgeTextRented: {
    color: COLORS.primary,
  },
  statusBadgeTextReturned: {
    color: '#0F766E',
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
