import { api } from './client';
import { MemberRentalItem, RentalStatusCode } from './rental';
import { MyLockerInfoApi } from './locker';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
  message?: string;
};

export type MemberBlacklistInfo = {
  blacklisted: boolean;
  blacklistUntil: string | null;
};

const DEFAULT_BLACKLIST_INFO: MemberBlacklistInfo = {
  blacklisted: false,
  blacklistUntil: null,
};

const normalizeBlacklistInfo = (input: unknown): MemberBlacklistInfo => {
  if (!input || typeof input !== 'object') {
    return DEFAULT_BLACKLIST_INFO;
  }

  const record = input as Record<string, unknown>;
  const blacklisted = Boolean(record.blacklisted);
  const untilRaw = record.blacklistUntil;
  const blacklistUntil =
    typeof untilRaw === 'string' && untilRaw.trim().length > 0 ? untilRaw : null;

  return {
    blacklisted,
    blacklistUntil,
  };
};

export async function fetchMemberBlacklist() {
  const { data } = await api.get<ApiResponse<unknown>>('/members/blacklist/me');
  if (!data?.result) {
    return DEFAULT_BLACKLIST_INFO;
  }
  return normalizeBlacklistInfo(data.result);
}

export type MyPageInfo = {
  locker: MyLockerInfoApi | null;
  items: MemberRentalItem[];
  isStudentFeePaid: boolean;
  blacklist: MemberBlacklistInfo;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const toNullableNumber = (value: unknown): number | null => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeLocker = (input: unknown): MyLockerInfoApi | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const lockerNumber =
    toNullableString(record.lockerNumber) ??
    (toNullableNumber(record.lockerNumber)?.toString() ?? null);
  const lockerRentalStatus = toNullableString(record.lockerRentalStatus) ?? toNullableString(record.status);

  return {
    lockerId: toNullableNumber(record.lockerId) ?? undefined,
    lockerNumber: lockerNumber ?? undefined,
    lockerRentalStatus: (lockerRentalStatus ?? 'UNKNOWN') as MyLockerInfoApi['lockerRentalStatus'],
    assignedAt: toNullableString(record.assignedAt) ?? undefined,
  };
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

const pickExpectedReturnAt = (record: Record<string, unknown>): string | null => {
  if (!record) return null;
  return (
    toNullableString(
      record.rentalEndedAt ??
        record.rentalEndDate ??
        record.expectedReturnAt ??
        record.returnDueDate ??
        record.returnDueDateAt,
    ) ?? null
  );
};

const normalizeRentalItem = (input: unknown): MemberRentalItem => {
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
    expectedReturnAt: pickExpectedReturnAt(record),
    returnedAt: toNullableString(record.returnedAt),
    rentalStatus: normalizeRentalStatus(record.rentalStatus),
  };
};

export async function fetchMyPageInfo(): Promise<MyPageInfo> {
  const { data } = await api.get<ApiResponse<unknown>>('/members/me');
  if (!data?.result) {
    throw new Error(data?.message ?? '마이페이지 정보를 불러오지 못했습니다.');
  }
  const record = data.result as Record<string, unknown>;
  const locker = normalizeLocker(record.locker);
  const items = Array.isArray(record.items) ? record.items.map(normalizeRentalItem) : [];
  const isStudentFeePaid = Boolean(
    record.isStudentFeePaid ?? record.studentFeePaid ?? record.isFeePaid ?? record.feePaid
  );
  const blacklist = normalizeBlacklistInfo(record.blacklist);

  return {
    locker,
    items,
    isStudentFeePaid,
    blacklist,
  };
}
