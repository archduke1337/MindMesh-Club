// context/AuthContext.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Models } from "appwrite";
import { authService } from "@/lib/appwrite";
import { isUserAdminByEmail } from "@/lib/adminConfig";

interface MemberProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  branch: string;
  year: string;
  college: string;
  program: string;
  skills: string[];
  interests: string[];
  bio: string | null;
  avatar: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  portfolio: string | null;
  memberStatus: string;
  eventsAttended: number;
  badges: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  profile: MemberProfile | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  isProfileComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: true,
  isAdmin: false,
  isProfileComplete: false,
  login: async () => {
    throw new Error("AuthContext not initialized");
  },
  register: async () => {
    throw new Error("AuthContext not initialized");
  },
  loginWithGoogle: () => {
    throw new Error("AuthContext not initialized");
  },
  loginWithGitHub: () => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {
    throw new Error("AuthContext not initialized");
  },
  refreshProfile: async () => {
    throw new Error("AuthContext not initialized");
  },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // Derive admin status from BOTH Appwrite labels AND email-based config
  const isAdmin = Boolean(
    user && (
      user.labels?.includes("admin") ||
      isUserAdminByEmail(user.email)
    )
  );

  const isProfileComplete = Boolean(profile);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/members/profile?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile || null);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.$id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setProfileLoading(false);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
    await checkUser();
  }, [checkUser]);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string
  ) => {
    await authService.createAccount(email, password, name);
    await checkUser();
  }, [checkUser]);

  const loginWithGoogle = useCallback(() => {
    authService.loginWithGoogle();
  }, []);

  const loginWithGitHub = useCallback(() => {
    authService.loginWithGitHub();
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.$id);
    }
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        isAdmin,
        isProfileComplete,
        login,
        register,
        loginWithGoogle,
        loginWithGitHub,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};