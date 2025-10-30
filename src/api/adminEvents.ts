// src/api/adminEvents.ts
import { api } from './client';

export type AdminEventInfo = {
  eventId: number;
  title: string;
  eventCreatedAt: string;  // e.g. "2025-10-19T12:34:56"
  eventStartDate: string;  // "yyyy-MM-dd"
  eventEndDate: string;    // "yyyy-MM-dd"
};

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
};

export type GetAdminEventsParams = {
  from?: string; // "yyyy-MM-dd"
  to?: string;   // "yyyy-MM-dd"
};

export async function getAdminEvents(
  params?: GetAdminEventsParams
): Promise<AdminEventInfo[]> {
  const { data } = await api.get<ApiResponse<AdminEventInfo[]>>('/events', {
    params, // { from, to } 옵션
  });
  if (!data?.result) throw new Error('Invalid server response');
  return data.result;
}

export function toYMDfromDateTime(iso?: string) {
  return iso ? String(iso).slice(0, 10) : '';
}

export type AdminEventDetail = {
  eventId: number;
  title: string;
  content: string;
  eventStartDate: string;     // "yyyy-MM-dd"
  eventEndDate: string;       // "yyyy-MM-dd"
  eventCreatedAt: string;     // "yyyy-MM-ddTHH:mm:ss"
  imageUrls: string[];        // 정렬된 URL 목록
};



/** (상세) 학생용 상세: GET /events/{id} */
export async function getAdminEventDetail(eventId: number) {
  const { data } = await api.get<ApiResponse<AdminEventDetail>>(`/events/${eventId}`);
  if (!data?.result) throw new Error('Invalid server response');
  return data.result;
}

// 수정
export type UpdateAdminEventReq = {
  title: string;
  content: string;
  eventStartDate?: string; // yyyy-MM-dd
  eventEndDate?: string;   // yyyy-MM-dd
};
export async function updateAdminEvent(id: number, payload: UpdateAdminEventReq) {
  const { data } = await api.put(`/admin/events/${id}`, payload);
  return data.result as { eventId: number };
}

// 삭제
export async function deleteAdminEvent(id: number) {
  await api.delete(`/admin/events/${id}`);
}

