// src/api/councilMembers.ts
import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
};

export type CouncilMember = {
  councilMemberId?: number;
  studentId: string;
  name: string;
};

export type CouncilStudentProfile = {
  memberId: number;
  studentId: string;
  name: string;
};

const COUNCIL_LIST_PATH = '/admin/council';
const STUDENT_LOOKUP_PATH = '/admin/council/lookup';

export async function fetchCouncilMembers(): Promise<CouncilMember[]> {
  const { data } = await api.get<
    ApiResponse<{
      studentCouncilMembers?: {
        memberId?: number;
        studentId?: string;
        studentName?: string;
      }[];
    }>
  >(COUNCIL_LIST_PATH);

  if (!data?.result?.studentCouncilMembers) {
    throw new Error('Invalid council member response');
  }

  return data.result.studentCouncilMembers.map((member) => ({
    councilMemberId: member.memberId,
    studentId: member.studentId ?? '-',
    name: member.studentName ?? '',
  }));
}

export async function lookupStudentById(studentId: string): Promise<CouncilStudentProfile | null> {
  try {
    const { data } = await api.get<
      ApiResponse<{
        memberId?: number;
        studentId?: string;
        studentName?: string;
      }>
    >(STUDENT_LOOKUP_PATH, { params: { studentId } });
    if (!data?.result) return null;
    return {
      memberId: data.result.memberId ?? -1,
      studentId: data.result.studentId ?? studentId,
      name: data.result.studentName ?? '',
    };
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    if (err?.response?.status === 400) return null;
    return null;
  }
}

export async function addCouncilMember(memberId: number): Promise<CouncilMember> {
  if (!Number.isFinite(memberId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  const { data } = await api.patch<ApiResponse<null>>(`/admin/council/${memberId}/add`);
  if (!data?.isSuccess) {
    throw new Error(data?.message ?? '학생회 추가에 실패했습니다.');
  }
  // The add API does not return member detail, so rely on lookup data at caller.
  return { councilMemberId: memberId, studentId: '', name: '' };
}

export async function removeCouncilMember(memberId: number) {
  if (!Number.isFinite(memberId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }
  const { data } = await api.patch<ApiResponse<null>>(`/admin/council/${memberId}/delete`);
  if (!data?.isSuccess) {
    throw new Error(data?.message ?? '학생회 삭제에 실패했습니다.');
  }
}

export function councilMemberKey(member: CouncilMember) {
  return member.councilMemberId?.toString() ?? member.studentId;
}
