import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

type Role = 'student' | 'council' | null;

type AuthState = {
  role: Role;
  loading: boolean;
  login: (token: string, role: 'student' | 'council') => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);
export const useAuth = () => {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('AuthProvider missing');
  return v;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedRole = await SecureStore.getItemAsync('ROLE');
      setRole((savedRole as Role) ?? null);
      setLoading(false);
    })();
  }, []);

  const login = async (token: string, r: 'student' | 'council') => {
    // TODO: token도 저장하고 필요하면 검증
    await SecureStore.setItemAsync('ROLE', r);
    setRole(r);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('ROLE');
    setRole(null);
  };

  return (
    <AuthCtx.Provider value={{ role, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};
