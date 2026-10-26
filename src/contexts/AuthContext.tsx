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
  updateProfile: (newName: string) => Promise<void>; // 🌟 Naya function
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadStoredUser(): User | null {
  try {
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
    await apiSignup(email, password);
    sessionStorage.removeItem('sub_graveyard_token');
    sessionStorage.removeItem('sub_graveyard_user');
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    sessionStorage.removeItem('sub_graveyard_token');
    sessionStorage.removeItem('sub_graveyard_user');
    setUser(null);
  }, []);

  // 🌟 Naya Function: Update Profile
  const updateProfile = useCallback(async (newName: string) => {
    // Yahan aap apni backend API call laga sakte hain
    // await api.updateProfile({ name: newName });
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    setUser((prevUser) => {
      if (!prevUser) return null;
      
      const updatedUser = { ...prevUser, name: newName };
      
      // Session storage mein bhi update karein taake refresh par na jaye
      sessionStorage.setItem('sub_graveyard_user', JSON.stringify(updatedUser));
      
      return updatedUser;
    });
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
        updateProfile, // 🌟 Add kiya
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