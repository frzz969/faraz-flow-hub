/**
 * FARAZZ FLOW — backend session provider (P7).
 *
 * Detects whether the live API is reachable and exposes:
 *   - `mode`: "booting" (probing) | "live" (backend up) | "demo" (offline seed data)
 *   - `loginLive()`: real credential check against the API. Returns `null`
 *     when the backend is unreachable so callers can fall back to the demo
 *     directory instead of failing the whole app.
 *   - `logoutLive()`: revokes the session and clears the CSRF token.
 *
 * Zero-disruption: every existing page keeps using the seed DataProvider; this
 * provider only decides whether live API calls are available and safe to make.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as api from "./api";

export type BackendMode = "booting" | "live" | "demo";

interface BackendContextValue {
  mode: BackendMode;
  user: api.SessionUser | null;
  lastCheckedAt: Date | null;
  probe: () => Promise<BackendMode>;
  /** Live login — returns the user, or `null` if the backend is unreachable. */
  loginLive: (email: string, password: string, remember?: boolean) => Promise<api.SessionUser | null>;
  logoutLive: () => Promise<void>;
  api: typeof api;
}

const BackendContext = createContext<BackendContextValue | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<BackendMode>("booting");
  const [user, setUser] = useState<api.SessionUser | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const mounted = useRef(true);
  const probing = useRef(false);

  const probe = useCallback(async (): Promise<BackendMode> => {
    if (probing.current) return mode;
    probing.current = true;
    try {
      const ok = await api.pingBackend();
      if (!mounted.current) return mode;
      if (ok) {
        setMode("live");
        // Best-effort session restore (existing cookie) — non-fatal.
        try {
          const u = await api.me();
          if (mounted.current) setUser(u);
        } catch {
          if (mounted.current) setUser(null);
        }
      } else {
        setMode("demo");
        setUser(null);
      }
      setLastCheckedAt(new Date());
      return ok ? "live" : "demo";
    } catch {
      if (mounted.current) {
        setMode("demo");
        setUser(null);
        setLastCheckedAt(new Date());
      }
      return "demo";
    } finally {
      probing.current = false;
    }
  }, [mode]);

  // Probe once on mount, then keep retrying while in demo mode so the app
  // reconnects the moment the backend comes back up.
  useEffect(() => {
    mounted.current = true;
    void probe();
    const t = window.setInterval(() => {
      void probe();
    }, 30_000);
    return () => {
      mounted.current = false;
      window.clearInterval(t);
    };
  }, [probe]);

  const loginLive = useCallback(
    async (email: string, password: string, remember = false): Promise<api.SessionUser | null> => {
      try {
        const result = await api.login(email, password, remember);
        if (mounted.current) {
          setUser(result.user);
          setMode("live");
          setLastCheckedAt(new Date());
        }
        return result.user;
      } catch (err) {
        if (err instanceof api.ApiError && err.network) return null;
        // Backend reachable but rejected credentials — let caller show the error.
        throw err;
      }
    },
    []
  );

  const logoutLive = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } catch {
      /* session already invalid — still clear local state */
    }
    if (mounted.current) {
      setUser(null);
      setMode("demo");
      setLastCheckedAt(new Date());
    }
  }, []);

  const value = useMemo<BackendContextValue>(
    () => ({ mode, user, lastCheckedAt, probe, loginLive, logoutLive, api }),
    [mode, user, lastCheckedAt, probe, loginLive, logoutLive]
  );

  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}

export function useBackend(): BackendContextValue {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error("useBackend must be used inside BackendProvider");
  return ctx;
}