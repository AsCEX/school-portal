"use client";

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { AdminModal } from "@/components/admin/AdminModal";
import {
  DensityToggle,
  GridViewBadge,
  SortableTh,
  type RowDensity,
} from "@/components/admin/AirtableParts";
import { createSchool, deleteSchool, updateSchool } from "@/lib/api";
import type { SchoolInfo } from "@/types/portal";

type SchoolFormState = Omit<SchoolInfo, "id">;

const EMPTY_FORM: SchoolFormState = {
  slug: "",
  school_code: "",
  short_name: "",
  name: "",
  tagline: "",
  grade_levels: "Kindergarten to Grade 6",
  hero_description: "",
  hero_image_url: "/assets/campus-hero.jpg",
  logo_url: "",
  primary_color: "#07187C",
  primary_dark_color: "#041246",
  academic_year: "SY 2026–2027",
  current_term: "Second Quarter · Active",
  admissions_status: "Early Enrollment Open",
  campus_hours: "Mon–Fri, 7:00 AM – 4:30 PM",
  phone: "",
  email: "",
  address: "",
  custom_domain: "",
  is_default: false,
  is_active: true,
};

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export default function AdminSchoolsPage() {
  const {
    user,
    portal,
    activeSchoolSlug,
    selectSchool,
    refreshData,
    setStatusMessage,
  } = useAdmin();

  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<RowDensity>("short");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolInfo | null>(null);
  const [form, setForm] = useState<SchoolFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const schools = useMemo(() => portal?.schools ?? [], [portal]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.short_name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.school_code ?? "").toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [schools, search]);

  const activeCount = useMemo(
    () => schools.filter((s) => s.is_active).length,
    [schools]
  );

  const isAdmin = user?.role === "admin";

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (school: SchoolInfo) => {
    setEditing(school);
    setForm({
      slug: school.slug,
      school_code: school.school_code ?? "",
      short_name: school.short_name,
      name: school.name,
      tagline: school.tagline,
      grade_levels: school.grade_levels,
      hero_description: school.hero_description,
      hero_image_url: school.hero_image_url,
      logo_url: school.logo_url ?? "",
      primary_color: school.primary_color,
      primary_dark_color: school.primary_dark_color,
      academic_year: school.academic_year,
      current_term: school.current_term,
      admissions_status: school.admissions_status,
      campus_hours: school.campus_hours,
      phone: school.phone,
      email: school.email,
      address: school.address,
      custom_domain: school.custom_domain ?? "",
      is_default: school.is_default,
      is_active: school.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload: SchoolFormState = {
        ...form,
        slug: form.slug.trim().toLowerCase(),
        school_code: form.school_code?.trim() || null,
        logo_url: form.logo_url?.trim() || null,
        custom_domain: form.custom_domain?.trim().toLowerCase() || null,
      };
      if (editing) {
        const { data } = await updateSchool(editing.id, payload);
        setStatusMessage(`Updated school profile "${data.name}".`);
        await refreshData(
          activeSchoolSlug === editing.slug ? data.slug : activeSchoolSlug
        );
      } else {
        const { data } = await createSchool(payload);
        setStatusMessage(
          `Registered "${data.name}". Switch to it in the sidebar to add its announcements, events, stats, and staff.`
        );
        await refreshData(data.slug);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (school: SchoolInfo) => {
    if (
      !window.confirm(
        `Delete "${school.name}" and ALL of its announcements, events, statistics, and staff records?`
      )
    ) {
      return;
    }
    try {
      await deleteSchool(school.id);
      setStatusMessage(`Deleted school "${school.name}".`);
      await refreshData(null);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Unable to delete school."
      );
    }
  };

  return (
    <>
      <section className="table-panel">
        <div className="table-toolbar">
          <div className="table-filters">
            <GridViewBadge label="Schools & Profiles" />
            <input
              type="search"
              className="form-input table-search"
              placeholder="Search schools by name, slug, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-toolbar-right">
            <DensityToggle density={density} onChange={setDensity} />
            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openCreate}
              >
                + Add School
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className={`data-table density-${density}`}>
            <thead>
              <tr>
                <th className="at-col-index">#</th>
                <SortableTh
                  label="School Name & Slug"
                  icon="text"
                  className="at-col-primary"
                />
                <SortableTh label="School ID" icon="number" />
                <SortableTh label="Academic Year & Term" icon="date" />
                <SortableTh label="Contact & Domain" icon="location" />
                <SortableTh label="Theme" icon="select" />
                <SortableTh label="Status" icon="status" />
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((school, idx) => {
                const isSelected = school.slug === activeSchoolSlug;
                const publicUrl = school.is_default
                  ? "/"
                  : `/?school=${encodeURIComponent(school.slug)}`;
                return (
                  <tr key={school.id}>
                    <td className="at-col-index">{idx + 1}</td>
                    <td className="at-col-primary">
                      <div className="cell-primary">
                        {school.short_name} — {school.name}
                      </div>
                      <div className="cell-secondary">
                        slug: <code>{school.slug}</code> &middot;{" "}
                        {school.grade_levels}
                      </div>
                    </td>
                    <td className="cell-nowrap">
                      {school.school_code || "—"}
                    </td>
                    <td>
                      <div className="cell-primary">{school.academic_year}</div>
                      <div className="cell-secondary">{school.current_term}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{school.phone}</div>
                      <div className="cell-secondary">
                        {school.custom_domain || school.email}
                      </div>
                    </td>
                    <td className="cell-nowrap">
                      <span
                        className="school-color-swatch"
                        style={{ backgroundColor: school.primary_color }}
                        title={`Primary: ${school.primary_color}`}
                      />
                      <span
                        className="school-color-swatch"
                        style={{ backgroundColor: school.primary_dark_color }}
                        title={`Dark: ${school.primary_dark_color}`}
                      />
                    </td>
                    <td className="cell-nowrap">
                      {school.is_default && (
                        <span className="tag tag-solid" style={{ marginRight: 6 }}>
                          Default
                        </span>
                      )}
                      {school.is_active ? (
                        <span className="tag tag-soft">Active</span>
                      ) : (
                        <span className="tag tag-outline">Hidden</span>
                      )}
                    </td>
                    <td className="td-actions">
                      <div className="row-actions">
                        {!isSelected ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => selectSchool(school.slug)}
                          >
                            Manage
                          </button>
                        ) : (
                          <span className="tag tag-outline">Selected</span>
                        )}
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-xs"
                        >
                          View &nearr;
                        </a>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openEdit(school)}
                        >
                          Edit
                        </button>
                        {isAdmin && schools.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDelete(school)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-empty">
                    No schools match your search.
                  </td>
                </tr>
              )}
              {isAdmin && (
                <tr className="at-add-row">
                  <td colSpan={8}>
                    <button
                      type="button"
                      className="at-add-row-btn"
                      onClick={openCreate}
                    >
                      + Add school
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="at-grid-footer">
          <span>
            {filtered.length} {filtered.length === 1 ? "school" : "schools"}
          </span>
          <div className="at-footer-stats">
            <span>
              Active: <strong>{activeCount}</strong>
            </span>
            <span>
              Portal URL pattern: <code>/?school=&lt;slug&gt;</code>
            </span>
          </div>
        </div>
      </section>

      <AdminModal
        open={modalOpen}
        eyebrow="School Configuration"
        title={editing ? `Edit School — ${editing.short_name}` : "Register New School"}
        onClose={() => setModalOpen(false)}
      >
        <p className="modal-sub">
          School details are stored in Cloudflare D1 and power the public portal,
          branding colors, hero section, and contact footer.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-short-name" className="form-label">
                Short Name / Acronym
              </label>
              <input
                id="school-short-name"
                className="form-input"
                placeholder="e.g. ALNAVARROCES"
                value={form.short_name}
                onChange={(e) => {
                  const nextShort = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    short_name: nextShort,
                    slug: editing ? prev.slug : toSlug(nextShort),
                  }));
                }}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-slug" className="form-label">
                URL Slug
              </label>
              <input
                id="school-slug"
                className="form-input"
                placeholder="e.g. alnavarroces"
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value.toLowerCase() })
                }
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-name" className="form-label">
                Official School Name
              </label>
              <input
                id="school-name"
                className="form-input"
                placeholder="e.g. A.L. Navarro Central Elementary School"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-code" className="form-label">
                DepEd / School ID (Optional)
              </label>
              <input
                id="school-code"
                className="form-input"
                placeholder="e.g. 129652"
                value={form.school_code ?? ""}
                onChange={(e) =>
                  setForm({ ...form, school_code: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-tagline" className="form-label">
                Portal Tagline
              </label>
              <input
                id="school-tagline"
                className="form-input"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-grades" className="form-label">
                Grade Levels
              </label>
              <input
                id="school-grades"
                className="form-input"
                placeholder="Kindergarten to Grade 6"
                value={form.grade_levels}
                onChange={(e) =>
                  setForm({ ...form, grade_levels: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="school-hero-desc" className="form-label">
              Hero Banner Description
            </label>
            <textarea
              id="school-hero-desc"
              className="form-input"
              rows={3}
              value={form.hero_description}
              onChange={(e) =>
                setForm({ ...form, hero_description: e.target.value })
              }
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-hero-img" className="form-label">
                Hero Image URL
              </label>
              <input
                id="school-hero-img"
                className="form-input"
                value={form.hero_image_url}
                onChange={(e) =>
                  setForm({ ...form, hero_image_url: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-domain" className="form-label">
                Custom Domain (Optional)
              </label>
              <input
                id="school-domain"
                className="form-input"
                placeholder="e.g. alnavarroces.edu.ph"
                value={form.custom_domain ?? ""}
                onChange={(e) =>
                  setForm({ ...form, custom_domain: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-primary-color" className="form-label">
                Primary Brand Color
              </label>
              <input
                id="school-primary-color"
                className="form-input"
                placeholder="#07187C"
                value={form.primary_color}
                onChange={(e) =>
                  setForm({ ...form, primary_color: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-dark-color" className="form-label">
                Primary Dark Color
              </label>
              <input
                id="school-dark-color"
                className="form-input"
                placeholder="#041246"
                value={form.primary_dark_color}
                onChange={(e) =>
                  setForm({ ...form, primary_dark_color: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-ay" className="form-label">
                Academic Year
              </label>
              <input
                id="school-ay"
                className="form-input"
                value={form.academic_year}
                onChange={(e) =>
                  setForm({ ...form, academic_year: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-term" className="form-label">
                Current Term
              </label>
              <input
                id="school-term"
                className="form-input"
                value={form.current_term}
                onChange={(e) =>
                  setForm({ ...form, current_term: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-admissions" className="form-label">
                Admissions Status
              </label>
              <input
                id="school-admissions"
                className="form-input"
                value={form.admissions_status}
                onChange={(e) =>
                  setForm({ ...form, admissions_status: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-hours" className="form-label">
                Campus Office Hours
              </label>
              <input
                id="school-hours"
                className="form-input"
                value={form.campus_hours}
                onChange={(e) =>
                  setForm({ ...form, campus_hours: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="school-phone" className="form-label">
                Phone
              </label>
              <input
                id="school-phone"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="school-email" className="form-label">
                Official Email
              </label>
              <input
                id="school-email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="school-address" className="form-label">
              Campus Address
            </label>
            <input
              id="school-address"
              className="form-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) =>
                  setForm({ ...form, is_default: e.target.checked })
                }
              />
              Set as default school portal
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              Active / visible publicly
            </label>
          </div>

          {formError && <div className="feedback-box">{formError}</div>}

          <div className="modal-actions-row">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : editing
                  ? "Save School Details"
                  : "Create School"}
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
