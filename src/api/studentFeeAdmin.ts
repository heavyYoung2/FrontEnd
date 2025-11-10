import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
  message?: string;
};

type StudentFeeVerifyResponse = {
  approved: boolean;
};

export async function verifyStudentFeeByQrToken(qrToken: string): Promise<boolean> {
  if (!qrToken || typeof qrToken !== 'string') {
    throw new Error('QR 토큰이 올바르지 않습니다.');
  }

  const { data } = await api.post<ApiResponse<StudentFeeVerifyResponse>>('/admin/fee/qr-tokens', {
    qrToken,
  });

  if (!data?.result || typeof data.result.approved !== 'boolean') {
    throw new Error(data?.message ?? '학생회비 정보를 확인할 수 없어요.');
  }

  return data.result.approved;
}
