"use client";

import React, { useMemo, useState } from "react";
import {
  assignEmployeeAccount,
  createEmployee,
  deleteEmployee,
  revokeEmployeeAccount,
  updateEmployee,
} from "@/lib/api";
import {
  ALL_ADMIN_PERMISSIONS,
  type AdminPermission,
  type Employee,
} from "@/types/portal";
import { useAdmin } from "@/components/admin/AdminContext";
import { AdminModal } from "@/components/admin/AdminModal";
import {
  DensityToggle,
  GridViewBadge,
  SortableTh,
  type RowDensity,
} from "@/components/admin/AirtableParts";

const PORTRAIT_OPTIONS = [
  "/assets/staff-1.jpg",
  "/assets/staff-2.jpg",
  "/assets/staff-3.jpg",
  "/assets/staff-4.jpg",
  "/assets/staff-5.jpg",
  "/assets/staff-6.jpg",
  "/assets/staff-7.jpg",
  "/assets/staff-8.jpg",
];

const ROLE_DEFAULT_PERMISSIONS: Record<
  "admin" | "faculty" | "student" | "parent",
  AdminPermission[]
> = {
  admin: ALL_ADMIN_PERMISSIONS.map((p) => p.key),
  faculty: ["manage_announcements", "manage_events", "manage_statistics"],
  student: [],
  parent: [],
};

const EMPTY_FORM = {
  name: "",
  role_type: "Teaching" as "Teaching" | "Non-Teaching",
  title: "",
  department: "Primary Grades",
  photo_url: "/assets/staff-1.jpg",
  years_of_service: "5 yrs at school",
  email: "",
  office: "Academic Building, Room 101",
  office_hours: "Mon–Fri, 2:00 PM – 4:00 PM",
  education: "",
  summary: "",
  bio: "",
};

interface AccountFormState {
  email: string;
  password: string;
  role: "admin" | "faculty" | "student" | "parent";
  permissions: AdminPermission[];
  is_active: boolean;
  all_schools: boolean;
}

const EMPTY_ACCOUNT_FORM: AccountFormState = {
  email: "",
  password: "",
  role: "faculty",
  permissions: [...ROLE_DEFAULT_PERMISSIONS.faculty],
  is_active: true,
  all_schools: false,
};

