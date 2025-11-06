import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
  message?: string;
};

export type RentalQrToken = {
  qrToken: string;
  studentFeePaid: boolean;
};

export async function generateRentalQrToken(itemCategoryId: number) {
  if (!Number.isFinite(itemCategoryId)) {
    throw new Error('유효하지 않은 물품 카테고리 ID입니다.');
  }

  const { data } = await api.get<ApiResponse<Partial<RentalQrToken> & { feePaid?: boolean }>>(
    `/rentals/${itemCategoryId}/qr-tokens`
  );

  const result = data?.result;
  if (!result?.qrToken) {
    throw new Error(data?.message ?? '유효하지 않은 서버 응답입니다.');
  }

  const studentFeePaid =
    typeof result.studentFeePaid === 'boolean'
      ? result.studentFeePaid
      : typeof result.feePaid === 'boolean'
        ? result.feePaid
        : false;

  return {
    qrToken: result.qrToken,
    studentFeePaid,
  };
}

export async function generateReturnRentalQrToken(rentalHistoryId: number) {
  if (!Number.isFinite(rentalHistoryId)) {
    throw new Error('유효하지 않은 대여 이력 ID입니다.');
  }

  const { data } = await api.get<ApiResponse<Partial<RentalQrToken>>>(
    `/rentals/${rentalHistoryId}/return/qr-tokens`
  );

  const result = data?.result;
  if (!result?.qrToken) {
    throw new Error(data?.message ?? '유효하지 않은 서버 응답입니다.');
  }

  const studentFeePaid =
    typeof result.studentFeePaid === 'boolean'
      ? result.studentFeePaid
      : true;

  return {
    qrToken: result.qrToken,
    studentFeePaid,
  };
}

export type RentalStatusCode = 'IN_PROGRESS' | 'OVERDUE' | 'RETURNED' | 'CANCELLED';

export type MemberRentalItem = {
  rentalHistoryId: number | null;
  itemCategoryId: number | null;
  itemName: string;
  rentalStartedAt: string | null;
  expectedReturnAt: string | null;
  returnedAt: string | null;
  rentalStatus: RentalStatusCode;
};

export type MemberRentalInfo = {
  expectedBlacklistUntil: string | null;
  items: MemberRentalItem[];
};

const DEFAULT_MEMBER_RENTAL_INFO: MemberRentalInfo = {
  expectedBlacklistUntil: null,
  items: [],
};

const toNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const toNullableNumber = (value: unknown): number | null => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeRentalStatus = (value: unknown): RentalStatusCode => {
  if (typeof value !== 'string') return 'IN_PROGRESS';
  const upper = value.toUpperCase();
  switch (upper) {
    case 'OVERDUE':
      return 'OVERDUE';
    case 'RETURNED':
    case 'COMPLETED':
      return 'RETURNED';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELLED';
    case 'IN_PROGRESS':
    case 'RENTED':
    case 'BORROWED':
    default:
      return 'IN_PROGRESS';
  }
};

const normalizeMemberRentalItem = (input: unknown): MemberRentalItem => {
  if (!input || typeof input !== 'object') {
    return {
      rentalHistoryId: null,
      itemCategoryId: null,
      itemName: '알 수 없는 물품',
      rentalStartedAt: null,
      expectedReturnAt: null,
      returnedAt: null,
      rentalStatus: 'IN_PROGRESS',
    };
  }

  const record = input as Record<string, unknown>;
  return {
    rentalHistoryId: toNullableNumber(record.rentalHistoryId),
    itemCategoryId: toNullableNumber(record.itemCategoryId),
    itemName: toNullableString(record.itemName) ?? '알 수 없는 물품',
    rentalStartedAt: toNullableString(record.rentalStartedAt),
    expectedReturnAt: toNullableString(record.expectedReturnAt ?? record.returnDueDate),
    returnedAt: toNullableString(record.returnedAt),
    rentalStatus: normalizeRentalStatus(record.rentalStatus),
  };
};

const normalizeMemberRentalInfo = (input: unknown): MemberRentalInfo => {
  if (!input || typeof input !== 'object') {
    return DEFAULT_MEMBER_RENTAL_INFO;
  }

  const record = input as Record<string, unknown>;
  const itemsRaw = Array.isArray(record.items) ? record.items : [];

  return {
    expectedBlacklistUntil: toNullableString(record.expectedBlacklistUntil),
    items: itemsRaw.map(normalizeMemberRentalItem),
  };
};

export async function fetchMemberRentalStatus() {
  const { data } = await api.get<ApiResponse<unknown>>('/rentals/me');
  if (!data?.result) {
    return DEFAULT_MEMBER_RENTAL_INFO;
  }
  return normalizeMemberRentalInfo(data.result);
}

export type RentalHistoryItem = {
  rentalHistoryId: number | null;
  itemName: string;
  rentalStartedAt: string | null;
  expectedReturnAt: string | null;
  returnedAt: string | null;
  rentalStatus: RentalStatusCode;
};

export type RentalHistoryInfo = {
  items: RentalHistoryItem[];
};

const DEFAULT_RENTAL_HISTORY_INFO: RentalHistoryInfo = {
  items: [],
};

const normalizeRentalHistoryItem = (input: unknown): RentalHistoryItem => {
  if (!input || typeof input !== 'object') {
    return {
      rentalHistoryId: null,
      itemName: '알 수 없는 물품',
      rentalStartedAt: null,
      expectedReturnAt: null,
      returnedAt: null,
      rentalStatus: 'IN_PROGRESS',
    };
  }

  const record = input as Record<string, unknown>;
  return {
    rentalHistoryId: toNullableNumber(record.rentalHistoryId),
    itemName: toNullableString(record.itemName) ?? '알 수 없는 물품',
    rentalStartedAt: toNullableString(record.rentalStartedAt),
    expectedReturnAt: toNullableString(record.expectedReturnAt ?? record.returnDueDate),
    returnedAt: toNullableString(record.returnedAt),
    rentalStatus: normalizeRentalStatus(record.rentalStatus),
  };
};

const normalizeRentalHistoryInfo = (input: unknown): RentalHistoryInfo => {
  if (!input || typeof input !== 'object') {
    return DEFAULT_RENTAL_HISTORY_INFO;
  }

  const record = input as Record<string, unknown>;
  const itemsRaw = Array.isArray(record.items) ? record.items : [];

  return {
    items: itemsRaw.map(normalizeRentalHistoryItem),
  };
};

export async function fetchMemberRentalHistory() {
  const { data } = await api.get<ApiResponse<unknown>>('/rentals/me/history');
  if (!data?.result) {
    return DEFAULT_RENTAL_HISTORY_INFO;
  }
  return normalizeRentalHistoryInfo(data.result);
}
