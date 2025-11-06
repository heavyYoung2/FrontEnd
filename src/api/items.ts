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

type RawItemList = {
  itemCategoryInfos?: unknown;
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

export async function fetchAvailableItems(): Promise<ItemCategorySummary[]> {
  const { data } = await api.get<ApiResponse<unknown>>('/items');
  if (!data?.result) return [];
  return normalizeItemList(data.result);
}
