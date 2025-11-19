import React, { createContext, useContext, useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import * as SecureStore from 'expo-secure-store';
import { login as requestLogin, logout as requestLogout, LoginPayload } from '@/src/api/auth';
import { setAuthToken } from '@/src/api/client';

type Role = 'student' | 'council' | null;

type AuthContextValue = {
  role: Role;
  /** 서버에서 내려준 원본 역할 (예: STUDENT / COUNCIL / ADMIN / OWNER) */
  rawRole: string | null;
  /** 학생회 화면 접근 가능 여부 */
  canAccessCouncil: boolean;
  memberId: number | null;
  email: string | null;
  status: string | null;
  studentId: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const STORAGE_KEYS = {
  ROLE: 'ROLE',
  ACCESS: 'ACCESS_TOKEN',
  REFRESH: 'REFRESH_TOKEN',
  EMAIL: 'EMAIL',
  MEMBER_ID: 'MEMBER_ID',
  STATUS: 'MEMBER_STATUS',
  STUDENT_ID: 'STUDENT_ID',
} as const;

const SERVER_ROLE_TO_APP_ROLE: Record<string, Role> = {
  STUDENT: 'student',
  COUNCIL: 'council',
  ADMIN: 'council',
  OWNER: 'council',
};
const DEFAULT_ROLE: Role = null;

const AuthCtx = createContext<AuthContextValue | null>(null);

const decodeJwt = (token?: string | null): Record<string, unknown> | null => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (err) {
    console.warn('[AuthProvider] failed to decode access token payload', err);
    return null;
  }
};

const extractMemberIdFromToken = (token?: string | null): number | null => {
  const payload = decodeJwt(token);
  if (!payload) return null;
  const raw = payload.memberId ?? payload.sub ?? payload.userId;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export const useAuth = () => {
  const value = useContext(AuthCtx);
  if (!value) {
    throw new Error('AuthProvider missing');
  }
  return value;
};

const toNumberOrNull = (value?: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeServerRole = (role?: string | null): Role => {
  if (!role) return DEFAULT_ROLE;
  const key = role.toUpperCase();
  return SERVER_ROLE_TO_APP_ROLE[key] ?? DEFAULT_ROLE;
};

const canAccessCouncil = (role?: string | null) => {
  const key = (role ?? '').toUpperCase();
  return key === 'COUNCIL' || key === 'ADMIN' || key === 'OWNER';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  const [rawRole, setRawRole] = useState<string | null>(null);
  const [councilAccess, setCouncilAccess] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedRole, storedAccessToken, storedEmail, storedMemberId, storedStatus, storedStudentId] =
          await Promise.all([
            SecureStore.getItemAsync(STORAGE_KEYS.ROLE),
            SecureStore.getItemAsync(STORAGE_KEYS.ACCESS),
            SecureStore.getItemAsync(STORAGE_KEYS.EMAIL),
            SecureStore.getItemAsync(STORAGE_KEYS.MEMBER_ID),
            SecureStore.getItemAsync(STORAGE_KEYS.STATUS),
            SecureStore.getItemAsync(STORAGE_KEYS.STUDENT_ID),
          ]);

        if (storedAccessToken) {
          setAuthToken(storedAccessToken);
          // Prefer token payload when persisted memberId is missing or invalid.
          const decodedMemberId = extractMemberIdFromToken(storedAccessToken);
          if (decodedMemberId && (!storedMemberId || !Number.isFinite(Number(storedMemberId)))) {
            await SecureStore.setItemAsync(STORAGE_KEYS.MEMBER_ID, String(decodedMemberId));
          }
          setIsAuthenticated(true);
        }

        const restoredRole = savedRole || null;
        setRawRole(restoredRole);
        setRole(normalizeServerRole(restoredRole));
        setCouncilAccess(canAccessCouncil(restoredRole));
        setEmail(storedEmail || null);
        const normalizedMemberId =
          toNumberOrNull(storedMemberId) ?? extractMemberIdFromToken(storedAccessToken);
        setMemberId(normalizedMemberId);
        setStatus(storedStatus || null);
        setStudentId(storedStudentId || null);
      } catch (error) {
        console.warn('[AuthProvider] restore session failed', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clearSession = async () => {
    try {
      await Promise.all(
        Object.values(STORAGE_KEYS).map((key) => SecureStore.deleteItemAsync(key)),
      );
    } catch (error) {
      console.warn('[AuthProvider] failed to clear stored session', error);
    } finally {
      setAuthToken(null);
      setRole(null);
      setRawRole(null);
      setCouncilAccess(false);
      setEmail(null);
      setMemberId(null);
      setStatus(null);
      setStudentId(null);
      setIsAuthenticated(false);
    }
  };

  const login = async (payload: LoginPayload) => {
    const response = await requestLogin(payload);
    const mappedRole = normalizeServerRole(response.role);
    const raw = response.role ?? null;

    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ROLE, raw ?? ''),
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS, response.accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH, response.refreshToken ?? ''),
      SecureStore.setItemAsync(STORAGE_KEYS.EMAIL, payload.email ?? ''),
      SecureStore.setItemAsync(
        STORAGE_KEYS.MEMBER_ID,
        String(extractMemberIdFromToken(response.accessToken) ?? response.memberId ?? ''),
      ),
      SecureStore.setItemAsync(STORAGE_KEYS.STATUS, ''),
      SecureStore.setItemAsync(STORAGE_KEYS.STUDENT_ID, response.studentId ?? ''),
    ]);

    setAuthToken(response.accessToken);
    setRole(mappedRole);
    setRawRole(raw);
    setCouncilAccess(canAccessCouncil(raw));
    setEmail(payload.email ?? null);
    const decodedMemberId = extractMemberIdFromToken(response.accessToken);
    setMemberId(decodedMemberId ?? response.memberId ?? null);
    setStatus(null);
    setStudentId(response.studentId ?? null);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await requestLogout();
    } catch (error) {
      console.warn('[AuthProvider] logout request failed', error);
    } finally {
      await clearSession();
    }
  };

  return (
    <AuthCtx.Provider
      value={{
        role,
        rawRole,
        canAccessCouncil: councilAccess,
        memberId,
        email,
        status,
        studentId,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};
