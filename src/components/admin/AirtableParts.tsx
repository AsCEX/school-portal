"use client";

import React from "react";

export type RowDensity = "short" | "medium" | "tall";
export type FieldIconType =
  | "text"
  | "select"
  | "date"
  | "number"
  | "user"
  | "status"
  | "location"
  | "actions";

export function FieldTypeIcon({ type }: { type: FieldIconType }) {
  switch (type) {
    case "select":
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5.5 7.2L8 9.7L10.5 7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "date":
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.35" />
          <path d="M2.5 6.8H13.5M5.5 2V4M10.5 2V4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );
    case "number":
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 2.5L4.5 13.5M11.5 2.5L10 13.5M2.5 6H13.5M2 10H13" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );
    case "user":
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.35" />
          <path d="M3.2 13.2C4 11 5.8 9.8 8 9.8C10.2 9.8 12 11 12.8 13.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );
    case "status":
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.35" />
          <path d="M5.6 8.2L7.2 9.8L10.6 6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "location":
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 14C8 14 12.5 10.1 12.5 6.8C12.5 4.3 10.5 2.3 8 2.3C5.5 2.3 3.5 4.3 3.5 6.8C3.5 10.1 8 14 8 14Z" stroke="currentColor" strokeWidth="1.35" />
          <circle cx="8" cy="6.8" r="1.5" fill="currentColor" />
        </svg>
      );
    case "actions":
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="4" cy="8" r="1.2" fill="currentColor" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
          <circle cx="12" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 12.5L6.2 3.8H7.4L10.6 12.5M4.1 9.8H9.5M11.8 6.5H14M12.9 6.5V12.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function GridViewBadge({ label = "Grid view" }: { label?: string }) {
  return (
    <span className="at-view-pill">
      <svg className="at-field-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2.5" width="12" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.35" />
        <path d="M2 6H14M2 9.8H14M6.2 6V13.5" stroke="currentColor" strokeWidth="1.35" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

export function DensityToggle({
  density,
  onChange,
}: {
  density: RowDensity;
  onChange: (next: RowDensity) => void;
}) {
  return (
    <div className="at-density-group" role="group" aria-label="Row height density">
      {(["short", "medium", "tall"] as RowDensity[]).map((mode) => (
        <button
          key={mode}
          type="button"
          className={`at-density-btn ${density === mode ? "active" : ""}`}
          aria-pressed={density === mode}
          onClick={() => onChange(mode)}
          title={`Row height: ${mode}`}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );
}

export function SortableTh({
  label,
  icon,
  sortKey,
  activeSort,
  sortDir,
  onSort,
  className = "",
}: {
  label: string;
  icon: FieldIconType;
  sortKey?: string;
  activeSort?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  className?: string;
}) {
  const isSorted = sortKey && activeSort === sortKey;

  if (!sortKey || !onSort) {
    return (
      <th className={className}>
        <span className="at-th-inner">
          <FieldTypeIcon type={icon} />
          <span>{label}</span>
        </span>
      </th>
    );
  }

  return (
    <th
      className={className}
      aria-sort={
        isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        className={`at-sort-btn ${isSorted ? "is-sorted" : ""}`}
        onClick={() => onSort(sortKey)}
      >
        <FieldTypeIcon type={icon} />
        <span>{label}</span>
        <span className="at-sort-arrow" aria-hidden="true">
          {isSorted ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
