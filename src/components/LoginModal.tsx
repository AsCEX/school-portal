"use client";

import React, { useEffect, useState } from "react";
import { loginUser } from "@/lib/api";
import type { AuthUser } from "@/types/portal";

export type PortalRolePreset = "student" | "parent" | "faculty";

const ROLE_EMAILS: Record<PortalRolePreset, string> = {
  student: "student@alnavarroces.edu.ph",
  parent: "parent@alnavarroces.edu.ph",
  faculty: "faculty@alnavarroces.edu.ph",
};

interface LoginModalProps {
  open: boolean;
  initialRole?: PortalRolePreset;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

export function LoginModal({
  open,
  initialRole = "student",
  onClose,
  onAuthenticated,
}: LoginModalProps) {
  const [role, setRole] = useState<PortalRolePreset>(initialRole);
  const [email, setEmail] = useState(ROLE_EMAILS[initialRole]);
  const [password, setPassword] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRole(initialRole);
      setEmail(ROLE_EMAILS[initialRole]);
      setPassword("password");
      setError(null);
    }
  }, [open, initialRole]);

  if (!open) return null;

  const handleRolePick = (nextRole: PortalRolePreset) => {
    setRole(nextRole);
    setEmail(ROLE_EMAILS[nextRole]);
    setPassword("password");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { user } = await loginUser(email, password, "portal");
      onAuthenticated(user);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Ensure the portal API is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-sm">
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close sign in dialog"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5 5L15 15M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <span className="section-eyebrow">School Portal Access</span>
        <h3 className="modal-heading" id="login-modal-title">
          ALNAVARROCES Portal Sign In
        </h3>
        <p className="modal-sub">
          Sign in with your learner, parent, or teacher portal account.
        </p>

        <div
          className="login-role-switch login-role-switch-3"
          role="tablist"
          aria-label="Select portal role"
        >
          {(["student", "parent", "faculty"] as PortalRolePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              className={`login-role-btn ${role === preset ? "active" : ""}`}
              onClick={() => handleRolePick(preset)}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              School Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
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
            {submitting ? "Signing In..." : "Sign In to Portal"}
          </button>
        </form>

        <div className="demo-hint">
          Demo accounts use password <code>password</code>.
        </div>
      </div>
    </div>
  );
}
