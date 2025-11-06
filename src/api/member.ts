import { api } from './client';

type ApiResponse<T> = {
  isSuccess: boolean;
  result: T;
  message?: string;
};

export type MemberBlacklistInfo = {
  blacklisted: boolean;
  blacklistUntil: string | null;
};

const DEFAULT_BLACKLIST_INFO: MemberBlacklistInfo = {
  blacklisted: false,
  blacklistUntil: null,
};

const normalizeBlacklistInfo = (input: unknown): MemberBlacklistInfo => {
  if (!input || typeof input !== 'object') {
    return DEFAULT_BLACKLIST_INFO;
  }

  const record = input as Record<string, unknown>;
  const blacklisted = Boolean(record.blacklisted);
  const untilRaw = record.blacklistUntil;
  const blacklistUntil =
    typeof untilRaw === 'string' && untilRaw.trim().length > 0 ? untilRaw : null;

  return {
    blacklisted,
    blacklistUntil,
  };
};

export async function fetchMemberBlacklist() {
  const { data } = await api.get<ApiResponse<unknown>>('/members/blacklist/me');
  if (!data?.result) {
    return DEFAULT_BLACKLIST_INFO;
  }
  return normalizeBlacklistInfo(data.result);
}
