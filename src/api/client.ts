// src/api/client.ts
import axios, { AxiosHeaders } from 'axios';

/**
 * Unauthorized 보호 상태.
 * - 한 번 401/403이 감지되면 추가 요청을 막고, 외부 handler가 경고를 한 번만 띄우도록 한다.
 */
let unauthorizedLocked = false;
let unauthorizedHandler: (() => void) | null = null;
// 배포 서버 기본 URL
const BASE_URL = 'http://13.209.220.192:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export function setAuthToken(token: string | null) {
  accessToken = token;
  if (token) {
    resetUnauthorizedLock();
  }
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function resetUnauthorizedLock() {
  unauthorizedLocked = false;
}

api.interceptors.request.use((config) => {
  // Unauthorized 상태에서는 추가 요청을 차단
  if (unauthorizedLocked) {
    return Promise.reject(new Error('unauthorized_locked'));
  }

  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    config.headers = headers;
  }

  return config;
});

// 응답 인터셉터(서버 공통 래핑 처리시)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      if (!unauthorizedLocked) {
        unauthorizedLocked = true;
        if (typeof unauthorizedHandler === 'function') {
          unauthorizedHandler();
        }
      }
      // Unauthorized 잠금 상태에서는 동일하게 반환
    }
    // 에러 로깅
    console.warn('[API ERROR]', err?.response?.status, err?.response?.data);
    return Promise.reject(err);
  }
);
