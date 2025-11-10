// src/api/items.ts
import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T | null;
  message?: string;
};

export type ItemCategorySummary = {
  itemCategoryId: number;
  itemCategoryName: string;
  totalCount: number;
  availableCount: number;
};

export type AdminItemDetail = {
  itemId: number;
  rented: boolean;
  categoryName: string;
};

type RawItemList = {
  itemCategoryInfos?: unknown;
};

type RawAdminItemInfo = {
  ItemId?: unknown;
  rented?: unknown;
  categoryName?: unknown;
};

type RawAdminItemList = {
  items?: unknown;
};

type IncreaseItemQuantityPayload = {
  categoryId: number;
};

type CreateItemCategoryPayload = {
  categoryName: string;
};

type CreateItemCategoryResult = {
  categoryId?: unknown;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNonEmptyString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return fallback;
};

const normalizeItemCategory = (input: unknown): ItemCategorySummary => {
  if (!input || typeof input !== 'object') {
    return {
      itemCategoryId: 0,
      itemCategoryName: '알 수 없는 물품',
      totalCount: 0,
      availableCount: 0,
    };
  }

  const record = input as Record<string, unknown>;
  const itemCategoryId = toFiniteNumber(record.itemCategoryId, 0);
  const totalCount = Math.max(0, toFiniteNumber(record.totalCount, 0));
  const availableCount = Math.max(0, Math.min(totalCount, toFiniteNumber(record.availableCount, 0)));

  return {
    itemCategoryId,
    itemCategoryName: toNonEmptyString(record.itemCategoryName, '이름 미확인'),
    totalCount,
    availableCount,
  };
};

const normalizeItemList = (input: unknown): ItemCategorySummary[] => {
  if (!input || typeof input !== 'object') {
    return [];
  }
  const record = input as RawItemList;
  const items = Array.isArray(record.itemCategoryInfos) ? record.itemCategoryInfos : [];
  return items.map(normalizeItemCategory);
};

const normalizeAdminItem = (input: unknown, fallbackName = '알 수 없는 물품'): AdminItemDetail => {
  if (!input || typeof input !== 'object') {
    return {
      itemId: 0,
      rented: false,
      categoryName: fallbackName,
    };
  }

  const record = input as RawAdminItemInfo;
  const itemId = toFiniteNumber(record.ItemId, 0);
  const rentedRaw = record.rented;
  const rented =
    typeof rentedRaw === 'boolean'
      ? rentedRaw
      : typeof rentedRaw === 'string'
        ? rentedRaw.toLowerCase() === 'true'
        : Boolean(rentedRaw);

  return {
    itemId,
    rented,
    categoryName: toNonEmptyString(record.categoryName, fallbackName),
  };
};

const normalizeAdminItemList = (input: unknown, fallbackName: string): AdminItemDetail[] => {
  if (!input || typeof input !== 'object') {
    return [];
  }
  const record = input as RawAdminItemList;
  const items = Array.isArray(record.items) ? record.items : [];
  return items.map((raw) => normalizeAdminItem(raw, fallbackName));
};

const fetchItemCategories = async (endpoint: string): Promise<ItemCategorySummary[]> => {
  const { data } = await api.get<ApiResponse<unknown>>(endpoint);
  if (!data?.result) return [];
  return normalizeItemList(data.result);
};

export async function fetchAvailableItems(): Promise<ItemCategorySummary[]> {
  return fetchItemCategories('/items');
}

export async function fetchAdminAvailableItems(): Promise<ItemCategorySummary[]> {
  return fetchItemCategories('/admin/items');
}

export async function increaseAdminItemQuantity(categoryId: number): Promise<void> {
  const payload: IncreaseItemQuantityPayload = { categoryId };
  const { data } = await api.patch<ApiResponse<null>>('/admin/items', payload);
  if (!data?.isSuccess) {
    throw new Error(data?.message ?? '물품 수량을 증가시키지 못했습니다.');
  }
}

export async function fetchAdminItemsByCategory(
  categoryId: number,
  fallbackName = '알 수 없는 물품',
): Promise<AdminItemDetail[]> {
  const { data } = await api.get<ApiResponse<unknown>>(`/admin/items/${categoryId}`);
  if (!data?.result) return [];
  return normalizeAdminItemList(data.result, fallbackName);
}

export async function createAdminItemCategory(name: string): Promise<number> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('대여 물품명을 입력해주세요.');
  }

  const payload: CreateItemCategoryPayload = { categoryName: trimmedName };
  const { data } = await api.post<ApiResponse<CreateItemCategoryResult>>('/admin/item-categories', payload);

  if (!data?.isSuccess) {
    throw new Error(data?.message ?? '물품 종류를 추가하지 못했습니다.');
  }

  const rawResult = data.result;
  const categoryId = rawResult ? toFiniteNumber((rawResult as CreateItemCategoryResult).categoryId, 0) : 0;

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw new Error('생성된 물품 정보가 올바르지 않습니다.');
  }

  return categoryId;
}
