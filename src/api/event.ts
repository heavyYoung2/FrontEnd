// src/api/events.ts
import { api } from './client';

export type AddEventReq = {
  title: string;
  content: string;
  eventStartDate: string; // "yyyy-MM-dd"
  eventEndDate: string;   // "yyyy-MM-dd"
};

export type EventImageInput = {
  uri: string;
  name?: string;
  type?: string;
};

export type AddEventRes = {
  eventId: number;
};

// 서버가 ApiResponse<T> 형태라면 아래 같이 파싱
type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
  // code, message 등 추가 필드가 있다면 여기에 정의
};

export async function addEvent(payload: AddEventReq, images?: EventImageInput[]): Promise<AddEventRes> {
  const formData = new FormData();
  formData.append('eventAddRequestDTO', JSON.stringify(payload));

  if (images && images.length > 0) {
    images.forEach((img, idx) => {
      formData.append('image', {
        uri: img.uri,
        name: img.name ?? `image-${idx + 1}.jpg`,
        type: img.type ?? 'image/jpeg',
      } as any);
    });
  }

  const { data } = await api.post<ApiResponse<AddEventRes>>('/admin/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data?.result) throw new Error('Invalid server response');
  return data.result;
}

export type EventInfo = {
  eventId: number;
  title: string;
  eventCreatedAt: string;   // LocalDateTime ISO (e.g., "2025-10-19T12:34:56")
  eventStartDate: string;   // "yyyy-MM-dd"
  eventEndDate: string;     // "yyyy-MM-dd"
};


/** ---------- 쿼리 ---------- */
export type GetEventsParams = {
  from?: string; // "yyyy-MM-dd"
  to?: string;   // "yyyy-MM-dd"
};

/** 목록 조회 */
export async function getEvents(params?: GetEventsParams): Promise<EventInfo[]> {
  const { data } = await api.get<ApiResponse<EventInfo[]>>('/events', {
    params, // { from, to } (옵션)
  });
  if (!data?.result) throw new Error('Invalid server response');
  return data.result;
}

/** 표시용 날짜 포맷 (yyyy-MM-dd) */
export function toYMDfromDateTime(iso?: string) {
  if (!iso) return '';
  // "2025-10-19T12:34:56" -> "2025-10-19"
  return String(iso).slice(0, 10);
}
