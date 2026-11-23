"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminContext";
import { GridViewBadge, SortableTh } from "@/components/admin/AirtableParts";

export default function AdminDashboardOverviewPage() {
  const { portal } = useAdmin();

  const { teachingCount, nonTeachingCount } = useMemo(() => {
    let teaching = 0;
    let nonTeaching = 0;
    for (const emp of portal?.employees ?? []) {
      if (emp.role_type === "Teaching") teaching += 1;
      else nonTeaching += 1;
    }
    return { teachingCount: teaching, nonTeachingCount: nonTeaching };
  }, [portal]);

  const pinnedCount = useMemo(
    () => (portal?.announcements ?? []).filter((a) => a.is_pinned).length,
    [portal]
  );

  const recentAnnouncements = (portal?.announcements ?? []).slice(0, 5);
  const recentEmployees = (portal?.employees ?? []).slice(0, 6);

  return (
    <>
      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <Link href="/admin/announcements" className="kpi-card">
          <span className="kpi-label">Announcements</span>
          <strong className="kpi-value">{portal?.announcements.length ?? 0}</strong>
          <span className="kpi-sub">{pinnedCount} pinned notice active</span>
        </Link>

        <Link href="/admin/events" className="kpi-card">
          <span className="kpi-label">Upcoming Events</span>
          <strong className="kpi-value">{portal?.events.length ?? 0}</strong>
          <span className="kpi-sub">Scheduled school activities</span>
        </Link>

        <Link href="/admin/statistics" className="kpi-card">
          <span className="kpi-label">School Statistics</span>
          <strong className="kpi-value">{portal?.statistics.length ?? 0}</strong>
          <span className="kpi-sub">Published K–6 metrics</span>
        </Link>

        <Link href="/admin/employees" className="kpi-card kpi-card-primary">
          <span className="kpi-label">Employee Profiles</span>
          <strong className="kpi-value">{portal?.employees.length ?? 0}</strong>
          <span className="kpi-sub">
            {teachingCount} Teaching &middot; {nonTeachingCount} Non-Teaching
          </span>
        </Link>
      </div>

      {/* Recent Announcements Airtable Grid */}
      <section className="table-panel">
        <div className="table-toolbar">
          <div className="table-filters">
            <GridViewBadge label="Recent Announcements" />
            <span className="table-panel-sub">
              Latest bulletins published on the {portal?.school.short_name || "school"} public portal
            </span>
          </div>
          <Link href="/admin/announcements" className="btn btn-primary btn-xs">
            Open Full Table &rarr;
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table density-medium">
            <thead>
              <tr>
                <th className="at-col-index">#</th>
                <SortableTh label="Title" icon="text" className="at-col-primary" />
                <SortableTh label="Category" icon="select" />
                <SortableTh label="Issuing Office" icon="text" />
                <SortableTh label="Published" icon="date" />
                <SortableTh label="Status" icon="status" />
              </tr>
            </thead>
            <tbody>
              {recentAnnouncements.map((item, idx) => (
                <tr key={item.id}>
                  <td className="at-col-index">{idx + 1}</td>
                  <td className="at-col-primary">
                    <div className="cell-primary">{item.title}</div>
                    <div className="cell-secondary">{item.excerpt}</div>
                  </td>
                  <td>
                    <span className="tag tag-soft">{item.category}</span>
                  </td>
                  <td>{item.office}</td>
                  <td className="cell-nowrap">{item.published_at}</td>
                  <td>
                    {item.is_pinned ? (
                      <span className="tag tag-solid">Pinned</span>
                    ) : (
                      <span className="tag tag-outline">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="at-grid-footer">
          <span>{recentAnnouncements.length} of {portal?.announcements.length ?? 0} records shown</span>
          <div className="at-footer-stats">
            <span>Pinned: <strong>{pinnedCount}</strong></span>
          </div>
        </div>
      </section>

      {/* Personnel Summary Airtable Grid */}
      <section className="table-panel">
        <div className="table-toolbar">
          <div className="table-filters">
            <GridViewBadge label="Employee Directory" />
            <span className="table-panel-sub">
              Active Teaching &amp; Non-Teaching profiles synced with Cloudflare D1 (SQLite)
            </span>
          </div>
          <Link href="/admin/employees" className="btn btn-primary btn-xs">
            Open Full Table &rarr;
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table density-medium">
            <thead>
              <tr>
                <th className="at-col-index">#</th>
                <SortableTh label="Employee" icon="user" className="at-col-primary" />
                <SortableTh label="Classification" icon="select" />
                <SortableTh label="Position & Department" icon="text" />
                <SortableTh label="Office" icon="location" />
                <SortableTh label="Tenure" icon="date" />
              </tr>
            </thead>
            <tbody>
              {recentEmployees.map((emp, idx) => (
                <tr key={emp.id}>
                  <td className="at-col-index">{idx + 1}</td>
                  <td className="at-col-primary">
                    <div className="table-user-cell">
                      <img
                        src={emp.photo_url || "/assets/staff-1.jpg"}
                        alt={emp.name}
                        width={34}
                        height={34}
                        className="table-avatar"
                      />
                      <div>
                        <div className="cell-primary">{emp.name}</div>
                        <div className="cell-secondary">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`tag ${
                        emp.role_type === "Teaching" ? "tag-solid" : "tag-outline"
                      }`}
                    >
                      {emp.role_type}
                    </span>
                  </td>
                  <td>
                    <div className="cell-primary">{emp.title}</div>
                    <div className="cell-secondary">{emp.department}</div>
                  </td>
                  <td>{emp.office}</td>
                  <td className="cell-nowrap">{emp.years_of_service}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="at-grid-footer">
          <span>{recentEmployees.length} of {portal?.employees.length ?? 0} employees shown</span>
          <div className="at-footer-stats">
            <span>Teaching: <strong>{teachingCount}</strong></span>
            <span>Non-Teaching: <strong>{nonTeachingCount}</strong></span>
          </div>
        </div>
      </section>
    </>
  );
}
