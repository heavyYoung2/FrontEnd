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
  studentId: string;
  name: string;
};

const MEMBER_BASE_PATH = '/admin/council/members';
const STUDENT_LOOKUP_BASE_PATH = '/admin/students';

export async function fetchCouncilMembers(): Promise<CouncilMember[]> {
  const { data } = await api.get<ApiResponse<CouncilMember[]>>(MEMBER_BASE_PATH);
  if (!data?.result) {
    throw new Error('Invalid council member response');
  }
  return data.result;
}

export async function lookupStudentById(studentId: string): Promise<CouncilStudentProfile | null> {
  try {
    const { data } = await api.get<ApiResponse<CouncilStudentProfile>>(
      `${STUDENT_LOOKUP_BASE_PATH}/${encodeURIComponent(studentId)}`
    );
    return data?.result ?? null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    if (err?.response?.status === 400) return null;
    throw err;
  }
}

export async function addCouncilMember(studentId: string): Promise<CouncilMember> {
  const { data } = await api.post<ApiResponse<CouncilMember>>(MEMBER_BASE_PATH, {
    studentId,
  });
  if (!data?.result) {
    throw new Error('Invalid council member add response');
  }
  return data.result;
}

export async function removeCouncilMember(studentId: string) {
  await api.delete(`${MEMBER_BASE_PATH}/${encodeURIComponent(studentId)}`);
}

export function councilMemberKey(member: CouncilMember) {
  return member.councilMemberId?.toString() ?? member.studentId;
}
