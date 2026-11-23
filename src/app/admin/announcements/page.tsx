"use client";

import React, { useMemo, useState } from "react";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/lib/api";
import type { Announcement } from "@/types/portal";
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
  category: "Important",
  is_pinned: false,
  published_at: "2026-11-22",
  office: "Office of the Principal",
  excerpt: "",
  body: "",
};

export default function AdminAnnouncementsPage() {
  const { portal, refreshData, setStatusMessage } = useAdmin();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [density, setDensity] = useState<RowDensity>("short");
  const [sortBy, setSortBy] = useState<string>("published_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
    const filtered = (portal?.announcements ?? []).filter((item) => {
      const matchCat = category === "all" || item.category === category;
      const matchQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.office.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "is_pinned") {
        cmp = Number(a.is_pinned) - Number(b.is_pinned);
      } else {
        const av = String(a[sortBy as keyof Announcement] ?? "").toLowerCase();
        const bv = String(b[sortBy as keyof Announcement] ?? "").toLowerCase();
        cmp = av.localeCompare(bv);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [portal, search, category, sortBy, sortDir]);

  const pinnedCount = useMemo(
    () => rows.filter((r) => r.is_pinned).length,
    [rows]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      is_pinned: item.is_pinned,
      published_at: item.published_at,
      office: item.office,
      excerpt: item.excerpt,
      body: item.body,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, form);
        setStatusMessage("Announcement updated successfully.");
      } else {
        await createAnnouncement(form);
        setStatusMessage("Announcement published.");
      }
      setModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Failed to save announcement."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteAnnouncement(item.id);
      setStatusMessage(`Deleted "${item.title}".`);
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
            <GridViewBadge label="Announcements Grid" />
            <input
              type="search"
              aria-label="Search announcements"
              className="form-input table-search"
              placeholder="Find in view…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter announcements by category"
              className="dept-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Important">Important</option>
              <option value="Academics">Academics</option>
              <option value="Admissions">Admissions</option>
              <option value="Campus Life">Campus Life</option>
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
                  label="Title"
                  icon="text"
                  sortKey="title"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="at-col-primary"
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
                  label="Issuing Office"
                  icon="text"
                  sortKey="office"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Published"
                  icon="date"
                  sortKey="published_at"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Status"
                  icon="status"
                  sortKey="is_pinned"
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
                    No announcements match your search.
                  </td>
                </tr>
              ) : (
                rows.map((item, idx) => (
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
                    <td className="col-actions">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => handleDelete(item)}
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
                    <span>Add new announcement record</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="at-grid-footer">
          <span>{rows.length} record(s)</span>
          <div className="at-footer-stats">
            <span>Pinned: <strong>{pinnedCount}</strong></span>
            <span>Standard: <strong>{rows.length - pinnedCount}</strong></span>
          </div>
        </div>
      </section>

      <AdminModal
        open={modalOpen}
        eyebrow="Announcements"
        title={editingId ? "Edit Announcement" : "New Announcement"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ann-title" className="form-label">
              Title
            </label>
            <input
              id="ann-title"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="ann-category" className="form-label">
                Category
              </label>
              <select
                id="ann-category"
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Important">Important</option>
                <option value="Academics">Academics</option>
                <option value="Admissions">Admissions</option>
                <option value="Campus Life">Campus Life</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ann-published-at" className="form-label">
                Publish Date
              </label>
              <input
                id="ann-published-at"
                type="date"
                className="form-input"
                value={form.published_at}
                onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="ann-office" className="form-label">
              Issuing Office
            </label>
            <input
              id="ann-office"
              className="form-input"
              value={form.office}
              onChange={(e) => setForm({ ...form, office: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="ann-pinned" className="form-checkbox-label">
              <input
                id="ann-pinned"
                type="checkbox"
                checked={form.is_pinned}
                onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              />
              Pin notice to top of public portal
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="ann-excerpt" className="form-label">
              Short Excerpt
            </label>
            <textarea
              id="ann-excerpt"
              className="form-textarea"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="ann-body" className="form-label">
              Full Notice Body
            </label>
            <textarea
              id="ann-body"
              className="form-textarea"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>
          <div className="modal-actions-row">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Notice" : "Publish Notice"}
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
