"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SchoolCrest } from "@/components/Icons";
import { useAdmin } from "./AdminContext";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/announcements": "Announcements",
  "/admin/events": "Upcoming Events",
  "/admin/statistics": "School Statistics",
  "/admin/employees": "Employee Profiles",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const pathname =
    rawPathname.length > 1 && rawPathname.endsWith("/")
      ? rawPathname.slice(0, -1)
      : rawPathname;
  const router = useRouter();
  const {
    user,
    authChecked,
    portal,
    loadingData,
    statusMessage,
    setStatusMessage,
    refreshData,
    signOutAdmin,
    theme,
    toggleTheme,
  } = useAdmin();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (!authChecked) return;
    if (!isLoginRoute && !user) {
      router.replace("/admin/login");
    } else if (isLoginRoute && user) {
      router.replace("/admin");
    }
  }, [authChecked, isLoginRoute, user, router]);

  useEffect(() => {
    setSidebarOpen(false);
    setStatusMessage(null);
  }, [pathname, setStatusMessage]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (!authChecked || !user) {
    return (
      <div className="admin-shell" data-admin-theme={theme}>
        <div className="loading-state">Loading Admin Console…</div>
      </div>
    );
  }

  const pageTitle = PAGE_TITLES[pathname] || "Admin Console";

  const handleSignOut = async () => {
    await signOutAdmin();
    router.replace("/admin/login");
  };

  return (
    <div className="admin-dashboard" data-admin-theme={theme}>
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Link href="/admin" className="brand brand-footer">
            <span className="brand-crest" aria-hidden="true">
              <SchoolCrest inverted />
            </span>
            <span className="brand-text">
              <span className="brand-name">ALNAVARROCES</span>
              <span className="brand-sub">Admin Console</span>
            </span>
          </Link>
        </div>

        <nav className="admin-nav" aria-label="Admin Sidebar Navigation">
          <span className="admin-nav-label">Main Menu</span>

          <Link
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
            className={`admin-nav-item ${pathname === "/admin" ? "active" : ""}`}
          >
            <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <span className="admin-nav-label" style={{ marginTop: 10 }}>
            Portal Content
          </span>

          <Link
            href="/admin/announcements"
            aria-current={pathname === "/admin/announcements" ? "page" : undefined}
            className={`admin-nav-item ${pathname === "/admin/announcements" ? "active" : ""
              }`}
          >
            <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 5.5H16M4 10H16M4 14.5H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>Announcements</span>
            <span className="admin-nav-badge">{portal?.announcements.length ?? 0}</span>
          </Link>

          <Link
            href="/admin/events"
            aria-current={pathname === "/admin/events" ? "page" : undefined}
            className={`admin-nav-item ${pathname === "/admin/events" ? "active" : ""
              }`}
          >
            <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 8.5H17M7 2.5V5M13 2.5V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>Upcoming Events</span>
            <span className="admin-nav-badge">{portal?.events.length ?? 0}</span>
          </Link>

          <Link
            href="/admin/statistics"
            aria-current={pathname === "/admin/statistics" ? "page" : undefined}
            className={`admin-nav-item ${pathname === "/admin/statistics" ? "active" : ""
              }`}
          >
            <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 16V10M10 16V4M16 16V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>School Statistics</span>
            <span className="admin-nav-badge">{portal?.statistics.length ?? 0}</span>
          </Link>

          <Link
            href="/admin/employees"
            aria-current={pathname === "/admin/employees" ? "page" : undefined}
            className={`admin-nav-item ${pathname === "/admin/employees" ? "active" : ""
              }`}
          >
            <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 16.5C4.8 13.8 7.1 12.5 10 12.5C12.9 12.5 15.2 13.8 16 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>Employee Profiles</span>
            <span className="admin-nav-badge">{portal?.employees.length ?? 0}</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-portal-link"
          >
            <span>Open Public Portal</span>
            <span aria-hidden="true">&nearr;</span>
          </a>
          <div className="admin-sidebar-user">
            <div className="admin-user-name">{user.name}</div>
            <div className="admin-user-role">
              {user.role.toUpperCase()} &middot; {user.email}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-white btn-sm btn-block"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="admin-workspace">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              aria-label="Open sidebar navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
            <div>
              <div className="admin-breadcrumb">
                ALNAVARROCES Admin / <span>{pageTitle}</span>
              </div>
              <h1 className="admin-page-title">{pageTitle}</h1>
            </div>
          </div>

          <div className="admin-header-right">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={toggleTheme}
              aria-pressed={theme === "dark"}
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <svg className="btn-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M10 2.5V4.2M10 15.8V17.5M2.5 10H4.2M15.8 10H17.5M4.7 4.7L5.9 5.9M14.1 14.1L15.3 15.3M15.3 4.7L14.1 5.9M5.9 14.1L4.7 15.3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg className="btn-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M16.2 12.6A6.8 6.8 0 0 1 7.4 3.8a7 7 0 1 0 8.8 8.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={refreshData}
              disabled={loadingData}
            >
              {loadingData ? "Refreshing…" : "Refresh Data"}
            </button>
          </div>
        </header>

        <main className="admin-content">
          {statusMessage && (
            <div className="feedback-box admin-flash" role="status" aria-live="polite">
              <span>{statusMessage}</span>
              <button
                type="button"
                className="flash-dismiss"
                onClick={() => setStatusMessage(null)}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
