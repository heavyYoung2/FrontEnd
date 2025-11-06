import React, { useMemo, useState } from 'react';
import {
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
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { useRouter } from 'expo-router';

type AssetStatus = 'available' | 'rented';

type AssetItem = {
  id: string;
  label: string;
  status: AssetStatus;
};

type RentalCategory = {
  id: string;
  name: string;
  description?: string;
  assets: AssetItem[];
};

type ModalState =
  | { type: 'quantity'; category: RentalCategory }
  | { type: 'assets'; category: RentalCategory }
  | null;

const MOCK_CATEGORY_DATA: RentalCategory[] = [
  {
    id: 'backup-battery',
    name: '보조배터리',
    description: '모든 기종 호환 10,000mAh',
    assets: Array.from({ length: 20 }).map((_, idx) => ({
      id: `battery-${idx + 1}`,
      label: `보조배터리 ${idx + 1}`,
      status: idx < 18 ? 'available' : 'rented',
    })),
  },
  {
    id: 'umbrella',
    name: '우산',
    description: '비 예보 시 인기 품목',
    assets: Array.from({ length: 14 }).map((_, idx) => ({
      id: `umbrella-${idx + 1}`,
      label: `우산 ${idx + 1}`,
      status: idx < 10 ? 'available' : 'rented',
    })),
  },
  {
    id: 'charger',
    name: '노트북 충전기',
    description: 'C타입 고속 충전 지원',
    assets: Array.from({ length: 8 }).map((_, idx) => ({
      id: `charger-${idx + 1}`,
      label: `충전기 ${idx + 1}`,
      status: idx < 5 ? 'available' : 'rented',
    })),
  },
];

export default function RentalTab() {
  const router = useRouter();
  const [categories, setCategories] = useState<RentalCategory[]>(MOCK_CATEGORY_DATA);
  const [modalState, setModalState] = useState<ModalState>(null);

  const totals = useMemo(() => {
    const totalItems = categories.reduce((sum, cat) => sum + cat.assets.length, 0);
    const rentedItems = categories.reduce(
      (sum, cat) => sum + cat.assets.filter((asset) => asset.status === 'rented').length,
      0,
    );
    return { totalItems, rentedItems };
  }, [categories]);

  const updateCategory = (categoryId: string, updater: (category: RentalCategory) => RentalCategory) => {
    setCategories((prev) => prev.map((category) => (category.id === categoryId ? updater(category) : category)));
  };

  const handleRent = (category: RentalCategory) => {
    const target = category.assets.find((item) => item.status === 'available');
    if (!target) {
      Alert.alert('대여 처리', '대여 가능한 물품이 없습니다.');
      return;
    }

    updateCategory(category.id, (cat) => ({
      ...cat,
      assets: cat.assets.map((item) =>
        item.id === target.id ? { ...item, status: 'rented' as AssetStatus } : item
      ),
    }));
    Alert.alert('대여 처리 완료', `${category.name} - ${target.label} 대여로 처리되었습니다.`);
  };

  const handleReturn = (category: RentalCategory) => {
    const target = category.assets.find((item) => item.status === 'rented');
    if (!target) {
      Alert.alert('반납 처리', '현재 대여 중인 물품이 없습니다.');
      return;
    }

    updateCategory(category.id, (cat) => ({
      ...cat,
      assets: cat.assets.map((item) =>
        item.id === target.id ? { ...item, status: 'available' as AssetStatus } : item
      ),
    }));
    Alert.alert('반납 처리 완료', `${category.name} - ${target.label} 반납으로 처리되었습니다.`);
  };

  const handleQuantityChange = (category: RentalCategory) => {
    setModalState({ type: 'quantity', category });
  };

  const handleManageAssets = (category: RentalCategory) => {
    setModalState({ type: 'assets', category });
  };

  const closeModal = () => setModalState(null);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="대여 물품"
        right={(
          <Pressable onPress={() => router.push('/(council)/rental/overview')} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="list" size={20} color={COLORS.text} />
          </Pressable>
        )}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.overviewCard}>
          <View>
            <Text style={styles.overviewTitle}>현재 대여 현황</Text>
            <Text style={styles.overviewSubtitle}>실시간으로 반납/대여 상황을 확인하세요</Text>
          </View>
          <View style={styles.overviewStatsRow}>
            <View style={styles.overviewStatBox}>
              <Text style={styles.overviewStatLabel}>전체 물품</Text>
              <Text style={styles.overviewStatValue}>{totals.totalItems}</Text>
            </View>
            <View style={styles.overviewStatDivider} />
            <View style={styles.overviewStatBox}>
              <Text style={styles.overviewStatLabel}>대여 중</Text>
              <Text style={[styles.overviewStatValue, { color: COLORS.primary }]}>
                {totals.rentedItems}
              </Text>
            </View>
          </View>
        </View>

        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onQuantity={() => handleQuantityChange(category)}
            onReturn={() => handleReturn(category)}
            onRent={() => handleRent(category)}
            onManageAssets={() => handleManageAssets(category)}
          />
        ))}

        <View style={styles.actionPanel}>
          <Pressable
            onPress={() => router.push('/(council)/rental/overview')}
            style={({ pressed }) => [styles.panelButtonPrimary, pressed && styles.panelButtonPrimaryPressed]}
          >
            <Ionicons name="bar-chart" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.panelButtonPrimaryText}>대여 현황 및 관리</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(council)/rental/add')}
            style={({ pressed }) => [styles.panelButtonGhost, pressed && styles.panelButtonGhostPressed]}
          >
            <Ionicons name="add-circle" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.panelButtonGhostText}>대여 물품 추가하기</Text>
          </Pressable>
        </View>
      </ScrollView>

      {modalState?.type === 'quantity' && (
        <QuantityModal
          visible
          category={modalState.category}
          onClose={closeModal}
          onSubmit={(nextTotal) => {
            updateCategory(modalState.category.id, (cat) => adjustCategoryQuantity(cat, nextTotal));
            closeModal();
          }}
        />
      )}

      {modalState?.type === 'assets' && (
        <ManageAssetsModal
          visible
          category={modalState.category}
          onClose={closeModal}
          onUpdate={(nextAssets) => {
            updateCategory(modalState.category.id, (cat) => ({
              ...cat,
              assets: nextAssets,
            }));
            closeModal();
          }}
        />
      )}
    </SafeAreaView>
  );
}

