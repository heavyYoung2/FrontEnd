import { isAxiosError } from 'axios';
import { Buffer } from 'buffer';
import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T | null;
  message?: string;
  code?: string;
  errorCode?: string;
};

type ApiErrorPayload = {
  isSuccess?: boolean;
  message?: string;
  code?: string;
  errorCode?: string;
  status?: string;
};

const RENTAL_ERROR_CODES = [
  'MEMBER_IS_BLACKLIST',
  'MEMBER_NOT_PAID',
  'MEMBER_HAS_OVERDUE_ITEM',
  'MEMBER_ALREADY_RENTED_SAME_CATEGORY',
  'ITEM_QUANTITY_NON_POSITIVE',
  'ITEM_CATEGORY_NOT_FOUND',
  'MEMBER_NOT_FOUND',
  'ALREADY_RETURN',
] as const;

export type RentalScanErrorCode = (typeof RENTAL_ERROR_CODES)[number];

const RENTAL_ERROR_CODE_SET = new Set<RentalScanErrorCode>(RENTAL_ERROR_CODES);

const DEFAULT_ERROR_MESSAGE = '물품 대여를 진행하지 못했습니다.';

const normalizeRentalErrorCode = (value: unknown): RentalScanErrorCode | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  return RENTAL_ERROR_CODE_SET.has(normalized as RentalScanErrorCode)
    ? (normalized as RentalScanErrorCode)
    : undefined;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickExpectedReturnAt = (record: Record<string, unknown>): string | null => {
  if (!record) return null;
  return (
    toNullableString(
      record.expectedReturnAt ??
        record.rentalEndedAt ??
        record.rentalEndAt ??
        record.returnDueDate ??
        record.returnDueDateAt,
    ) ?? null
  );
};

export type AdminRentalStatus = 'IN_PROGRESS' | 'OVERDUE' | 'RETURNED' | 'CANCELLED';

export type AdminRentalHistory = {
  rentalHistoryId: number | null;
  itemName: string;
  itemCategoryId: number | null;
  itemCategoryName: string;
  renterName: string;
  renterStudentId: string;
  rentalStartedAt: string | null;
  expectedReturnAt: string | null;
  returnedAt: string | null;
  rentalStatus: AdminRentalStatus;
};

const normalizeAdminRentalStatus = (value: unknown): AdminRentalStatus => {
  if (typeof value !== 'string') return 'IN_PROGRESS';
  const normalized = value.trim().toUpperCase();
  switch (normalized) {
    case 'OVERDUE':
      return 'OVERDUE';
    case 'RETURNED':
    case 'COMPLETED':
      return 'RETURNED';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELLED';
    case 'RENTING':
    case 'IN_PROGRESS':
    case 'BORROWED':
    default:
      return 'IN_PROGRESS';
  }
};

const normalizeAdminRentalHistory = (input: unknown): AdminRentalHistory => {
  if (!input || typeof input !== 'object') {
    return {
      rentalHistoryId: null,
      itemCategoryId: null,
      itemName: '알 수 없는 물품',
      itemCategoryName: '기타',
      renterName: '알 수 없음',
      renterStudentId: '-',
      rentalStartedAt: null,
      expectedReturnAt: null,
      returnedAt: null,
      rentalStatus: 'IN_PROGRESS',
    };
  }

  const record = input as Record<string, unknown>;
  return {
    rentalHistoryId: toNullableNumber(record.rentalHistoryId),
    itemCategoryId: toNullableNumber(record.itemCategoryId ?? (record.itemCategory as Record<string, unknown>)?.id),
    itemName: toNullableString(record.itemName) ?? '알 수 없는 물품',
    itemCategoryName:
      toNullableString(record.itemCategoryName ?? record.categoryName ?? record.itemCategory)?.trim() ?? '기타',
    renterName: toNullableString(record.memberName ?? record.renterName ?? record.studentName) ?? '알 수 없음',
    renterStudentId:
      toNullableString(
        record.memberStudentId ?? record.studentId ?? record.studentCode ?? record.renterStudentId,
      ) ?? '-',
    rentalStartedAt: toNullableString(record.rentalStartedAt ?? record.rentalStartAt),
    expectedReturnAt: pickExpectedReturnAt(record),
    returnedAt: toNullableString(record.returnedAt),
    rentalStatus: normalizeAdminRentalStatus(record.rentalStatus),
  };
};

const normalizeAdminRentalHistoryList = (input: unknown): AdminRentalHistory[] => {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const record = input as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items : [];
  return items.map(normalizeAdminRentalHistory);
};

export const RENTAL_SCAN_ERROR_MESSAGES: Record<RentalScanErrorCode, string> = {
  MEMBER_IS_BLACKLIST: '블랙리스트 대상자는 대여할 수 없어요.',
  MEMBER_NOT_PAID: '학생회비 미납자는 대여할 수 없어요.',
  MEMBER_HAS_OVERDUE_ITEM: '연체 중인 물품이 있어 대여할 수 없어요.',
  MEMBER_ALREADY_RENTED_SAME_CATEGORY: '같은 종류의 물품을 이미 대여 중이에요.',
  ITEM_QUANTITY_NON_POSITIVE: '대여 가능한 재고가 없습니다.',
  ITEM_CATEGORY_NOT_FOUND: '물품 정보를 찾을 수 없어요.',
  MEMBER_NOT_FOUND: '학생 정보를 찾을 수 없어요.',
  ALREADY_RETURN: '이미 반납이 완료된 물품이에요.',
};

export class RentalQrScanError extends Error {
  code?: RentalScanErrorCode;
  status?: number;

  constructor(message: string, options?: { code?: RentalScanErrorCode; status?: number }) {
    super(message);
    this.name = 'RentalQrScanError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (err) {
    console.warn('[rentalAdmin] failed to decode rental QR token payload', err);
    return null;
  }
};

