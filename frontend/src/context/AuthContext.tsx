'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, UserProfile, LoginPayload, RegisterPayload, UpdateProfilePayload } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload, rememberMe?: boolean) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'r2m_access_token';
const REFRESH_KEY = 'r2m_refresh_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  const fetchProfile = useCallback(async (accessToken: string): Promise<UserProfile | null> => {
    try {
      const profile = await authApi.getMe(accessToken);
      setUser(profile);
      setToken(accessToken);
      return profile;
    } catch {
      // Try refresh token if available
      const storedRefresh = typeof window !== 'undefined'
        ? localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
        : null;

      if (storedRefresh) {
        try {
          const newTokens = await authApi.refresh(storedRefresh);
          if (typeof window !== 'undefined') {
            if (localStorage.getItem(TOKEN_KEY)) {
              localStorage.setItem(TOKEN_KEY, newTokens.access_token);
              localStorage.setItem(REFRESH_KEY, newTokens.refresh_token);
            } else {
              sessionStorage.setItem(TOKEN_KEY, newTokens.access_token);
              sessionStorage.setItem(REFRESH_KEY, newTokens.refresh_token);
            }
          }
          setToken(newTokens.access_token);
          const refreshedProfile = await authApi.getMe(newTokens.access_token);
          setUser(refreshedProfile);
          return refreshedProfile;
        } catch {
          logout();
          return null;
        }
      } else {
        logout();
        return null;
      }
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          await fetchProfile(storedToken);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchProfile]);

  const login = async (credentials: LoginPayload, rememberMe: boolean = true): Promise<UserProfile> => {
    const tokens = await authApi.login(credentials);
    const storage = rememberMe ? localStorage : sessionStorage;

    if (typeof window !== 'undefined') {
      // Clear alternative storage to avoid conflicts
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem(TOKEN_KEY);
      otherStorage.removeItem(REFRESH_KEY);

      storage.setItem(TOKEN_KEY, tokens.access_token);
      storage.setItem(REFRESH_KEY, tokens.refresh_token);
    }

    setToken(tokens.access_token);
    const profile = await authApi.getMe(tokens.access_token);
    setUser(profile);
    return profile;
  };

  const register = async (payload: RegisterPayload): Promise<UserProfile> => {
    const registeredUser = await authApi.register(payload);
    return registeredUser;
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    if (!token) throw new Error('Not authenticated');
    const updated = await authApi.updateMe(token, payload);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
