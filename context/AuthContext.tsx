// context/AuthContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Models } from "appwrite";
import { authService } from "@/lib/appwrite";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error("AuthContext not initialized - wrap your component with AuthProvider"); },
  register: async () => { throw new Error("AuthContext not initialized - wrap your component with AuthProvider"); },
  loginWithGoogle: () => { throw new Error("AuthContext not initialized - wrap your component with AuthProvider"); },
  loginWithGitHub: () => { throw new Error("AuthContext not initialized - wrap your component with AuthProvider"); },
  logout: async () => { throw new Error("AuthContext not initialized - wrap your component with AuthProvider"); },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    await checkUser();
  };

  const register = async (email: string, password: string, name: string) => {
    await authService.createAccount(email, password, name);
    await checkUser();
  };

  const loginWithGoogle = () => {
    authService.loginWithGoogle();
  };

  const loginWithGitHub = () => {
    authService.loginWithGitHub();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, loginWithGitHub, logout }}>
      {children}
    </AuthContext.Provider>
  );
};