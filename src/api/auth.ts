// src/api/auth.ts
import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T | null;
  message?: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
  passwordConfirm: string;
  studentId: string;
  studentName: string;
  phoneNumber: string;
};

type SignUpResult = {
  memberId?: number | string | null;
};

type SendEmailCodeRequest = {
  email: string;
};

type SendEmailCodeResult = {
  code: string;
};

type VerifyEmailCodeRequest = {
  email: string;
  code: string;
};

type VerifyEmailCodeResult = {
  email: string;
  message: string;
};

type TempPasswordResult = {
  email: string;
  message: string;
};

export async function signUp(payload: SignUpPayload): Promise<number> {
  const { data } = await api.post<ApiResponse<SignUpResult>>('/api/auth/sign-in', payload);

  if (!data?.isSuccess || !data.result) {
    throw new Error(data?.message ?? '회원가입에 실패했습니다.');
  }

  const memberId = Number(data.result.memberId);
  if (!Number.isFinite(memberId) || memberId <= 0) {
    throw new Error('생성된 회원 정보를 확인할 수 없습니다.');
  }

  return memberId;
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult = {
  memberId: number;
  role: string;
  studentId?: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<ApiResponse<LoginResult>>('/api/auth/login', payload);

  if (!data?.isSuccess || !data.result) {
    throw new Error(data?.message ?? '로그인에 실패했습니다.');
  }

  return data.result;
}

export async function logout(): Promise<void> {
  const { data } = await api.post<ApiResponse<string>>('/api/auth/logout');

  if (!data?.isSuccess) {
    throw new Error(data?.message ?? '로그아웃에 실패했습니다.');
  }
}

export async function requestEmailCode(
  payload: SendEmailCodeRequest,
): Promise<SendEmailCodeResult> {
  const { data } = await api.post<ApiResponse<SendEmailCodeResult>>('/api/auth/send-code', payload);

  if (!data?.isSuccess || !data.result) {
    throw new Error(data?.message ?? '이메일 인증 번호 전송에 실패했습니다.');
  }

  return data.result;
}

export async function verifyEmailCode(
  payload: VerifyEmailCodeRequest,
): Promise<VerifyEmailCodeResult> {
  const { data } = await api.post<ApiResponse<VerifyEmailCodeResult>>(
    '/api/auth/verify-code',
    payload,
  );

  if (!data?.isSuccess || !data.result) {
    throw new Error(data?.message ?? '이메일 인증에 실패했습니다.');
  }

  return data.result;
}

export async function issueTempPassword(email: string): Promise<TempPasswordResult> {
  const { data } = await api.post<ApiResponse<TempPasswordResult>>(
    '/api/auth/tmp-password',
    null,
    { params: { email } },
  );

  if (!data?.isSuccess || !data.result) {
    throw new Error(data?.message ?? '임시 비밀번호 발급에 실패했습니다.');
  }

  return data.result;
}