type CategoryCardProps = {
  category: RentalCategory;
  onQuantity: () => void;
  onReturn: () => void;
  onRent: () => void;
  onManageAssets: () => void;
};

function CategoryCard({ category, onQuantity, onReturn, onRent, onManageAssets }: CategoryCardProps) {
  const total = category.assets.length;
  const available = category.assets.filter((asset) => asset.status === 'available').length;
  const rented = total - available;
  const availabilityRatio = total === 0 ? 0 : available / total;

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          {!!category.description && <Text style={styles.categoryDesc}>{category.description}</Text>}
        </View>
        <Pressable onPress={onManageAssets} hitSlop={10} style={styles.manageChip}>
          <Ionicons name="settings-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.manageChipText}>물품 관리</Text>
        </Pressable>
      </View>

      <View style={styles.categoryStatsRow}>
        <StatPill label="총 수량" value={total} />
        <StatPill label="대여 가능" value={available} tone="positive" />
        <StatPill label="대여 중" value={rented} tone="negative" />
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { flex: availabilityRatio, backgroundColor: COLORS.primary }]} />
        <View style={{ flex: 1 - availabilityRatio }} />
      </View>

      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>대여 가능 {available}개</Text>
        <Text style={styles.progressLabelMuted}>전체 {total}개</Text>
      </View>

      <View style={styles.categoryActionsRow}>
        <GhostButton label="수량 변경" icon="create-outline" onPress={onQuantity} />
        <GhostButton label="반납 처리" icon="arrow-undo" onPress={onReturn} />
        <PrimaryGhostButton label="대여 처리" icon="arrow-redo" onPress={onRent} />
      </View>
    </View>
  );
}

type StatPillProps = {
  label: string;
  value: number;
  tone?: 'default' | 'positive' | 'negative';
};

