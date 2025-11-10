import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
  message?: string;
};

type RawStudentFeePayload = {
  qrToken?: string;
  studentFeePaid?: unknown;
  feePaid?: unknown;
  studentFeeStatus?: unknown;
  studentFeeStatusType?: unknown;
  feeStatus?: unknown;
  status?: unknown;
};

export type StudentFeeStatus = 'PAID' | 'NOT_PAID' | 'YET';

export type StudentFeeQrToken = {
  qrToken: string;
  studentFeePaid: boolean;
  studentFeeStatus: StudentFeeStatus;
};

const normalizeStudentFeeStatus = (value: unknown): StudentFeeStatus => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'PAID' || normalized === 'DONE') return 'PAID';
    if (normalized === 'NOT_PAID' || normalized === 'NOTPAID' || normalized === 'UNPAID') return 'NOT_PAID';
    if (normalized === 'YET' || normalized === 'PENDING' || normalized === 'WAITING') return 'YET';
  }

  if (typeof value === 'boolean') {
    return value ? 'PAID' : 'NOT_PAID';
  }

  return 'YET';
};

const coerceBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return null;
};

export async function generateStudentFeeQrToken(): Promise<StudentFeeQrToken> {
  const { data } = await api.get<ApiResponse<RawStudentFeePayload>>('/members/fee/qr-tokens');

  if (!data?.result) {
    throw new Error(data?.message ?? 'Invalid server response');
  }

  const { result } = data;
  if (!result?.qrToken) {
    throw new Error(data?.message ?? 'Invalid server response');
  }

  const statusSource =
    result.studentFeeStatus ??
    result.studentFeeStatusType ??
    result.status ??
    result.feeStatus ??
    result.studentFeePaid ??
    result.feePaid;
  const studentFeeStatus = normalizeStudentFeeStatus(statusSource);

  const paidExplicit =
    coerceBoolean(result.studentFeePaid) ??
    coerceBoolean(result.feePaid) ??
    (studentFeeStatus === 'PAID' ? true : studentFeeStatus === 'NOT_PAID' ? false : null);

  return {
    qrToken: result.qrToken,
    studentFeePaid: paidExplicit ?? false,
    studentFeeStatus,
  };
}
