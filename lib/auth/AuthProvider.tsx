"use client";
import { createContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/lib/types/models";
import * as authApi from "@/lib/api/auth";
import { getToken, setToken, clearToken } from "./token";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isPending: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string; orgName: string }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    setIsPending(false);
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const result = await authApi.login(input);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; orgName: string }) => {
      const result = await authApi.register(input);
      setToken(result.accessToken);
      setUser(result.user);
    },
    []
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user || !!getToken(), isPending, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
