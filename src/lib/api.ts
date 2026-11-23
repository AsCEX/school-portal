import type {
  AdminPermission,
  Announcement,
  AuthUser,
  CampusEvent,
  Employee,
  EmployeeAccount,
  PortalOverview,
  SchoolInfo,
  SchoolStat,
} from "@/types/portal";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export type AuthScope = "portal" | "admin";

const STORAGE_KEYS: Record<AuthScope, { token: string; user: string }> = {
  portal: { token: "alnces_portal_token", user: "alnces_portal_user" },
  admin: { token: "alnces_admin_token", user: "alnces_admin_user" },
};

const ACTIVE_ADMIN_SCHOOL_KEY = "alnces_admin_school_slug_v1";

export function getActiveAdminSchoolSlug(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ADMIN_SCHOOL_KEY);
}

export function setActiveAdminSchoolSlug(slug: string | null): void {
  if (typeof window === "undefined") return;
  if (slug) {
    localStorage.setItem(ACTIVE_ADMIN_SCHOOL_KEY, slug);
  } else {
    localStorage.removeItem(ACTIVE_ADMIN_SCHOOL_KEY);
  }
}

export function getStoredToken(scope: AuthScope = "portal"): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS[scope].token);
}

export function getStoredUser(scope: AuthScope = "portal"): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS[scope].user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuthSession(
  token: string,
  user: AuthUser,
  scope: AuthScope = "portal"
): void {
  localStorage.setItem(STORAGE_KEYS[scope].token, token);
  localStorage.setItem(STORAGE_KEYS[scope].user, JSON.stringify(user));
}

export function clearAuthSession(scope: AuthScope = "portal"): void {
  localStorage.removeItem(STORAGE_KEYS[scope].token);
  localStorage.removeItem(STORAGE_KEYS[scope].user);
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authScope?: AuthScope,
  schoolSlug?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authScope) {
    const token = getStoredToken(authScope);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const effectiveSchool =
    schoolSlug !== undefined
      ? schoolSlug
      : authScope === "admin"
        ? getActiveAdminSchoolSlug()
        : null;
  if (effectiveSchool) {
    headers["X-School-Slug"] = effectiveSchool;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = payload?.errors
      ? Object.values(payload.errors).flat().join(" ")
      : "";
    throw new Error(
      validationErrors || payload?.message || `Request failed (${response.status})`
    );
  }

  return payload as T;
}

export function fetchPortalOverview(
  schoolSlug?: string | null,
  authScope?: AuthScope
): Promise<PortalOverview> {
  const qs = schoolSlug ? `?school=${encodeURIComponent(schoolSlug)}` : "";
  return apiRequest<PortalOverview>(`/portal${qs}`, {}, authScope, schoolSlug ?? null);
}

export function fetchSchools(includeInactive = false): Promise<{ data: SchoolInfo[] }> {
  const qs = includeInactive ? "?include_inactive=1" : "";
  return apiRequest<{ data: SchoolInfo[] }>(
    `/schools${qs}`,
    {},
    includeInactive ? "admin" : undefined,
    null
  );
}

export function createSchool(
  payload: Omit<SchoolInfo, "id">
): Promise<{ data: SchoolInfo }> {
  return apiRequest<{ data: SchoolInfo }>(
    "/schools",
    { method: "POST", body: JSON.stringify(payload) },
    "admin",
    null
  );
}

export function updateSchool(
  id: number,
  payload: Partial<Omit<SchoolInfo, "id">>
): Promise<{ data: SchoolInfo }> {
  return apiRequest<{ data: SchoolInfo }>(
    `/schools/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "admin",
    null
  );
}

export function deleteSchool(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/schools/${id}`,
    { method: "DELETE" },
    "admin",
    null
  );
}

export async function loginUser(
  email: string,
  password: string,
  scope: AuthScope = "portal"
): Promise<{ token: string; user: AuthUser }> {
  const data = await apiRequest<{ token: string; user: AuthUser }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    undefined,
    null
  );
  saveAuthSession(data.token, data.user, scope);
  return data;
}

