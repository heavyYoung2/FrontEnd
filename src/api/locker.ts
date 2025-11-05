import { api } from './client';

export type LockerStatusApi = 'AVAILABLE' | 'IN_USE' | 'BROKEN' | 'MY' | string;

export type LockerInfoApi = {
  lockerId?: number;
  lockerNumber?: number;
  lockerNum?: number;
  lockerNo?: number;
  lockerName?: string;
  lockerSection?: string;
  section?: string;
  sectionName?: string;
  lockerStatus: LockerStatusApi;
  studentId?: string;
  studentNumber?: string;
  memberNumber?: string;
  memberId?: string;
  memberName?: string;
  studentName?: string;
  name?: string;
};

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
};

export type FetchLockersOptions = {
  semester?: string;
};

export async function fetchLockersBySection(section: string, options?: FetchLockersOptions) {
  const params: Record<string, string> = { lockerSection: section };
  if (options?.semester) params.semester = options.semester;

  const { data } = await api.get<ApiResponse<LockerInfoApi[]>>('/lockers', { params });
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}

export async function fetchLockerSemesters() {
  const { data } = await api.get<ApiResponse<string[]>>('/lockers/semesters');
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}

export type MyLockerStatusApi = 'RENTING' | 'RENTAL_REQUESTED' | 'NO_RENTAL' | string;

export type MyLockerInfoApi = {
  lockerId?: number;
  lockerNumber?: string;
  lockerName?: string;
  lockerSection?: string;
  status: MyLockerStatusApi;
};

export async function fetchMyLocker() {
  const { data } = await api.get<ApiResponse<MyLockerInfoApi>>('/lockers/me');
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}
