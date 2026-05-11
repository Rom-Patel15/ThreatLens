import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

export type User = { id: string; email: string; name: string | null; emailVerified: boolean };

export type OtpChallenge = {
  challengeId: string;
  expiresAt: string;
  email: string;
};

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ otp?: OtpChallenge }>;
  register: (email: string, password: string, name?: string) => Promise<{ otp?: OtpChallenge }>;
  verifyOtp: (challengeId: string, code: string) => Promise<void>;
  resendOtp: (challengeId: string) => Promise<{ expiresAt: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("tl_token"));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("tl_token");
    setToken(null);
    setUser(null);
  }, []);

  const bootstrap = useCallback(async () => {
    const t = localStorage.getItem("tl_token");
    if (!t) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<{ user: User }>("/api/auth/me");
      setUser(data.user);
      setToken(t);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const finalizeSession = useCallback((t: string, u: User) => {
    localStorage.setItem("tl_token", t);
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<
      | { requiresOtp: true; challengeId: string; expiresAt: string; email: string }
      | { requiresOtp?: false; token: string; user: User }
    >("/api/auth/login", { email, password });

    if ("requiresOtp" in data && data.requiresOtp) {
      return {
        otp: { challengeId: data.challengeId, expiresAt: data.expiresAt, email: data.email },
      };
    }
    const d = data as { token: string; user: User };
    finalizeSession(d.token, d.user);
    return {};
  }, [finalizeSession]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { data } = await api.post<
      | { requiresOtp: true; challengeId: string; expiresAt: string; email: string }
      | { token: string; user: User }
    >("/api/auth/register", { email, password, name });

    if ("requiresOtp" in data && data.requiresOtp) {
      return {
        otp: { challengeId: data.challengeId, expiresAt: data.expiresAt, email: data.email },
      };
    }
    const d = data as { token: string; user: User };
    finalizeSession(d.token, d.user);
    return {};
  }, [finalizeSession]);

  const verifyOtp = useCallback(async (challengeId: string, code: string) => {
    const { data } = await api.post<{ token: string; user: User }>("/api/auth/verify-otp", { challengeId, code });
    finalizeSession(data.token, data.user);
  }, [finalizeSession]);

  const resendOtp = useCallback(async (challengeId: string) => {
    const { data } = await api.post<{ expiresAt: string }>("/api/auth/resend-otp", { challengeId });
    return { expiresAt: data.expiresAt };
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, verifyOtp, resendOtp, logout }),
    [user, token, loading, login, register, verifyOtp, resendOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
