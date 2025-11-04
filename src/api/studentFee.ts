import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
  message?: string;
};

export type StudentFeeQrToken = {
  qrToken: string;
  feePaid: boolean;
};

export async function generateStudentFeeQrToken() {
  const { data } = await api.get<ApiResponse<StudentFeeQrToken>>('/members/fee/qr-tokens');
  if (!data?.result) {
    throw new Error(data?.message ?? 'Invalid server response');
  }
  return data.result;
}
