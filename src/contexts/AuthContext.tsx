import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import type { User } from '../types';
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
} from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadStoredUser(): User | null {
  try {
    // YAHAN CHANGE KIYA HAI: localStorage -> sessionStorage
    const token = sessionStorage.getItem('sub_graveyard_token');
    const stored = sessionStorage.getItem('sub_graveyard_user');

    if (!token || !stored) return null;

    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await apiLogin(email, password);
    setUser(authenticatedUser as User);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await apiSignup(email, password);
    setUser(authenticatedUser as User);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: false,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}