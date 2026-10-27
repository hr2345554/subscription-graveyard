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
  signup: (email: string, password: string, name?: string) => Promise<void>; 
  logout: () => void;
  updateProfile: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 🌟 Sirf user data load karenge, token nahi (kyunki token HttpOnly cookie mein hai)
function loadStoredUser(): User | null {
  try {
    const stored = sessionStorage.getItem('sub_graveyard_user');
    if (!stored) return null;
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
    
    // 🌟 User ko state aur storage mein save karein
    setUser(authenticatedUser as User);
    sessionStorage.setItem('sub_graveyard_user', JSON.stringify(authenticatedUser));
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    await apiSignup(email, password, name); 
    // Signup ke baad humne Login page par bhejna hai, toh user ko state mein set nahi kar rahe
  }, []);

  const logout = useCallback(() => {
    // 🌟 Backend ko call karein taake HttpOnly Cookie clear ho jaye
    apiLogout(); 
    
    // Frontend se user data clear karein
    sessionStorage.removeItem('sub_graveyard_user');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (newName: string) => {
    // Backend API call for profile update
    // await api.updateProfile({ name: newName });
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    setUser((prevUser) => {
      if (!prevUser) return null;
      
      const updatedUser = { ...prevUser, name: newName };
      
      // Update storage
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
        updateProfile,
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