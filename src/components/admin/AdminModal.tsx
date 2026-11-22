"use client";

import React, { useEffect, useId } from "react";

interface AdminModalProps {
  open: boolean;
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function AdminModal({
  open,
  eyebrow,
  title,
  onClose,
  children,
}: AdminModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog">
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
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
        <span className="section-eyebrow">{eyebrow}</span>
        <h2 className="modal-heading" id={titleId}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
