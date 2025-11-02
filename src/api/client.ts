// src/api/client.ts
import axios from 'axios';
import { Platform } from 'react-native';

// 기기/에뮬레이터/시뮬레이터 구분
const BASE_URL =
  Platform.OS === 'ios'
    ? 'http://13.209.220.192:8080' // iOS 시뮬레이터
    : 'http://10.0.2.2:8080'; // Android 에뮬레이터

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
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
