import { api } from './client';

export type LockerStatusApi = 'AVAILABLE' | 'IN_USE' | 'BROKEN' | 'MY' | 'CANT_USE' | string;

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
  lockerRentalStatus?: MyLockerStatusApi;
  assignedAt?: string;
  lockerName?: string; // backward compatibility
  lockerSection?: string; // backward compatibility
  status?: MyLockerStatusApi; // backward compatibility
};

export async function fetchMyLocker() {
  const { data } = await api.get<ApiResponse<MyLockerInfoApi>>('/lockers/me');
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}

export async function applyLocker() {
  const { data } = await api.post<ApiResponse<null>>('/lockers/apply');
  if (data?.isSuccess === false) {
    throw new Error('Locker application failed');
  }
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

export async function finishLockerApplication(lockerApplicationId: number) {
  await api.patch<ApiResponse<null>>(`/admin/lockers/applications/${lockerApplicationId}`);
}

export async function assignLockersByApplication(lockerApplicationId: number) {
  await api.post<ApiResponse<null>>(`/admin/lockers/applications/assign/${lockerApplicationId}`);
}

export async function returnCurrentSemesterLockers() {
  await api.patch<ApiResponse<null>>('/admin/lockers/return');
}

export async function makeLockerUnavailable(lockerId: number) {
  await api.patch<ApiResponse<null>>(`/admin/lockers/${lockerId}/unavailable`);
}

export async function makeLockerAvailable(lockerId: number) {
  await api.patch<ApiResponse<null>>(`/admin/lockers/${lockerId}/available`);
}

export async function makeLockerUsing(lockerId: number, studentId?: string) {
  const params: Record<string, string> = {};
  if (studentId) params.studentId = studentId;
  await api.patch<ApiResponse<null>>(`/admin/lockers/${lockerId}/using`, undefined, { params });
}

export type LockerAssignmentInfoApi = {
  lockerId: number;
  lockerNumber: string;
  studentId?: string;
  studentName?: string;
};

export type LockerApplicationDetailInfoApi = {
  applicationStartAt: string;
  applicationEndAt: string;
  semester: string;
  applicationType: string;
  applicantTotalCount: number;
  canAssign: boolean;
  applicants: {
    studentId: string;
    studentName: string;
    appliedAt: string;
  }[];
};

export async function fetchLockerApplicationDetail(lockerApplicationId: number) {
  const { data } = await api.get<ApiResponse<LockerApplicationDetailInfoApi>>(
    `/admin/lockers/applications/${lockerApplicationId}`,
  );
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}

export async function fetchLockerAssignmentSemesters() {
  const { data } = await api.get<ApiResponse<string[]>>('/admin/lockers/applications/assign/semester');
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}

export async function fetchLockerAssignments(options?: { semester?: string }) {
  const params: Record<string, string> = {};
  if (options?.semester) params.semester = options.semester;
  const { data } = await api.get<ApiResponse<LockerAssignmentInfoApi[]>>('/admin/lockers/applications/assign', {
    params,
  });
  if (!data?.result) {
    throw new Error('Invalid server response');
  }
  return data.result;
}
