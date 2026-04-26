import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "pointhive.userId";

function readDemoUserIdFromUrl(): number | null {
  // Dev-only quick auth via ?demoUserId=N (used to preview authenticated
  // screens from the workspace screenshot/test tools). Disabled in production
  // builds to avoid exposing a trivial impersonation vector.
  if (Platform.OS !== "web") return null;
  if (!__DEV__) return null;
  try {
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("demoUserId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

let _userId: string | null = null;

export function getCurrentUserIdHeader(): string | null {
  return _userId;
}

type AuthContextValue = {
  userId: number | null;
  ready: boolean;
  signIn: (id: number) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    const queryUserId = readDemoUserIdFromUrl();
    const bootstrap = queryUserId
      ? AsyncStorage.setItem(STORAGE_KEY, String(queryUserId)).then(
          () => String(queryUserId),
        )
      : AsyncStorage.getItem(STORAGE_KEY);
    bootstrap
      .then((value) => {
        if (!mounted) return;
        const parsed = value ? Number(value) : null;
        if (parsed && Number.isFinite(parsed)) {
          _userId = String(parsed);
          setUserIdState(parsed);
        } else {
          _userId = null;
          setUserIdState(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        _userId = null;
        setUserIdState(null);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(
    async (id: number) => {
      _userId = String(id);
      await AsyncStorage.setItem(STORAGE_KEY, String(id));
      setUserIdState(id);
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    _userId = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUserIdState(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ userId, ready, signIn, signOut }),
    [userId, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