export default function AdminEmployeesPage() {
  const { user, hasPermission, portal, refreshData, setStatusMessage } =
    useAdmin();

  const canManageEmployees = hasPermission("manage_employees");
  const canManageAccounts = hasPermission("manage_accounts");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "Teaching" | "Non-Teaching"
  >("all");
  const [density, setDensity] = useState<RowDensity>("short");
  const [sortBy, setSortBy] = useState<string>("role_type");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Employee Login & RBAC Permissions Modal
  const [accountModalEmployee, setAccountModalEmployee] =
    useState<Employee | null>(null);
  const [accountForm, setAccountForm] =
    useState<AccountFormState>(EMPTY_ACCOUNT_FORM);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

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
    const filtered = (portal?.employees ?? []).filter((emp) => {
      const matchRole = roleFilter === "all" || emp.role_type === roleFilter;
      const matchQ =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.title.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.account?.email ?? "").toLowerCase().includes(q);
      return matchRole && matchQ;
    });

    return [...filtered].sort((a, b) => {
      const av = String(a[sortBy as keyof Employee] ?? "").toLowerCase();
      const bv = String(b[sortBy as keyof Employee] ?? "").toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [portal, search, roleFilter, sortBy, sortDir]);

  const { teachingCount, nonTeachingCount, loginCount } = useMemo(() => {
    let teaching = 0;
    let nonTeaching = 0;
    let logins = 0;
    for (const emp of rows) {
      if (emp.role_type === "Teaching") teaching += 1;
      else nonTeaching += 1;
      if (emp.account) logins += 1;
    }
    return {
      teachingCount: teaching,
      nonTeachingCount: nonTeaching,
      loginCount: logins,
    };
  }, [rows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      role_type: emp.role_type,
      title: emp.title,
      department: emp.department,
      photo_url: emp.photo_url || "/assets/staff-1.jpg",
      years_of_service: emp.years_of_service,
      email: emp.email,
      office: emp.office,
      office_hours: emp.office_hours,
      education: emp.education,
      summary: emp.summary,
      bio: emp.bio,
    });
    setModalOpen(true);
  };

  const openAccountModal = (emp: Employee) => {
    setAccountModalEmployee(emp);
    setAccountError(null);
    if (emp.account) {
      setAccountForm({
        email: emp.account.email,
        password: "",
        role: emp.account.role,
        permissions: [...emp.account.permissions],
        is_active: emp.account.is_active,
        all_schools: emp.account.school_id === null,
      });
    } else {
      setAccountForm({
        email: emp.email,
        password: "",
        role: "faculty",
        permissions: [...ROLE_DEFAULT_PERMISSIONS.faculty],
        is_active: true,
        all_schools: false,
      });
    }
  };

  const handleRoleChange = (
    nextRole: "admin" | "faculty" | "student" | "parent"
  ) => {
    setAccountForm((prev) => ({
      ...prev,
      role: nextRole,
      permissions: [...ROLE_DEFAULT_PERMISSIONS[nextRole]],
      all_schools: nextRole === "admin" ? prev.all_schools : false,
    }));
  };

  const togglePermission = (perm: AdminPermission) => {
    setAccountForm((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm],
      };
    });
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountModalEmployee) return;
    setSavingAccount(true);
    setAccountError(null);
    try {
      const payload = {
        email: accountForm.email.trim(),
        ...(accountForm.password ? { password: accountForm.password } : {}),
        role: accountForm.role,
        permissions: accountForm.permissions,
        is_active: accountForm.is_active,
        all_schools: accountForm.all_schools,
      };
      await assignEmployeeAccount(accountModalEmployee.id, payload);
      setStatusMessage(
        accountModalEmployee.account
          ? `Updated login & permissions for ${accountModalEmployee.name}.`
          : `Assigned login account to ${accountModalEmployee.name}.`
      );
      setAccountModalEmployee(null);
      await refreshData();
    } catch (err) {
      setAccountError(
        err instanceof Error
          ? err.message
          : "Unable to save employee login settings."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleRevokeAccount = async () => {
    if (!accountModalEmployee?.account) return;
    if (
      !window.confirm(
        `Revoke login access for "${accountModalEmployee.name}" (${accountModalEmployee.account.email})? Their employee directory profile will remain intact.`
      )
    ) {
      return;
    }
    setSavingAccount(true);
    setAccountError(null);
    try {
      await revokeEmployeeAccount(accountModalEmployee.id);
      setStatusMessage(`Revoked login access for ${accountModalEmployee.name}.`);
      setAccountModalEmployee(null);
      await refreshData();
    } catch (err) {
      setAccountError(
        err instanceof Error ? err.message : "Unable to revoke employee login."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateEmployee(editingId, form);
        setStatusMessage("Employee profile updated.");
      } else {
        await createEmployee(form);
        setStatusMessage("New employee profile added.");
      }
      setModalOpen(false);
      await refreshData();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Failed to save employee profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`Delete employee profile "${emp.name}"?`)) return;
    try {
      await deleteEmployee(emp.id);
      setStatusMessage(`Deleted "${emp.name}".`);
      await refreshData();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const totalCols = canManageAccounts ? 8 : 7;

  return (
    <>
      <section className="table-panel">
        <div className="table-toolbar">
          <div className="table-filters">
            <GridViewBadge label="Employees Grid" />
            <input
              type="search"
              aria-label="Search employee profiles"
              className="form-input table-search"
              placeholder="Find in view…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter employees by teaching or non-teaching classification"
              className="dept-select"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value as "all" | "Teaching" | "Non-Teaching"
                )
              }
            >
              <option value="all">All Classifications</option>
              <option value="Teaching">Teaching Faculty</option>
              <option value="Non-Teaching">Non-Teaching Staff</option>
            </select>
          </div>
          <div className="table-toolbar-actions">
            <DensityToggle density={density} onChange={setDensity} />
            {canManageEmployees && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openCreate}
              >
                + Add Record
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
                  label="Employee"
                  icon="user"
                  sortKey="name"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="at-col-primary"
                />
                <SortableTh
                  label="Classification"
                  icon="select"
                  sortKey="role_type"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Position & Department"
                  icon="text"
                  sortKey="department"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Office & Hours"
                  icon="location"
                  sortKey="office"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Tenure"
                  icon="date"
                  sortKey="years_of_service"
                  activeSort={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                {canManageAccounts && (
                  <SortableTh label="Login & Role" icon="status" />
                )}
                <SortableTh
                  label="Actions"
                  icon="actions"
                  className="col-actions"
                />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="table-empty-cell">
                    No employee profiles match your filter.
                  </td>
                </tr>
              ) : (
                rows.map((emp, idx) => (
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
                          emp.role_type === "Teaching"
                            ? "tag-solid"
                            : "tag-outline"
                        }`}
                      >
                        {emp.role_type}
                      </span>
                    </td>
                    <td>
                      <div className="cell-primary">{emp.title}</div>
                      <div className="cell-secondary">{emp.department}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{emp.office}</div>
                      <div className="cell-secondary">{emp.office_hours}</div>
                    </td>
                    <td className="cell-nowrap">{emp.years_of_service}</td>
                    {canManageAccounts && (
                      <td className="cell-nowrap">
                        {emp.account ? (
                          <div>
                            <span
                              className={`tag ${
                                !emp.account.is_active
                                  ? "tag-outline"
                                  : emp.account.role === "admin"
                                    ? "tag-solid"
                                    : "tag-soft"
                              }`}
                            >
                              {emp.account.role.toUpperCase()}
                              {!emp.account.is_active ? " · Disabled" : ""}
                            </span>
                            <div className="cell-secondary">
                              {emp.account.email} &middot;{" "}
                              {emp.account.permissions.length} perm
                              {emp.account.permissions.length === 1 ? "" : "s"}
                            </div>
                          </div>
                        ) : (
                          <span className="tag tag-outline">No login</span>
                        )}
                      </td>
                    )}
                    <td className="col-actions">
                      <div className="table-actions">
                        {canManageAccounts && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => openAccountModal(emp)}
                          >
                            {emp.account ? "Access" : "Assign Login"}
                          </button>
                        )}
                        {canManageEmployees && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => openEdit(emp)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-xs"
                              onClick={() => handleDelete(emp)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {canManageEmployees && (
                <tr className="at-add-row">
                  <td colSpan={totalCols}>
                    <button
                      type="button"
                      className="at-add-row-btn"
                      onClick={openCreate}
                    >
                      <span>+</span>
                      <span>Add new employee profile record</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="at-grid-footer">
          <span>{rows.length} employee record(s)</span>
          <div className="at-footer-stats">
            <span>
              Teaching: <strong>{teachingCount}</strong>
            </span>
            <span>
              Non-Teaching: <strong>{nonTeachingCount}</strong>
            </span>
            {canManageAccounts && (
              <span>
                Assigned Logins: <strong>{loginCount}</strong>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Employee Directory Profile Modal */}
      <AdminModal
        open={modalOpen}
        eyebrow="Employee Profiles"
        title={editingId ? "Edit Employee Profile" : "Add Employee Profile"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="emp-name" className="form-label">
                Full Name
              </label>
              <input
                id="emp-name"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-role-type" className="form-label">
                Classification
              </label>
              <select
                id="emp-role-type"
                className="form-input"
                value={form.role_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role_type: e.target.value as "Teaching" | "Non-Teaching",
                  })
                }
              >
                <option value="Teaching">Teaching</option>
                <option value="Non-Teaching">Non-Teaching</option>
              </select>
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="emp-title" className="form-label">
                Position / Title
              </label>
              <input
                id="emp-title"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-department" className="form-label">
                Department
              </label>
              <input
                id="emp-department"
                className="form-input"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="emp-email" className="form-label">
                Email
              </label>
              <input
                id="emp-email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-photo" className="form-label">
                Portrait Photo
              </label>
              <select
                id="emp-photo"
                className="form-input"
                value={form.photo_url}
                onChange={(e) =>
                  setForm({ ...form, photo_url: e.target.value })
                }
              >
                {PORTRAIT_OPTIONS.map((url, idx) => (
                  <option key={url} value={url}>
                    Portrait {idx + 1} ({url})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="emp-years" className="form-label">
                Years of Service
              </label>
              <input
                id="emp-years"
                className="form-input"
                value={form.years_of_service}
                onChange={(e) =>
                  setForm({ ...form, years_of_service: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-office" className="form-label">
                Office Room
              </label>
              <input
                id="emp-office"
                className="form-input"
                value={form.office}
                onChange={(e) => setForm({ ...form, office: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="emp-hours" className="form-label">
                Office Hours
              </label>
              <input
                id="emp-hours"
                className="form-input"
                value={form.office_hours}
                onChange={(e) =>
                  setForm({ ...form, office_hours: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-education" className="form-label">
                Education
              </label>
              <input
                id="emp-education"
                className="form-input"
                value={form.education}
                onChange={(e) =>
                  setForm({ ...form, education: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="emp-summary" className="form-label">
              Short Card Summary
            </label>
            <textarea
              id="emp-summary"
              className="form-textarea"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="emp-bio" className="form-label">
              Full Biography
            </label>
            <textarea
              id="emp-bio"
              className="form-textarea"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              required
            />
          </div>
          <div className="modal-actions-row">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Update Profile" : "Add Employee"}
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

      {/* Assign Employee Login & Roles/Permissions Modal */}
      <AdminModal
        open={accountModalEmployee !== null}
        eyebrow="Access Control & RBAC"
        title={
          accountModalEmployee
            ? `Login & Permissions — ${accountModalEmployee.name}`
            : "Assign Employee Login"
        }
        onClose={() => setAccountModalEmployee(null)}
      >
        <p className="modal-sub">
          Assign login credentials and pick the exact role and permissions this
          employee can access in the Admin Console.
        </p>

        <form onSubmit={handleSaveAccount}>
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="acct-email" className="form-label">
                Login Email
              </label>
              <input
                id="acct-email"
                type="email"
                className="form-input"
                placeholder="employee@school.edu.ph"
                value={accountForm.email}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="acct-password" className="form-label">
                {accountModalEmployee?.account
                  ? "New Password (Optional)"
                  : "Initial Password (Min 8 chars)"}
              </label>
              <input
                id="acct-password"
                type="password"
                autoComplete="new-password"
                className="form-input"
                placeholder={
                  accountModalEmployee?.account
                    ? "Leave blank to keep current password"
                    : "At least 8 characters"
                }
                value={accountForm.password}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, password: e.target.value })
                }
                minLength={accountForm.password ? 8 : undefined}
                required={!accountModalEmployee?.account}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="acct-role" className="form-label">
                Account Role
              </label>
              <select
                id="acct-role"
                className="form-input"
                value={accountForm.role}
                onChange={(e) =>
                  handleRoleChange(
                    e.target.value as "admin" | "faculty" | "student" | "parent"
                  )
                }
              >
                <option value="faculty">Faculty / Staff Editor (Custom Permissions)</option>
                {user?.role === "admin" && (
                  <option value="admin">Administrator (Full Access)</option>
                )}
                <option value="student">Read-Only (No Admin Access)</option>
              </select>
            </div>

            <div
              className="form-group"
              style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}
            >
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={accountForm.is_active}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      is_active: e.target.checked,
                    })
                  }
                />
                Account Active (allow sign-in)
              </label>

              {user?.is_super_admin && accountForm.role === "admin" && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accountForm.all_schools}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        all_schools: e.target.checked,
                      })
                    }
                  />
                  Super Admin (manage all integrated schools)
                </label>
              )}
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Assigned Permissions</span>
            <div className="permissions-checklist">
              {ALL_ADMIN_PERMISSIONS.map((perm) => {
                const isLockedAll = accountForm.role === "admin";
                const checked =
                  isLockedAll || accountForm.permissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`permission-item ${checked ? "is-checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isLockedAll}
                      onChange={() => togglePermission(perm.key)}
                    />
                    <span className="permission-item-text">
                      <strong>{perm.label}</strong>
                      <span>{perm.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {accountError && (
            <div className="feedback-box" role="alert">
              {accountError}
            </div>
          )}

          <div className="modal-actions-row" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingAccount}
              >
                {savingAccount
                  ? "Saving…"
                  : accountModalEmployee?.account
                    ? "Save Access Settings"
                    : "Assign Login"}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setAccountModalEmployee(null)}
              >
                Cancel
              </button>
            </div>

            {accountModalEmployee?.account && (
              <button
                type="button"
                className="btn btn-danger-outline btn-sm"
                onClick={handleRevokeAccount}
                disabled={savingAccount}
              >
                Revoke Login
              </button>
            )}
          </div>
        </form>
      </AdminModal>
    </>
  );
}
