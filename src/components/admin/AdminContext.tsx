"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  clearAuthSession,
  fetchCurrentUser,
  fetchPortalOverview,
  getStoredToken,
  loginUser,
  logoutUser,
} from "@/lib/api";
import type { AuthUser, PortalOverview } from "@/types/portal";

export type AdminTheme = "dark" | "light";

const ADMIN_THEME_KEY = "alnces_admin_theme_v1";

interface AdminContextValue {
  user: AuthUser | null;
  authChecked: boolean;
  portal: PortalOverview | null;
  loadingData: boolean;
  statusMessage: string | null;
  setStatusMessage: (msg: string | null) => void;
  refreshData: () => Promise<void>;
  signInAdmin: (email: string, password: string) => Promise<AuthUser>;
  signOutAdmin: () => Promise<void>;
  theme: AdminTheme;
  toggleTheme: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [portal, setPortal] = useState<PortalOverview | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<AdminTheme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_THEME_KEY);
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(ADMIN_THEME_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const refreshData = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await fetchPortalOverview();
      setPortal(data);
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : "Unable to connect to Laravel API server."
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken("admin");
    if (!token) {
      setAuthChecked(true);
      return;
    }

    fetchCurrentUser("admin")
      .then(({ user: authed }) => {
        if (authed.can_manage_portal) {
          setUser(authed);
          refreshData();
        } else {
          clearAuthSession("admin");
          setUser(null);
        }
      })
      .catch(() => {
        clearAuthSession("admin");
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, [refreshData]);

  const signInAdmin = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const { user: authed } = await loginUser(email, password, "admin");
      if (!authed.can_manage_portal) {
        await logoutUser("admin");
        throw new Error(
          "Administrator or Faculty permissions are required to access the Admin Console."
        );
      }
      setUser(authed);
      await refreshData();
      return authed;
    },
    [refreshData]
  );

  const signOutAdmin = useCallback(async () => {
    await logoutUser("admin");
    setUser(null);
    setPortal(null);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        user,
        authChecked,
        portal,
        loadingData,
        statusMessage,
        setStatusMessage,
        refreshData,
        signInAdmin,
        signOutAdmin,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used inside AdminProvider");
  }
  return ctx;
}
