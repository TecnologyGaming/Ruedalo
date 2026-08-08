import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken } from "./api";
import { storage } from "@/src/utils/storage";

export type Role = "passenger" | "driver" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  wallet_balance: number;
  is_online?: boolean;
  lat?: number | null;
  lng?: number | null;
  rating_avg?: number;
  cedula?: string;
  profile_pic?: string;
  completed_rides_count?: number;
  driver_status?: string;
  is_verified?: boolean;
  referral_code?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  plate?: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; phone: string; role: "passenger" | "driver" }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User | null) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await storage.secureGet<string>("rideve_token", "" as string);
      if (!token) {
        setUser(null);
        return;
      }
      const me = await api<User>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
      await setToken(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: { email: string; password: string; name: string; phone: string; role: "passenger" | "driver" }) => {
    const res = await api<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: data,
      auth: false,
    });
    await setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