export function fetchCurrentUser(
  scope: AuthScope = "portal"
): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>("/auth/me", {}, scope, null);
}

export async function logoutUser(scope: AuthScope = "portal"): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", { method: "POST" }, scope, null);
  } finally {
    clearAuthSession(scope);
  }
}

// Announcements CRUD (Admin Scope — automatically scoped to active admin school via X-School-Slug)
export function createAnnouncement(
  payload: Omit<Announcement, "id">
): Promise<{ data: Announcement }> {
  return apiRequest<{ data: Announcement }>(
    "/announcements",
    { method: "POST", body: JSON.stringify(payload) },
    "admin"
  );
}

export function updateAnnouncement(
  id: number,
  payload: Partial<Omit<Announcement, "id">>
): Promise<{ data: Announcement }> {
  return apiRequest<{ data: Announcement }>(
    `/announcements/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "admin"
  );
}

export function deleteAnnouncement(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/announcements/${id}`,
    { method: "DELETE" },
    "admin"
  );
}

// Events CRUD (Admin Scope)
export function createEvent(
  payload: Omit<CampusEvent, "id" | "month_label" | "day_label">
): Promise<{ data: CampusEvent }> {
  return apiRequest<{ data: CampusEvent }>(
    "/events",
    { method: "POST", body: JSON.stringify(payload) },
    "admin"
  );
}

export function updateEvent(
  id: number,
  payload: Partial<Omit<CampusEvent, "id" | "month_label" | "day_label">>
): Promise<{ data: CampusEvent }> {
  return apiRequest<{ data: CampusEvent }>(
    `/events/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "admin"
  );
}

export function deleteEvent(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/events/${id}`,
    { method: "DELETE" },
    "admin"
  );
}

// School Statistics CRUD (Admin Scope)
export function createStatistic(
  payload: Omit<SchoolStat, "id">
): Promise<{ data: SchoolStat }> {
  return apiRequest<{ data: SchoolStat }>(
    "/statistics",
    { method: "POST", body: JSON.stringify(payload) },
    "admin"
  );
}

export function updateStatistic(
  id: number,
  payload: Partial<Omit<SchoolStat, "id">>
): Promise<{ data: SchoolStat }> {
  return apiRequest<{ data: SchoolStat }>(
    `/statistics/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "admin"
  );
}

export function deleteStatistic(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/statistics/${id}`,
    { method: "DELETE" },
    "admin"
  );
}

// Employees CRUD (Admin Scope)
export function createEmployee(
  payload: Omit<Employee, "id">
): Promise<{ data: Employee }> {
  return apiRequest<{ data: Employee }>(
    "/employees",
    { method: "POST", body: JSON.stringify(payload) },
    "admin"
  );
}

export function updateEmployee(
  id: number,
  payload: Partial<Omit<Employee, "id">>
): Promise<{ data: Employee }> {
  return apiRequest<{ data: Employee }>(
    `/employees/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "admin"
  );
}

export function deleteEmployee(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/employees/${id}`,
    { method: "DELETE" },
    "admin"
  );
}

// Employee Login & RBAC Permissions (Admin Scope)
export interface AssignEmployeeAccountPayload {
  email: string;
  password?: string;
  role: "admin" | "faculty" | "student" | "parent";
  permissions: AdminPermission[];
  is_active: boolean;
  all_schools?: boolean;
}

export function assignEmployeeAccount(
  employeeId: number,
  payload: AssignEmployeeAccountPayload
): Promise<{ data: EmployeeAccount }> {
  return apiRequest<{ data: EmployeeAccount }>(
    `/employees/${employeeId}/account`,
    { method: "PUT", body: JSON.stringify(payload) },
    "admin"
  );
}

export function revokeEmployeeAccount(
  employeeId: number
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/employees/${employeeId}/account`,
    { method: "DELETE" },
    "admin"
  );
}
