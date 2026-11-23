"use client";

import React, { useMemo, useState } from "react";
import { createEvent, deleteEvent, updateEvent } from "@/lib/api";
import type { CampusEvent } from "@/types/portal";
import { useAdmin } from "@/components/admin/AdminContext";
import { AdminModal } from "@/components/admin/AdminModal";
import {
  DensityToggle,
  GridViewBadge,
  SortableTh,
  type RowDensity,
} from "@/components/admin/AirtableParts";

const EMPTY_FORM = {
  title: "",
  category: "Academic",
  event_date: "2026-12-18",
  time_range: "8:00 AM – 12:00 PM",
  location: "ALNAVARROCES Covered Court",
  host: "Office of the Principal",
  description: "",
};

export default function AdminEventsPage() {
  const { portal, refreshData, setStatusMessage } = useAdmin();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [density, setDensity] = useState<RowDensity>("short");
  const [sortBy, setSortBy] = useState<string>("event_date");
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
    const filtered = (portal?.events ?? []).filter((ev) => {
      const matchCat = category === "all" || ev.category === category;
      const matchQ =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.host.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    return [...filtered].sort((a, b) => {
      const av = String(a[sortBy as keyof CampusEvent] ?? "").toLowerCase();
      const bv = String(b[sortBy as keyof CampusEvent] ?? "").toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [portal, search, category, sortBy, sortDir]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ev: CampusEvent) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      category: ev.category,
      event_date: ev.event_date,
      time_range: ev.time_range,
      location: ev.location,
      host: ev.host,
      description: ev.description,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateEvent(editingId, form);
        setStatusMessage("Campus event updated successfully.");
      } else {
        await createEvent(form);
        setStatusMessage("New campus event scheduled.");
      }
      setModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev: CampusEvent) => {
    if (!window.confirm(`Delete event "${ev.title}"?`)) return;
    try {
      await deleteEvent(ev.id);
      setStatusMessage(`Deleted "${ev.title}".`);
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
            <GridViewBadge label="Events Grid" />
            <input
              type="search"
              aria-label="Search upcoming events"
              className="form-input table-search"
              placeholder="Find in view…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter events by category"
              className="dept-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Event Types</option>
              <option value="Academic">Academic</option>
              <option value="Community">Community</option>
              <option value="Athletics">Athletics</option>
              <option value="Arts">Arts</option>
            </select>
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
                  label="Event Title"
                  icon="text"
                  sortKey="title"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="at-col-primary"
                />
                <SortableTh
                  label="Date"
                  icon="date"
                  sortKey="event_date"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Category"
                  icon="select"
                  sortKey="category"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Time"
                  icon="date"
                  sortKey="time_range"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Location"
                  icon="location"
                  sortKey="location"
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
                  <td colSpan={7} className="table-empty-cell">
                    No campus events match your filter.
                  </td>
                </tr>
              ) : (
                rows.map((ev, idx) => (
                  <tr key={ev.id}>
                    <td className="at-col-index">{idx + 1}</td>
                    <td className="at-col-primary">
                      <div className="cell-primary">{ev.title}</div>
                      <div className="cell-secondary">{ev.host}</div>
                    </td>
                    <td className="cell-nowrap">
                      <span className="tag tag-solid">
                        {ev.month_label} {ev.day_label}
                      </span>
                      <div className="cell-secondary" style={{ marginTop: 3 }}>
                        {ev.event_date}
                      </div>
                    </td>
                    <td>
                      <span className="tag tag-soft">{ev.category}</span>
                    </td>
                    <td className="cell-nowrap">{ev.time_range}</td>
                    <td>{ev.location}</td>
                    <td className="col-actions">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openEdit(ev)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => handleDelete(ev)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              <tr className="at-add-row">
                <td colSpan={7}>
                  <button
                    type="button"
                    className="at-add-row-btn"
                    onClick={openCreate}
                  >
                    <span>+</span>
                    <span>Add new campus event record</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="at-grid-footer">
          <span>{rows.length} event record(s)</span>
          <div className="at-footer-stats">
            <span>Sorted by: <strong>{sortBy}</strong> ({sortDir})</span>
          </div>
        </div>
      </section>

      <AdminModal
        open={modalOpen}
        eyebrow="Upcoming Events"
        title={editingId ? "Edit Campus Event" : "New Campus Event"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="evt-title" className="form-label">
              Event Title
            </label>
            <input
              id="evt-title"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="evt-category" className="form-label">
                Category
              </label>
              <select
                id="evt-category"
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Academic">Academic</option>
                <option value="Community">Community</option>
                <option value="Athletics">Athletics</option>
                <option value="Arts">Arts</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="evt-date" className="form-label">
                Event Date
              </label>
              <input
                id="evt-date"
                type="date"
                className="form-input"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="evt-time" className="form-label">
                Time Range
              </label>
              <input
                id="evt-time"
                className="form-input"
                value={form.time_range}
                onChange={(e) => setForm({ ...form, time_range: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="evt-location" className="form-label">
                Location
              </label>
              <input
                id="evt-location"
                className="form-input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="evt-host" className="form-label">
              Host Office / Committee
            </label>
            <input
              id="evt-host"
              className="form-input"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="evt-description" className="form-label">
              Description
            </label>
            <textarea
              id="evt-description"
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="modal-actions-row">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Event" : "Schedule Event"}
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