function StatPill({ label, value, tone = 'default' }: StatPillProps) {
  const toneColor = tone === 'positive' ? COLORS.primary : tone === 'negative' ? COLORS.danger : COLORS.text;
  return (
    <View style={[styles.statPill, { borderColor: toneColor }]}>
      <Text style={[styles.statPillLabel, { color: COLORS.textMuted }]}>{label}</Text>
      <Text style={[styles.statPillValue, { color: toneColor }]}>{value}</Text>
    </View>
  );
}

type GhostButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function GhostButton({ label, icon, onPress }: GhostButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostButton, pressed && styles.ghostButtonPressed]}>
      <Ionicons name={icon} size={16} color={COLORS.text} style={{ marginRight: 6 }} />
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

function PrimaryGhostButton({ label, icon, onPress }: GhostButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primaryGhostButton, pressed && styles.primaryGhostButtonPressed]}
    >
      <Ionicons name={icon} size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
      <Text style={[styles.ghostButtonText, { color: COLORS.primary }]}>{label}</Text>
    </Pressable>
  );
}

type QuantityModalProps = {
  visible: boolean;
  category: RentalCategory;
  onClose: () => void;
  onSubmit: (nextTotal: number) => void;
};

function QuantityModal({ visible, category, onClose, onSubmit }: QuantityModalProps) {
  const rentedCount = category.assets.filter((asset) => asset.status === 'rented').length;
  const [count, setCount] = useState(category.assets.length);

  const decrementDisabled = count <= rentedCount;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>수량 변경</Text>
          <Text style={styles.modalSubtitle}>
            {category.name}의 총 수량을 조정하세요. 현재 대여 중 {rentedCount}개는 유지됩니다.
          </Text>

          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => !decrementDisabled && setCount((prev) => Math.max(prev - 1, rentedCount))}
              style={[styles.stepperButton, decrementDisabled && styles.stepperButtonDisabled]}
            >
              <Ionicons name="remove" size={18} color={decrementDisabled ? COLORS.textMuted : COLORS.text} />
            </Pressable>
            <Text style={styles.stepperValue}>{count}</Text>
            <Pressable
              onPress={() => setCount((prev) => Math.min(prev + 1, 200))}
              style={styles.stepperButton}
            >
              <Ionicons name="add" size={18} color={COLORS.text} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              if (count < rentedCount) {
                Alert.alert('수량 변경', '대여 중인 물품보다 적게 설정할 수 없습니다.');
                return;
              }
              onSubmit(count);
            }}
            style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.modalPrimaryBtnPressed]}
          >
            <Text style={styles.modalPrimaryText}>적용하기</Text>
          </Pressable>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.modalGhostBtn, pressed && styles.modalGhostBtnPressed]}>
            <Text style={styles.modalGhostText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function adjustCategoryQuantity(category: RentalCategory, targetTotal: number): RentalCategory {
  const currentAssets = category.assets;
  const rented = currentAssets.filter((asset) => asset.status === 'rented');
  const available = currentAssets.filter((asset) => asset.status === 'available');

  if (targetTotal === currentAssets.length) return category;

  if (targetTotal < currentAssets.length) {
    // Remove from available first, keeping rented items untouched
    const itemsToRemove = currentAssets.length - targetTotal;
    const updatedAvailable = available.slice(0, Math.max(available.length - itemsToRemove, 0));
    const neededRemovalFromRented = Math.max(itemsToRemove - available.length, 0);
    const updatedRented = rented.slice(0, rented.length - neededRemovalFromRented);
    const nextAssets = [...updatedAvailable, ...updatedRented];
    return {
      ...category,
      assets: nextAssets,
    };
  }

  const itemsToAdd = targetTotal - currentAssets.length;
  const nextAssets = [...currentAssets];
  for (let i = 0; i < itemsToAdd; i += 1) {
    const nextIdx = currentAssets.length + i + 1;
    nextAssets.push({
      id: `${category.id}-auto-${Date.now()}-${i}`,
      label: `${category.name} ${nextIdx}`,
      status: 'available',
    });
  }
  return {
    ...category,
    assets: nextAssets,
  };
}

type ManageAssetsModalProps = {
  visible: boolean;
  category: RentalCategory;
  onUpdate: (nextAssets: AssetItem[]) => void;
  onClose: () => void;
};

function ManageAssetsModal({ visible, category, onUpdate, onClose }: ManageAssetsModalProps) {
  const [draftAssets, setDraftAssets] = useState<AssetItem[]>(category.assets);

  const toggleStatus = (assetId: string) => {
    setDraftAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              status: asset.status === 'available' ? 'rented' : 'available',
            }
          : asset
      )
    );
  };

  const handleAddAsset = () => {
    setDraftAssets((prev) => [
      ...prev,
      {
        id: `${category.id}-new-${Date.now()}`,
        label: `${category.name} ${prev.length + 1}`,
        status: 'available',
      },
    ]);
  };

  const handleRemoveAsset = (assetId: string) => {
    setDraftAssets((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { maxHeight: '72%' }]}>
          <Text style={styles.modalTitle}>물품 관리</Text>
          <Text style={styles.modalSubtitle}>{category.name} 상세 목록을 확인하고 상태를 조정하세요.</Text>

          <ScrollView style={styles.assetList} contentContainerStyle={{ paddingVertical: 4 }}>
            {draftAssets.map((asset) => (
              <View key={asset.id} style={styles.assetRow}>
                <Pressable onPress={() => toggleStatus(asset.id)} style={styles.assetStatusToggle}>
                  <Ionicons
                    name={asset.status === 'available' ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={asset.status === 'available' ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={styles.assetLabel}>{asset.label}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveAsset(asset.id)}
                  style={({ pressed }) => [styles.assetDelete, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={styles.assetActionsRow}>
            <Pressable
              onPress={handleAddAsset}
              style={({ pressed }) => [styles.assetActionBtn, pressed && styles.assetActionBtnPressed]}
            >
              <Ionicons name="add" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.assetActionText, { color: COLORS.primary }]}>물품 추가</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onUpdate(draftAssets);
              }}
              style={({ pressed }) => [styles.assetActionBtnFilled, pressed && styles.assetActionBtnFilledPressed]}
            >
              <Text style={[styles.assetActionText, { color: '#fff' }]}>변경사항 저장</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.modalGhostBtn, pressed && styles.modalGhostBtnPressed]}>
            <Text style={styles.modalGhostText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.page },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 16,
    gap: 16,
  },
  overviewCard: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  overviewSubtitle: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  overviewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewStatBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewStatLabel: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  overviewStatValue: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 20,
    color: COLORS.text,
  },
  overviewStatDivider: {
    width: 1,
    height: 38,
    backgroundColor: COLORS.border,
  },
  categoryCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  categoryDesc: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  manageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.page,
  },
  manageChipText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.primary,
    fontSize: 12,
  },
  categoryStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  statPillLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 11,
    marginBottom: 4,
  },
  statPillValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressBarFill: {
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...TYPO.caption,
    color: COLORS.text,
  },
  progressLabelMuted: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  categoryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ghostButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonPressed: {
    opacity: 0.85,
  },
  ghostButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  primaryGhostButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryGhostButtonPressed: {
    opacity: 0.9,
  },
  actionPanel: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  panelButtonPrimary: {
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelButtonPrimaryPressed: {
    opacity: 0.92,
  },
  panelButtonPrimaryText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  panelButtonGhost: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelButtonGhostPressed: {
    opacity: 0.9,
  },
  panelButtonGhostText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  modalSubtitle: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 24,
    color: COLORS.text,
  },
  modalPrimaryBtn: {
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnPressed: {
    opacity: 0.92,
  },
  modalPrimaryText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  modalGhostBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGhostBtnPressed: {
    opacity: 0.9,
  },
  modalGhostText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  assetList: {
    maxHeight: 280,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  assetStatusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assetLabel: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  assetDelete: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  assetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  assetActionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  assetActionBtnPressed: {
    opacity: 0.9,
  },
  assetActionBtnFilled: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetActionBtnFilledPressed: {
    opacity: 0.9,
  },
  assetActionText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
  },
});
