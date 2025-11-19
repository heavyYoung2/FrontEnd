import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T | null;
  message?: string;
};

type ChatResponse = {
  content: string;
};

export async function sendChatMessage(content: string): Promise<string> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('메시지를 입력해 주세요.');
  }

  const { data } = await api.post<ApiResponse<ChatResponse>>('/chat', { content: trimmed });
  if (!data?.isSuccess || !data.result) {
    throw new Error(data?.message ?? '챗봇 응답을 받지 못했습니다.');
  }

  return data.result.content;
}
