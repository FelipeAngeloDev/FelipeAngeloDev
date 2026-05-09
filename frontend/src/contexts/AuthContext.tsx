import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL as string;
const TOKEN_KEY = 'session_token';

export type User = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  loginWithSessionId: (sessionId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchMe = async (t: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return true;
      }
    } catch {}
    return false;
  };

  const loginWithSessionId = async (sessionId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const t = data.session_token as string;
      setToken(t);
      setUser(data.user);
      await AsyncStorage.setItem(TOKEN_KEY, t);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  };

  const refresh = async () => {
    if (token) await fetchMe(token);
  };

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (stored) {
        setToken(stored);
        const ok = await fetchMe(stored);
        if (!ok) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      }
      // Cold-start session_id check (mobile/web)
      try {
        let initialUrl: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          initialUrl = window.location.href;
        } else {
          initialUrl = await Linking.getInitialURL();
        }
        if (initialUrl) {
          const sid = parseSessionId(initialUrl);
          if (sid) {
            await loginWithSessionId(sid);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      } catch {}
      setInitialized(true);
    })();

    const sub = Linking.addEventListener('url', async ({ url }) => {
      const sid = parseSessionId(url);
      if (sid) await loginWithSessionId(sid);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Ctx.Provider value={{ user, token, loading, initialized, loginWithSessionId, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}

function parseSessionId(url: string): string | null {
  try {
    const hashIdx = url.indexOf('#');
    if (hashIdx >= 0) {
      const hash = url.substring(hashIdx + 1);
      const params = new URLSearchParams(hash);
      const sid = params.get('session_id');
      if (sid) return sid;
    }
    const qIdx = url.indexOf('?');
    if (qIdx >= 0) {
      const q = url.substring(qIdx + 1).split('#')[0];
      const params = new URLSearchParams(q);
      const sid = params.get('session_id');
      if (sid) return sid;
    }
  } catch {}
  return null;
}

export async function apiFetch(path: string, opts: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_URL}${path}`, { ...opts, headers });
  return res;
}
