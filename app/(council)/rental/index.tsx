import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
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
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchAdminAvailableItems,
  fetchAdminItemsByCategory,
  increaseAdminItemQuantity,
  ItemCategorySummary,
} from '@/src/api/items';

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

type ModalState = { type: 'assets'; category: RentalCategory } | null;

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

const cloneCategory = (category: RentalCategory): RentalCategory => ({
  ...category,
  assets: category.assets.map((asset) => ({ ...asset })),
});

const cloneCategories = (categories: RentalCategory[]) => categories.map(cloneCategory);

const buildCategoryFromSummary = (
  summary: ItemCategorySummary,
  template?: RentalCategory,
): RentalCategory => {
  const totalCount = Math.max(0, summary.totalCount ?? 0);
  const availableCount = Math.max(0, Math.min(totalCount, summary.availableCount ?? 0));
  const id =
    summary.itemCategoryId != null
      ? String(summary.itemCategoryId)
      : template?.id ?? summary.itemCategoryName ?? 'unknown';
  const name = summary.itemCategoryName ?? template?.name ?? '알 수 없는 물품';
  const description = template?.description;
  const templateAssets = template?.assets ?? [];

  const assets: AssetItem[] = Array.from({ length: totalCount }).map((_, idx) => ({
    id: `${id}-${idx + 1}`,
    label: templateAssets[idx]?.label ?? `${name} ${idx + 1}`,
    status: idx < availableCount ? 'available' : 'rented',
  }));

  return {
    id,
    name,
    description,
    assets,
  };
};

const mapSummariesToCategories = (
  summaries: ItemCategorySummary[],
  templateLookup: Map<string, RentalCategory>,
): RentalCategory[] => {
  if (summaries.length === 0) return [];

  return summaries.map((summary) => {
    const template = typeof summary.itemCategoryName === 'string'
      ? templateLookup.get(summary.itemCategoryName) ?? templateLookup.get(summary.itemCategoryName.trim())
      : undefined;
    return buildCategoryFromSummary(summary, template);
  });
};

export default function RentalTab() {
  const router = useRouter();
  const [categories, setCategories] = useState<RentalCategory[]>([]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const templateLookup = useMemo(() => {
    const lookup = new Map<string, RentalCategory>();
    MOCK_CATEGORY_DATA.forEach((category) => lookup.set(category.name, category));
    return lookup;
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaries = await fetchAdminAvailableItems();
      if (summaries.length === 0) {
        setCategories([]);
      } else {
        const mapped = mapSummariesToCategories(summaries, templateLookup);
        setCategories(mapped);
      }
    } catch (err) {
      console.warn('[council rental] fetch available items failed', err);
      setError(err instanceof Error ? err : new Error('물품 정보를 불러오지 못했습니다.'));
      setCategories(cloneCategories(MOCK_CATEGORY_DATA));
    } finally {
      setLoading(false);
    }
  }, [templateLookup]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCategories();
    } finally {
      setRefreshing(false);
    }
  }, [loadCategories]);

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {error ? (
          <Pressable style={styles.errorBanner} onPress={handleRefresh} hitSlop={8}>
            <Ionicons name="warning-outline" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error.message}</Text>
            <Ionicons name="refresh" size={16} color={COLORS.danger} />
          </Pressable>
        ) : null}

        <View style={styles.overviewCard}>
          <View>
            <Text style={styles.overviewTitle}>현재 대여 현황</Text>
            <Text style={styles.overviewSubtitle}>
              {loading ? '물품 정보를 불러오는 중입니다...' : '실시간으로 반납/대여 상황을 확인하세요'}
            </Text>
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
            onReturn={() => handleReturn(category)}
            onRent={() => handleRent(category)}
            onManageAssets={() => handleManageAssets(category)}
          />
        ))}

        {!loading && categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={22} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>등록된 물품이 없습니다.</Text>
            <Text style={styles.emptySubText}>새 물품을 추가하거나 목록을 새로고침하세요.</Text>
          </View>
        ) : null}

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
  onReturn: () => void;
  onRent: () => void;
  onManageAssets: () => void;
};

