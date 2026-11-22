"use client";

import React, { useMemo, useState } from "react";
import { createStatistic, deleteStatistic, updateStatistic } from "@/lib/api";
import type { SchoolStat } from "@/types/portal";
import { useAdmin } from "@/components/admin/AdminContext";
import { AdminModal } from "@/components/admin/AdminModal";
import {
  DensityToggle,
  GridViewBadge,
  SortableTh,
  type RowDensity,
} from "@/components/admin/AirtableParts";

const EMPTY_FORM = {
  label: "",
  numeric_target: "100",
  decimals: "0",
  suffix: "+",
  subtitle: "",
  icon: "students",
  sort_order: "7",
};

export default function AdminStatisticsPage() {
  const { portal, refreshData, setStatusMessage } = useAdmin();

  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<RowDensity>("medium");
  const [sortBy, setSortBy] = useState<string>("sort_order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (portal?.statistics ?? []).filter(
      (s) =>
        !q ||
        s.label.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q)
    );

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "sort_order" || sortBy === "numeric_target") {
        cmp = Number(a[sortBy]) - Number(b[sortBy]);
      } else {
        const av = String(a[sortBy as keyof SchoolStat] ?? "").toLowerCase();
        const bv = String(b[sortBy as keyof SchoolStat] ?? "").toLowerCase();
        cmp = av.localeCompare(bv);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [portal, search, sortBy, sortDir]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      sort_order: String((portal?.statistics.length ?? 0) + 1),
    });
    setModalOpen(true);
  };

  const openEdit = (s: SchoolStat) => {
    setEditingId(s.id);
    setForm({
      label: s.label,
      numeric_target: String(s.numeric_target),
      decimals: String(s.decimals),
      suffix: s.suffix ?? "",
      subtitle: s.subtitle,
      icon: s.icon,
      sort_order: String(s.sort_order),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        label: form.label,
        numeric_target: Number(form.numeric_target),
        decimals: Number(form.decimals),
        suffix: form.suffix || null,
        subtitle: form.subtitle,
        icon: form.icon,
        sort_order: Number(form.sort_order),
      };
      if (editingId) {
        await updateStatistic(editingId, payload);
        setStatusMessage("School statistic updated.");
      } else {
        await createStatistic(payload);
        setStatusMessage("New school statistic added.");
      }
      setModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Failed to save statistic."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: SchoolStat) => {
    if (!window.confirm(`Delete statistic "${s.label}"?`)) return;
    try {
      await deleteStatistic(s.id);
      setStatusMessage(`Deleted "${s.label}".`);
      await refreshData();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <>
      <section className="table-panel">
        <div className="table-toolbar">
          <div className="table-filters">
            <GridViewBadge label="Statistics Grid" />
            <input
              type="search"
              aria-label="Search school statistics"
              className="form-input table-search"
              placeholder="Find in view…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-toolbar-actions">
            <DensityToggle density={density} onChange={setDensity} />
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              + Add Record
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className={`data-table density-${density}`}>
            <thead>
              <tr>
                <th className="at-col-index">#</th>
                <SortableTh
                  label="Metric Label"
                  icon="text"
                  sortKey="label"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="at-col-primary"
                />
                <SortableTh
                  label="Order"
                  icon="number"
                  sortKey="sort_order"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Display Value"
                  icon="number"
                  sortKey="numeric_target"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Icon"
                  icon="select"
                  sortKey="icon"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh label="Actions" icon="actions" className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty-cell">
                    No school statistics found.
                  </td>
                </tr>
              ) : (
                rows.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="at-col-index">{idx + 1}</td>
                    <td className="at-col-primary">
                      <div className="cell-primary">{s.label}</div>
                      <div className="cell-secondary">{s.subtitle}</div>
                    </td>
                    <td className="cell-nowrap">#{s.sort_order}</td>
                    <td className="cell-nowrap">
                      <strong className="table-stat-figure">
                        {s.decimals > 0
                          ? s.numeric_target.toFixed(s.decimals)
                          : s.numeric_target.toLocaleString()}
                        {s.suffix ?? ""}
                      </strong>
                    </td>
                    <td>
                      <span className="tag tag-soft">{s.icon}</span>
                    </td>
                    <td className="col-actions">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => handleDelete(s)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              <tr className="at-add-row">
                <td colSpan={6}>
                  <button
                    type="button"
                    className="at-add-row-btn"
                    onClick={openCreate}
                  >
                    <span>+</span>
                    <span>Add new school statistic record</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="at-grid-footer">
          <span>{rows.length} metric record(s)</span>
          <div className="at-footer-stats">
            <span>Sorted by: <strong>{sortBy}</strong> ({sortDir})</span>
          </div>
        </div>
      </section>

      <AdminModal
        open={modalOpen}
        eyebrow="School Statistics"
        title={editingId ? "Edit Statistic" : "Add School Statistic"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="stat-label" className="form-label">
              Metric Label
            </label>
            <input
              id="stat-label"
              className="form-input"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="stat-target" className="form-label">
                Target Number
              </label>
              <input
                id="stat-target"
                type="number"
                step="0.1"
                className="form-input"
                value={form.numeric_target}
                onChange={(e) =>
                  setForm({ ...form, numeric_target: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="stat-suffix" className="form-label">
                Suffix (e.g. +, %, :1, K)
              </label>
              <input
                id="stat-suffix"
                className="form-input"
                value={form.suffix}
                onChange={(e) => setForm({ ...form, suffix: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="stat-decimals" className="form-label">
                Decimals
              </label>
              <select
                id="stat-decimals"
                className="form-input"
                value={form.decimals}
                onChange={(e) => setForm({ ...form, decimals: e.target.value })}
              >
                <option value="0">0</option>
                <option value="1">1</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="stat-order" className="form-label">
                Display Order
              </label>
              <input
                id="stat-order"
                type="number"
                min="0"
                className="form-input"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="stat-icon" className="form-label">
              Icon
            </label>
            <select
              id="stat-icon"
              className="form-input"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            >
              <option value="students">Students</option>
              <option value="graduation">Completion / Graduation</option>
              <option value="ratio">Learner–Teacher Ratio</option>
              <option value="staff">Staff</option>
              <option value="clubs">Clubs &amp; Teams</option>
              <option value="library">Library &amp; Resources</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="stat-subtitle" className="form-label">
              Subtitle
            </label>
            <input
              id="stat-subtitle"
              className="form-input"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              required
            />
          </div>
          <div className="modal-actions-row">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Metric" : "Add Metric"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
