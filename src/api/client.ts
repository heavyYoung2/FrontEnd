// src/api/client.ts
import axios from 'axios';
import { Platform } from 'react-native';

// 기기/에뮬레이터/시뮬레이터 구분
const BASE_URL =
  Platform.OS === 'ios'
    ? 'http://localhost:8080' // iOS 시뮬레이터 로컬 서버
    : 'http://10.0.2.2:8080'; // Android 에뮬레이터 로컬 서버

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
    const headers = (config.headers ?? {}) as Record<string, string>;
    if (!headers.Authorization) {
      headers.Authorization = `Bearer ${accessToken}`;
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
