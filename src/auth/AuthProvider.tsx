import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as requestLogin, LoginPayload } from '@/src/api/auth';
import { setAuthToken } from '@/src/api/client';

type Role = 'student' | 'council' | null;

type AuthContextValue = {
  role: Role;
  memberId: number | null;
  email: string | null;
  status: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEYS = {
  ROLE: 'ROLE',
  ACCESS: 'ACCESS_TOKEN',
  REFRESH: 'REFRESH_TOKEN',
  EMAIL: 'EMAIL',
  MEMBER_ID: 'MEMBER_ID',
  STATUS: 'MEMBER_STATUS',
} as const;

const SERVER_ROLE_TO_APP_ROLE: Record<string, Role> = {
  STUDENT: 'student',
  COUNCIL: 'council',
};
const DEFAULT_ROLE: Role = 'student';

const AuthCtx = createContext<AuthContextValue | null>(null);

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedRole, storedAccessToken, storedEmail, storedMemberId, storedStatus] =
          await Promise.all([
            SecureStore.getItemAsync(STORAGE_KEYS.ROLE),
            SecureStore.getItemAsync(STORAGE_KEYS.ACCESS),
            SecureStore.getItemAsync(STORAGE_KEYS.EMAIL),
            SecureStore.getItemAsync(STORAGE_KEYS.MEMBER_ID),
            SecureStore.getItemAsync(STORAGE_KEYS.STATUS),
          ]);

        if (storedAccessToken) {
          setAuthToken(storedAccessToken);
        }

        const restoredRole =
          savedRole === 'student' || savedRole === 'council' ? (savedRole as Role) : null;
        setRole(restoredRole);
        setEmail(storedEmail || null);
        setMemberId(toNumberOrNull(storedMemberId));
        setStatus(storedStatus || null);
      } catch (error) {
        console.warn('[AuthProvider] restore session failed', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await requestLogin(payload);
    const mappedRole = normalizeServerRole(response.role);

    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ROLE, mappedRole),
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS, response.accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH, response.refreshToken ?? ''),
      SecureStore.setItemAsync(STORAGE_KEYS.EMAIL, response.email ?? ''),
      SecureStore.setItemAsync(STORAGE_KEYS.MEMBER_ID, String(response.memberId ?? '')),
      SecureStore.setItemAsync(STORAGE_KEYS.STATUS, response.status ?? ''),
    ]);

    setAuthToken(response.accessToken);
    setRole(mappedRole);
    setEmail(response.email ?? null);
    setMemberId(response.memberId ?? null);
    setStatus(response.status ?? null);
  };

  const logout = async () => {
    await Promise.all(
      Object.values(STORAGE_KEYS).map((key) => SecureStore.deleteItemAsync(key)),
    );
    setAuthToken(null);
    setRole(null);
    setEmail(null);
    setMemberId(null);
    setStatus(null);
  };

  return (
    <AuthCtx.Provider value={{ role, memberId, email, status, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};
