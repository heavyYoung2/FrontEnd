// src/api/client.ts
import axios, { AxiosHeaders } from 'axios';
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
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use((config) => {
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
    // 에러 로깅
    console.warn('[API ERROR]', err?.response?.status, err?.response?.data);
    return Promise.reject(err);
  }
);
