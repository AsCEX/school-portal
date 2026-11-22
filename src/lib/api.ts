import type {
  Announcement,
  AuthUser,
  CampusEvent,
  Employee,
  PortalOverview,
  SchoolStat,
} from "@/types/portal";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export type AuthScope = "portal" | "admin";

const STORAGE_KEYS: Record<AuthScope, { token: string; user: string }> = {
  portal: { token: "alnces_portal_token", user: "alnces_portal_user" },
  admin: { token: "alnces_admin_token", user: "alnces_admin_user" },
};

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
  authScope?: AuthScope
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

export function fetchPortalOverview(): Promise<PortalOverview> {
  return apiRequest<PortalOverview>("/portal");
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
    }
  );
  saveAuthSession(data.token, data.user, scope);
  return data;
}

export function fetchCurrentUser(
  scope: AuthScope = "portal"
): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>("/auth/me", {}, scope);
}

export async function logoutUser(scope: AuthScope = "portal"): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", { method: "POST" }, scope);
  } finally {
    clearAuthSession(scope);
  }
}

// Announcements CRUD (Admin Scope)
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
