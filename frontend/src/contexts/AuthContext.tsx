"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  AuthBundle,
  AuthUser,
  clearAuth,
  getToken,
  getUser,
  saveAuth,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signup: (data: { email: string; password: string; name?: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cached = getUser();
    const token = getToken();
    if (cached && token) {
      setUser(cached);
      api
        .get<AuthUser>("/auth/me")
        .then(setUser)
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (data: { email: string; password: string; name?: string }) => {
      const res = await api.post<AuthBundle>("/auth/signup", data, { auth: false });
      saveAuth(res);
      setUser(res.user);
    },
    [],
  );

  const login = useCallback(
    async (data: { email: string; password: string }) => {
      const res = await api.post<AuthBundle>("/auth/login", data, { auth: false });
      saveAuth(res);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