const normalizeRentalQrPayload = (raw: string): { qrToken: string; itemCategoryId: number | null } => {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) {
    return { qrToken: '', itemCategoryId: null };
  }

  // First, see if the QR text is a JSON string with qrToken + itemCategoryId.
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && typeof (parsed as any).qrToken === 'string') {
      const itemCategoryId = toNullableNumber((parsed as any).itemCategoryId);
      return { qrToken: (parsed as any).qrToken, itemCategoryId };
    }
  } catch {
    // Not a JSON payload; fall back to bare token handling.
  }

  // Try to sniff itemCategoryId from JWT payload if present.
  const payload = decodeJwtPayload(trimmed);
  const inferredItemCategoryId = payload ? toNullableNumber(payload.itemCategoryId ?? payload.categoryId) : null;

  return { qrToken: trimmed, itemCategoryId: inferredItemCategoryId };
};

export async function rentItemByQrToken(qrTokenOrPayload: string): Promise<void> {
  const { qrToken, itemCategoryId } = normalizeRentalQrPayload(qrTokenOrPayload);
  if (!qrToken) {
    throw new RentalQrScanError('올바른 QR 코드가 아닙니다.');
  }

  const body: Record<string, unknown> = { qrToken };
  if (itemCategoryId != null) {
    body.itemCategoryId = itemCategoryId;
  }

  try {
    const { data } = await api.post<ApiResponse<null>>('/admin/rentals/qr', body);
    if (!data?.isSuccess) {
      const code = normalizeRentalErrorCode((data as ApiErrorPayload)?.code ?? (data as ApiErrorPayload)?.errorCode);
      throw new RentalQrScanError(data?.message ?? DEFAULT_ERROR_MESSAGE, { code });
    }
  } catch (error) {
    if (isAxiosError(error)) {
      const payload = error.response?.data as ApiErrorPayload | undefined;
      const rawCode = payload?.code ?? payload?.errorCode ?? payload?.status;
      const code = normalizeRentalErrorCode(rawCode);
      const message = payload?.message ?? DEFAULT_ERROR_MESSAGE;
      throw new RentalQrScanError(message, { code, status: error.response?.status });
    }
    if (error instanceof RentalQrScanError) {
      throw error;
    }
    throw new RentalQrScanError(DEFAULT_ERROR_MESSAGE);
  }
}

export async function returnItemByQrToken(qrTokenOrPayload: string): Promise<void> {
  const { qrToken, itemCategoryId } = normalizeRentalQrPayload(qrTokenOrPayload);
  if (!qrToken) {
    throw new RentalQrScanError('올바른 QR 코드가 아닙니다.');
  }

  const body: Record<string, unknown> = { qrToken };
  if (itemCategoryId != null) {
    body.itemCategoryId = itemCategoryId;
  }

  try {
    const { data } = await api.post<ApiResponse<null>>('/admin/rentals/return', body);
    if (!data?.isSuccess) {
      const code = normalizeRentalErrorCode((data as ApiErrorPayload)?.code ?? (data as ApiErrorPayload)?.errorCode);
      throw new RentalQrScanError(data?.message ?? DEFAULT_ERROR_MESSAGE, { code });
    }
  } catch (error) {
    if (isAxiosError(error)) {
      const payload = error.response?.data as ApiErrorPayload | undefined;
      const rawCode = payload?.code ?? payload?.errorCode ?? payload?.status;
      const code = normalizeRentalErrorCode(rawCode);
      const message = payload?.message ?? DEFAULT_ERROR_MESSAGE;
      throw new RentalQrScanError(message, { code, status: error.response?.status });
    }
    if (error instanceof RentalQrScanError) {
      throw error;
    }
    throw new RentalQrScanError(DEFAULT_ERROR_MESSAGE);
  }
}

export async function fetchAdminRentalHistories(): Promise<AdminRentalHistory[]> {
  const { data } = await api.get<ApiResponse<unknown>>('/admin/rentals');
  if (!data?.result) {
    return [];
  }
  return normalizeAdminRentalHistoryList(data.result);
}

export async function manuallyReturnRentalHistory(rentalHistoryId: number): Promise<void> {
  if (!Number.isFinite(rentalHistoryId)) {
    throw new RentalQrScanError('유효하지 않은 대여 이력입니다.');
  }

  const candidatePaths = [`/admin/rentals/${rentalHistoryId}/return`, `/admin/lockers/${rentalHistoryId}/return`];
  let lastError: unknown;

  for (const path of candidatePaths) {
    try {
      const { data } = await api.post<ApiResponse<null>>(path);
      if (!data?.isSuccess) {
        const code = normalizeRentalErrorCode((data as ApiErrorPayload)?.code ?? (data as ApiErrorPayload)?.errorCode);
        throw new RentalQrScanError(data?.message ?? '반납 처리를 완료하지 못했습니다.', { code });
      }
      return;
    } catch (error) {
      lastError = error;
      // Try the next path if this one failed (e.g., 404/405)
      if (isAxiosError(error) && error.response?.status && error.response.status >= 500) {
        break;
      }
    }
  }

  if (lastError) {
    if (isAxiosError(lastError)) {
      const payload = lastError.response?.data as ApiErrorPayload | undefined;
      const rawCode = payload?.code ?? payload?.errorCode ?? payload?.status;
      const code = normalizeRentalErrorCode(rawCode);
      const message = payload?.message ?? '반납 처리를 완료하지 못했습니다.';
      throw new RentalQrScanError(message, { code, status: lastError.response?.status });
    }
    if (lastError instanceof RentalQrScanError) {
      throw lastError;
    }
  }

  throw new RentalQrScanError('반납 처리를 완료하지 못했습니다.');
}
