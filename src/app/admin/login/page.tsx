"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SchoolCrest } from "@/components/Icons";
import { useAdmin } from "@/components/admin/AdminContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signInAdmin, theme, toggleTheme } = useAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInAdmin(email.trim(), password);
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
              <span className="brand-name">School Portal</span>
              <span className="brand-sub">Admin Console</span>
            </span>
          </div>
          <div className="admin-header-right">
            <button
              type="button"
              className="btn btn-outline-white admin-icon-btn"
              onClick={toggleTheme}
              aria-pressed={theme === "dark"}
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              title={
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
            </button>
            <Link href="/" className="btn btn-white btn-sm">
              Public Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="container admin-main" style={{ maxWidth: 440 }}>
        <div className="admin-card">
          <span className="section-eyebrow">Authorized Personnel Only</span>
          <h1 className="admin-card-title" style={{ fontSize: "1.35rem" }}>
            Admin Console Sign In
          </h1>
          <p className="modal-sub">
            Enter your assigned school email and password to access portal management tools.
          </p>

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="form-group">
              <label htmlFor="admin-login-email" className="form-label">
                Email Address
              </label>
              <input
                id="admin-login-email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="name@school.edu.ph"
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
              <div className="password-input-wrap">
                <input
                  id="admin-login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="feedback-box" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Signing In…" : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