function CategoryCard({ category, onReturn, onRent, onManageAssets }: CategoryCardProps) {
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
        <Pressable
          onPress={onReturn}
          style={({ pressed }) => [
            styles.actionButton,
            styles.returnButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Ionicons name="arrow-undo" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.actionButtonText, styles.returnButtonText]}>반납 처리</Text>
        </Pressable>
        <Pressable
          onPress={onRent}
          style={({ pressed }) => [
            styles.actionButton,
            styles.rentButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Ionicons name="arrow-redo" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={[styles.actionButtonText, styles.rentButtonText]}>대여 처리</Text>
        </Pressable>
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

type ManageAssetsModalProps = {
  visible: boolean;
  category: RentalCategory;
  onUpdate: (nextAssets: AssetItem[]) => void;
  onClose: () => void;
};

function ManageAssetsModal({ visible, category, onUpdate, onClose }: ManageAssetsModalProps) {
  const { id: categoryId, name: categoryName, assets: categoryAssets } = category;
  const [draftAssets, setDraftAssets] = useState<AssetItem[]>(categoryAssets);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<Error | null>(null);
  const parsedCategoryId = Number(categoryId);

  useEffect(() => {
    setDraftAssets(categoryAssets);
  }, [categoryAssets]);

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

  const fetchCategoryItems = useCallback(async () => {
    if (!Number.isFinite(parsedCategoryId)) {
      setItemsError(new Error('카테고리 정보를 확인할 수 없습니다.'));
      setDraftAssets(categoryAssets);
      setIsLoadingItems(false);
      return;
    }

    setIsLoadingItems(true);
    setItemsError(null);
    try {
      const items = await fetchAdminItemsByCategory(parsedCategoryId, categoryName);
      if (items.length === 0) {
        setDraftAssets([]);
      } else {
        const mapped = items.map((item, index) => ({
          id: item.itemId > 0 ? String(item.itemId) : `${categoryId}-${index}`,
          label: `${item.categoryName || categoryName || '물품'} ${index + 1}`,
          status: item.rented ? ('rented' as AssetStatus) : ('available' as AssetStatus),
        }));
        setDraftAssets(mapped);
      }
    } catch (err) {
      console.warn('[council rental] fetch category items failed', err);
      setItemsError(err instanceof Error ? err : new Error('물품 목록을 불러오지 못했습니다.'));
      setDraftAssets(categoryAssets);
    } finally {
      setIsLoadingItems(false);
    }
  }, [parsedCategoryId, categoryAssets, categoryId, categoryName]);

  useEffect(() => {
    if (!visible) return;
    fetchCategoryItems();
  }, [visible, fetchCategoryItems]);

  const handleAddAsset = async () => {
    if (!Number.isFinite(parsedCategoryId)) {
      Alert.alert('물품 추가', '카테고리 정보를 확인할 수 없습니다.');
      return;
    }

    try {
      setIsAdding(true);
      await increaseAdminItemQuantity(parsedCategoryId);
      await fetchCategoryItems();
    } catch (err) {
      console.warn('[council rental] increase item quantity failed', err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : '물품 추가에 실패했습니다. 잠시 후 다시 시도해주세요.';
      Alert.alert('물품 추가 실패', message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    setDraftAssets((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  const renderAssetList = () => {
    if (isLoadingItems) {
      return (
        <View style={[styles.assetList, styles.assetListPlaceholder]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      );
    }

    if (itemsError) {
      return (
        <View style={[styles.assetList, styles.assetListPlaceholder]}>
          <Ionicons name="warning-outline" size={20} color={COLORS.danger} style={{ marginBottom: 8 }} />
          <Text style={styles.assetErrorText}>{itemsError.message}</Text>
          <Pressable style={styles.assetRetryBtn} onPress={fetchCategoryItems}>
            <Text style={styles.assetRetryText}>다시 시도</Text>
          </Pressable>
        </View>
      );
    }

    if (draftAssets.length === 0) {
      return (
        <View style={[styles.assetList, styles.assetListPlaceholder]}>
          <Text style={styles.assetErrorText}>등록된 물품이 없습니다.</Text>
        </View>
      );
    }

    return (
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
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { maxHeight: '72%' }]}>
          <Text style={styles.modalTitle}>물품 관리</Text>
          <Text style={styles.modalSubtitle}>{category.name} 상세 목록을 확인하고 상태를 조정하세요.</Text>

          {renderAssetList()}

          <View style={styles.assetActionsRow}>
            <Pressable
              onPress={handleAddAsset}
              disabled={isAdding}
              style={({ pressed }) => [
                styles.assetActionBtn,
                pressed && styles.assetActionBtnPressed,
                isAdding && { opacity: 0.6 },
              ]}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="add" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.assetActionText, { color: COLORS.primary }]}>물품 추가</Text>
                </>
              )}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  errorText: {
    ...TYPO.bodySm,
    flex: 1,
    color: COLORS.danger,
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
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
  },
  returnButton: {
    backgroundColor: COLORS.blue100,
    borderWidth: 1,
    borderColor: 'rgba(46, 70, 240, 0.35)',
  },
  returnButtonText: {
    color: COLORS.primary,
  },
  rentButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  rentButtonText: {
    color: '#FFFFFF',
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
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 36,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  emptySubText: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
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
  assetListPlaceholder: {
    maxHeight: 280,
    minHeight: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
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
  assetErrorText: {
    ...TYPO.bodySm,
    color: COLORS.text,
    textAlign: 'center',
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
  assetRetryBtn: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  assetRetryText: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.primary,
  },
});
