"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SchoolCrest } from "@/components/Icons";
import { useAdmin } from "@/components/admin/AdminContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signInAdmin, theme, toggleTheme } = useAdmin();

  const [email, setEmail] = useState("admin@alnavarroces.edu.ph");
  const [password, setPassword] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInAdmin(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page" data-admin-theme={theme}>
      <header className="admin-topbar">
        <div className="container admin-topbar-inner">
          <div className="brand brand-footer">
            <span className="brand-crest" aria-hidden="true">
              <SchoolCrest inverted />
            </span>
            <span className="brand-text">
              <span className="brand-name">ALNAVARROCES</span>
              <span className="brand-sub">
                A.L. Navarro Central Elementary School &middot; Admin Console
              </span>
            </span>
          </div>
          <div className="admin-header-right">
            <button
              type="button"
              className="btn btn-outline-white btn-sm"
              onClick={toggleTheme}
              aria-pressed={theme === "dark"}
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <Link href="/" className="btn btn-white btn-sm">
              Public School Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="container admin-main" style={{ maxWidth: 460 }}>
        <div className="admin-card">
          <span className="section-eyebrow">Restricted Area</span>
          <h1 className="admin-card-title" style={{ fontSize: "1.45rem" }}>
            Admin Console Sign In
          </h1>
          <p className="modal-sub">
            Sign in with an Administrator or Faculty account to manage announcements,
            events, school statistics, and employee records.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="admin-login-email" className="form-label">
                Admin Email
              </label>
              <input
                id="admin-login-email"
                type="email"
                autoComplete="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-login-password" className="form-label">
                Password
              </label>
              <input
                id="admin-login-password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="feedback-box">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Signing In..." : "Sign In to Admin Dashboard"}
            </button>
          </form>

          <div className="demo-hint">
            Default Admin: <code>admin@alnavarroces.edu.ph</code> / <code>password</code>
          </div>
        </div>
      </main>
    </div>
  );
}
