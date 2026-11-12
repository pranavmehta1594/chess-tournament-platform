'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { https } from '../services/https';
import { ENDPOINTS } from '../services/endpoints';
import { getSocket, disconnectSocket } from '../lib/socket';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'COACH' | 'STUDENT';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async (tokenOverride?: string | null) => {
    const sessionToken =
      tokenOverride ??
      (typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null);

    // A public page does not need to call /auth/me when there is no saved
    // session. This prevents the login screen from waiting on a cold or
    // unavailable backend before it can render.
    if (!sessionToken) {
      setUser(null);
      disconnectSocket();
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await https.get<User>(ENDPOINTS.auth.me);
      setUser(data);
      setToken(sessionToken);
      // Connect socket with session
      const socket = getSocket(sessionToken);
      if (!socket.connected) {
        socket.connect();
      }
    } catch {
      setUser(null);
      disconnectSocket();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check saved token in localStorage if available
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null;
    setToken(savedToken);
    void refreshUser(savedToken);
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { data: result } = await https.post<{ user: User; token: string }>(
        ENDPOINTS.auth.login,
        { email, password: pass },
      );

      setUser(result.user);
      setToken(result.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('chess_token', result.token);
      }

      // Initialize socket with token
      const socket = getSocket(result.token);
      socket.connect();

      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await https.post(ENDPOINTS.auth.logout);
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chess_token');
      }
      disconnectSocket();
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
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

