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

export type LockerApplicationInfoApi = {
  applicationId: number;
  applicationStartAt: string;
  applicationEndAt: string;
  semester: string;
  applicationType: 'LOCKER_MAIN' | 'LOCKER_ADDITIONAL' | string;
  canApply: boolean;
  canAssign: boolean;
};

export async function fetchLockerApplications() {
  const { data } = await api.get<ApiResponse<LockerApplicationInfoApi[]>>('/admin/lockers/applications');
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}

export type CreateLockerApplicationPayload = {
  applicationStartAt: string;
  applicationEndAt: string;
  semester: string;
  applicationType: LockerApplicationInfoApi['applicationType'];
};

export async function createLockerApplication(payload: CreateLockerApplicationPayload) {
  const { data } = await api.post<ApiResponse<null>>('/admin/lockers/applications', payload);
  if (data?.isSuccess === false) {
    throw new Error('Locker application creation failed');
  }
}
