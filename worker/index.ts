import type { WorkerEnv, WorkerExecutionContext } from "./types";

const SCHOOL_INFO = {
  short_name: "ALNAVARROCES",
  name: "A.L. Navarro Central Elementary School",
  tagline: "ALNAVARROCES Official School Portal",
  academic_year: "SY 2026–2027",
  current_term: "Second Quarter · Active",
  admissions_status: "Early Enrollment Open (K–6)",
  campus_hours: "Mon–Fri, 7:00 AM – 4:30 PM",
  phone: "(082) 234-8900",
  email: "portal@alnavarroces.edu.ph",
  address: "A.L. Navarro Central Elementary School Campus, Lasang, Davao City",
} as const;

const ANNOUNCEMENT_CATEGORIES = new Set([
  "Important",
  "Academics",
  "Admissions",
  "Campus Life",
]);

const EVENT_CATEGORIES = new Set([
  "Academic",
  "Community",
  "Athletics",
  "Arts",
]);

const STAT_ICONS = new Set([
  "students",
  "graduation",
  "ratio",
  "staff",
  "clubs",
  "library",
]);

const EMPLOYEE_ROLES = new Set(["Teaching", "Non-Teaching"]);

const MONTH_ABBR = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const TOKEN_TTL_DAYS = 30;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student" | "parent";
  password_hash: string;
}

interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student" | "parent";
  can_manage_portal: boolean;
}

interface AnnouncementRow {
  id: number;
  title: string;
  category: string;
  is_pinned: number | boolean;
  published_at: string;
  office: string;
  excerpt: string;
  body: string;
  created_at?: string;
  updated_at?: string;
}

interface EventRow {
  id: number;
  title: string;
  category: string;
  event_date: string;
  time_range: string;
  location: string;
  host: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface StatRow {
  id: number;
  label: string;
  numeric_target: number;
  decimals: number;
  suffix: string | null;
  subtitle: string;
  icon: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

interface EmployeeRow {
  id: number;
  name: string;
  role_type: "Teaching" | "Non-Teaching";
  title: string;
  department: string;
  photo_url: string | null;
  years_of_service: string;
  email: string;
  office: string;
  office_hours: string;
  education: string;
  summary: string;
  bio: string;
  created_at?: string;
  updated_at?: string;
}

type ValidationErrors = Record<string, string[]>;

function getCorsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname;
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".pages.dev") ||
        host.endsWith(".workers.dev")
      ) {
        headers.set("Access-Control-Allow-Origin", origin);
        headers.set("Vary", "Origin");
      }
    } catch {
      // Ignore malformed Origin header
    }
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

function jsonResponse(
  request: Request,
  body: unknown,
  status = 200
): Response {
  const headers = getCorsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function validationErrorResponse(
  request: Request,
  errors: ValidationErrors
): Response {
  const firstMessage =
    Object.values(errors).flat()[0] || "The given data was invalid.";
  return jsonResponse(
    request,
    {
      message: firstMessage,
      errors,
    },
    422
  );
}

async function readJsonBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const data: unknown = await request.json();
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function addError(errors: ValidationErrors, field: string, message: string): void {
  if (!errors[field]) {
    errors[field] = [];
  }
  errors[field].push(message);
}

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function serializeAnnouncement(row: AnnouncementRow | Record<string, unknown>) {
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    category: String(row.category ?? ""),
    is_pinned: Boolean(row.is_pinned),
    published_at: String(row.published_at ?? ""),
    office: String(row.office ?? ""),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
  };
}

function serializeEvent(row: EventRow | Record<string, unknown>) {
  const eventDate = String(row.event_date ?? "");
  let monthLabel = "";
  let dayLabel = "";
  if (DATE_PATTERN.test(eventDate)) {
    const [, monthStr, dayStr] = eventDate.split("-");
    const monthIndex = Number(monthStr) - 1;
    monthLabel = MONTH_ABBR[monthIndex] ?? "";
    dayLabel = dayStr;
  }
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    category: String(row.category ?? ""),
    event_date: eventDate,
    month_label: monthLabel,
    day_label: dayLabel,
    time_range: String(row.time_range ?? ""),
    location: String(row.location ?? ""),
    host: String(row.host ?? ""),
    description: String(row.description ?? ""),
  };
}

function serializeStat(row: StatRow | Record<string, unknown>) {
  return {
    id: Number(row.id),
    label: String(row.label ?? ""),
    numeric_target: Number(row.numeric_target),
    decimals: Number(row.decimals),
    suffix: row.suffix === null || row.suffix === undefined ? null : String(row.suffix),
    subtitle: String(row.subtitle ?? ""),
    icon: String(row.icon ?? "students"),
    sort_order: Number(row.sort_order),
  };
}

function serializeEmployee(row: EmployeeRow | Record<string, unknown>) {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    role_type: row.role_type === "Non-Teaching" ? "Non-Teaching" : "Teaching",
    title: String(row.title ?? ""),
    department: String(row.department ?? ""),
    photo_url:
      row.photo_url === null || row.photo_url === undefined
        ? null
        : String(row.photo_url),
    years_of_service: String(row.years_of_service ?? ""),
    email: String(row.email ?? ""),
    office: String(row.office ?? ""),
    office_hours: String(row.office_hours ?? ""),
    education: String(row.education ?? ""),
    summary: String(row.summary ?? ""),
    bio: String(row.bio ?? ""),
  };
}

function serializeUser(row: Pick<UserRow, "id" | "name" | "email" | "role">): AuthenticatedUser {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    can_manage_portal: row.role === "admin" || row.role === "faculty",
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (left: ArrayBufferView, right: ArrayBufferView) => boolean;
  };
  if (typeof subtle.timingSafeEqual === "function") {
    return subtle.timingSafeEqual(a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.byteLength; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}

async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") {
    return false;
  }
  const iterations = Number(parts[1]);
  const salt = hexToBytes(parts[2]);
  const expected = hexToBytes(parts[3]);
  if (!Number.isInteger(iterations) || iterations < 10000 || iterations > 100000 || !salt || !expected) {
    return false;
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    expected.byteLength * 8
  );

  return constantTimeEqual(new Uint8Array(derivedBits), expected);
}

function generateBearerToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function authenticateRequest(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext
): Promise<{ user: AuthenticatedUser; tokenId: number } | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const nowIso = new Date().toISOString();

  const row = await env.DB.prepare(
    `SELECT
       t.id AS token_id,
       t.expires_at AS expires_at,
       u.id AS id,
       u.name AS name,
       u.email AS email,
       u.role AS role
     FROM auth_tokens t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ?
     LIMIT 1`
  )
    .bind(tokenHash)
    .first<{
      token_id: number;
      expires_at: string | null;
      id: number;
      name: string;
      email: string;
      role: "admin" | "faculty" | "student" | "parent";
    }>();

  if (!row) return null;

  if (row.expires_at && row.expires_at < nowIso) {
    ctx.waitUntil(
      env.DB.prepare("DELETE FROM auth_tokens WHERE id = ?")
        .bind(row.token_id)
        .run()
    );
    return null;
  }

  ctx.waitUntil(
    env.DB.prepare("UPDATE auth_tokens SET last_used_at = ? WHERE id = ?")
      .bind(nowIso, row.token_id)
      .run()
  );

  return {
    tokenId: Number(row.token_id),
    user: serializeUser(row),
  };
}

function parsePositiveId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateStringField(
  body: Record<string, unknown>,
  field: string,
  options: { required: boolean; max?: number; email?: boolean; date?: boolean; allowed?: Set<string> },
  errors: ValidationErrors
): string | undefined {
  const hasKey = Object.prototype.hasOwnProperty.call(body, field);
  const raw = body[field];

  if (!hasKey || raw === undefined || raw === null || raw === "") {
    if (options.required) {
      addError(errors, field, `The ${field.replaceAll("_", " ")} field is required.`);
    }
    return undefined;
  }

  if (typeof raw !== "string") {
    addError(errors, field, `The ${field.replaceAll("_", " ")} field must be a string.`);
    return undefined;
  }

  const value = raw.trim();
  if (value.length === 0) {
    if (options.required) {
      addError(errors, field, `The ${field.replaceAll("_", " ")} field is required.`);
    }
    return undefined;
  }

  if (options.max && value.length > options.max) {
    addError(
      errors,
      field,
      `The ${field.replaceAll("_", " ")} field must not exceed ${options.max} characters.`
    );
  }
  if (options.email && !EMAIL_PATTERN.test(value)) {
    addError(errors, field, `The ${field.replaceAll("_", " ")} field must be a valid email address.`);
  }
  if (options.date && !isValidDateString(value)) {
    addError(errors, field, `The ${field.replaceAll("_", " ")} field must be a valid YYYY-MM-DD date.`);
  }
  if (options.allowed && !options.allowed.has(value)) {
    addError(
      errors,
      field,
      `The selected ${field.replaceAll("_", " ")} is invalid.`
    );
  }
  return value;
}

async function handlePortalOverview(
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  const [announcementsRes, eventsRes, statsRes, employeesRes] =
    await env.DB.batch([
      env.DB.prepare(
        `SELECT id, title, category, is_pinned, published_at, office, excerpt, body
         FROM announcements
         ORDER BY is_pinned DESC, published_at DESC, id DESC`
      ),
      env.DB.prepare(
        `SELECT id, title, category, event_date, time_range, location, host, description
         FROM campus_events
         ORDER BY event_date ASC, id ASC`
      ),
      env.DB.prepare(
        `SELECT id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order
         FROM school_stats
         ORDER BY sort_order ASC, id ASC`
      ),
      env.DB.prepare(
        `SELECT id, name, role_type, title, department, photo_url, years_of_service,
                email, office, office_hours, education, summary, bio
         FROM employees
         ORDER BY CASE WHEN role_type = 'Teaching' THEN 0 ELSE 1 END, id ASC`
      ),
    ]);

  return jsonResponse(request, {
    school: SCHOOL_INFO,
    announcements: announcementsRes.results.map(serializeAnnouncement),
    events: eventsRes.results.map(serializeEvent),
    statistics: statsRes.results.map(serializeStat),
    employees: employeesRes.results.map(serializeEmployee),
  });
}

async function handleLogin(
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) {
    return validationErrorResponse(request, {
      email: ["The email field is required."],
      password: ["The password field is required."],
    });
  }

  const errors: ValidationErrors = {};
  const email = validateStringField(
    body,
    "email",
    { required: true, email: true, max: 255 },
    errors
  );
  const password =
    typeof body.password === "string" && body.password.length > 0
      ? body.password
      : undefined;

  if (!password) {
    addError(errors, "password", "The password field is required.");
  }

  if (Object.keys(errors).length > 0 || !email || !password) {
    return validationErrorResponse(request, errors);
  }

  const user = await env.DB.prepare(
    "SELECT id, name, email, role, password_hash FROM users WHERE lower(email) = lower(?) LIMIT 1"
  )
    .bind(email)
    .first<UserRow>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return jsonResponse(
      request,
      { message: "Invalid email or password." },
      422
    );
  }

  const plainTextToken = generateBearerToken();
  const tokenHash = await sha256Hex(plainTextToken);
  const expiresAt = new Date(
    Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await env.DB.prepare(
    "INSERT INTO auth_tokens (user_id, name, token_hash, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(user.id, "school-portal-web", tokenHash, expiresAt)
    .run();

  return jsonResponse(request, {
    token: plainTextToken,
    user: serializeUser(user),
  });
}

async function handleAnnouncements(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  idParam: string | null,
  url: URL
): Promise<Response> {
  const method = request.method;

  if (method === "GET" && !idParam) {
    const category = url.searchParams.get("category")?.trim();
    const search = url.searchParams.get("search")?.trim();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (category && category !== "all") {
      conditions.push("category = ?");
      params.push(category);
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push("(title LIKE ? OR excerpt LIKE ? OR office LIKE ?)");
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await env.DB.prepare(
      `SELECT id, title, category, is_pinned, published_at, office, excerpt, body
       FROM announcements
       ${whereClause}
       ORDER BY is_pinned DESC, published_at DESC, id DESC`
    )
      .bind(...params)
      .all<AnnouncementRow>();

    return jsonResponse(request, {
      data: result.results.map(serializeAnnouncement),
    });
  }

  if (method === "GET" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Announcement not found." }, 404);
    const row = await env.DB.prepare(
      "SELECT id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
    )
      .bind(id)
      .first<AnnouncementRow>();
    if (!row) return jsonResponse(request, { message: "Announcement not found." }, 404);
    return jsonResponse(request, { data: serializeAnnouncement(row) });
  }

  const auth = await authenticateRequest(request, env, ctx);
  if (!auth) return jsonResponse(request, { message: "Unauthenticated." }, 401);
  if (!auth.user.can_manage_portal) {
    return jsonResponse(
      request,
      { message: "Forbidden. Administrator or faculty role required." },
      403
    );
  }

  if (method === "POST" && !idParam) {
    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, {
        title: ["Invalid JSON request body."],
      });
    }

    const errors: ValidationErrors = {};
    const title = validateStringField(body, "title", { required: true, max: 255 }, errors);
    const category = validateStringField(
      body,
      "category",
      { required: true, allowed: ANNOUNCEMENT_CATEGORIES },
      errors
    );
    const publishedAt = validateStringField(
      body,
      "published_at",
      { required: true, date: true },
      errors
    );
    const office = validateStringField(body, "office", { required: true, max: 120 }, errors);
    const excerpt = validateStringField(body, "excerpt", { required: true, max: 600 }, errors);
    const content = validateStringField(body, "body", { required: true }, errors);

    let isPinned = 0;
    if (body.is_pinned !== undefined) {
      if (typeof body.is_pinned !== "boolean") {
        addError(errors, "is_pinned", "The is pinned field must be true or false.");
      } else {
        isPinned = body.is_pinned ? 1 : 0;
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    const insert = await env.DB.prepare(
      `INSERT INTO announcements (title, category, is_pinned, published_at, office, excerpt, body)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(title, category, isPinned, publishedAt, office, excerpt, content)
      .run();

    const created = await env.DB.prepare(
      "SELECT id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
    )
      .bind(insert.meta.last_row_id)
      .first<AnnouncementRow>();

    return jsonResponse(
      request,
      { data: created ? serializeAnnouncement(created) : null },
      201
    );
  }

  if ((method === "PUT" || method === "PATCH") && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Announcement not found." }, 404);

    const existing = await env.DB.prepare(
      "SELECT id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
    )
      .bind(id)
      .first<AnnouncementRow>();
    if (!existing) return jsonResponse(request, { message: "Announcement not found." }, 404);

    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, {
        title: ["Invalid JSON request body."],
      });
    }

    const errors: ValidationErrors = {};
    const title = Object.prototype.hasOwnProperty.call(body, "title")
      ? validateStringField(body, "title", { required: true, max: 255 }, errors)
      : existing.title;
    const category = Object.prototype.hasOwnProperty.call(body, "category")
      ? validateStringField(
          body,
          "category",
          { required: true, allowed: ANNOUNCEMENT_CATEGORIES },
          errors
        )
      : existing.category;
    const publishedAt = Object.prototype.hasOwnProperty.call(body, "published_at")
      ? validateStringField(body, "published_at", { required: true, date: true }, errors)
      : existing.published_at;
    const office = Object.prototype.hasOwnProperty.call(body, "office")
      ? validateStringField(body, "office", { required: true, max: 120 }, errors)
      : existing.office;
    const excerpt = Object.prototype.hasOwnProperty.call(body, "excerpt")
      ? validateStringField(body, "excerpt", { required: true, max: 600 }, errors)
      : existing.excerpt;
    const content = Object.prototype.hasOwnProperty.call(body, "body")
      ? validateStringField(body, "body", { required: true }, errors)
      : existing.body;

    let isPinned = existing.is_pinned ? 1 : 0;
    if (Object.prototype.hasOwnProperty.call(body, "is_pinned")) {
      if (typeof body.is_pinned !== "boolean") {
        addError(errors, "is_pinned", "The is pinned field must be true or false.");
      } else {
        isPinned = body.is_pinned ? 1 : 0;
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    await env.DB.prepare(
      `UPDATE announcements
       SET title = ?, category = ?, is_pinned = ?, published_at = ?, office = ?, excerpt = ?, body = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(title, category, isPinned, publishedAt, office, excerpt, content, id)
      .run();

    const updated = await env.DB.prepare(
      "SELECT id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
    )
      .bind(id)
      .first<AnnouncementRow>();

    return jsonResponse(request, {
      data: updated ? serializeAnnouncement(updated) : null,
    });
  }

  if (method === "DELETE" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Announcement not found." }, 404);
    const result = await env.DB.prepare("DELETE FROM announcements WHERE id = ?")
      .bind(id)
      .run();
    if (!result.meta.changes) {
      return jsonResponse(request, { message: "Announcement not found." }, 404);
    }
    return jsonResponse(request, { message: "Announcement deleted." });
  }

  return jsonResponse(request, { message: "Method not allowed." }, 405);
}

async function handleEvents(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  idParam: string | null,
  url: URL
): Promise<Response> {
  const method = request.method;

  if (method === "GET" && !idParam) {
    const category = url.searchParams.get("category")?.trim();
    const hasCategory = Boolean(category && category !== "all");
    const stmt = hasCategory
      ? env.DB.prepare(
          `SELECT id, title, category, event_date, time_range, location, host, description
           FROM campus_events
           WHERE category = ?
           ORDER BY event_date ASC, id ASC`
        ).bind(category)
      : env.DB.prepare(
          `SELECT id, title, category, event_date, time_range, location, host, description
           FROM campus_events
           ORDER BY event_date ASC, id ASC`
        );
    const result = await stmt.all<EventRow>();
    return jsonResponse(request, { data: result.results.map(serializeEvent) });
  }

  if (method === "GET" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Event not found." }, 404);
    const row = await env.DB.prepare(
      "SELECT id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
    )
      .bind(id)
      .first<EventRow>();
    if (!row) return jsonResponse(request, { message: "Event not found." }, 404);
    return jsonResponse(request, { data: serializeEvent(row) });
  }

  const auth = await authenticateRequest(request, env, ctx);
  if (!auth) return jsonResponse(request, { message: "Unauthenticated." }, 401);
  if (!auth.user.can_manage_portal) {
    return jsonResponse(
      request,
      { message: "Forbidden. Administrator or faculty role required." },
      403
    );
  }

  if (method === "POST" && !idParam) {
    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, { title: ["Invalid JSON request body."] });
    }

    const errors: ValidationErrors = {};
    const title = validateStringField(body, "title", { required: true, max: 255 }, errors);
    const category = validateStringField(
      body,
      "category",
      { required: true, allowed: EVENT_CATEGORIES },
      errors
    );
    const eventDate = validateStringField(
      body,
      "event_date",
      { required: true, date: true },
      errors
    );
    const timeRange = validateStringField(
      body,
      "time_range",
      { required: true, max: 120 },
      errors
    );
    const location = validateStringField(body, "location", { required: true, max: 255 }, errors);
    const host = validateStringField(body, "host", { required: true, max: 160 }, errors);
    const description = validateStringField(body, "description", { required: true }, errors);

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    const insert = await env.DB.prepare(
      `INSERT INTO campus_events (title, category, event_date, time_range, location, host, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(title, category, eventDate, timeRange, location, host, description)
      .run();

    const created = await env.DB.prepare(
      "SELECT id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
    )
      .bind(insert.meta.last_row_id)
      .first<EventRow>();

    return jsonResponse(request, { data: created ? serializeEvent(created) : null }, 201);
  }

  if ((method === "PUT" || method === "PATCH") && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Event not found." }, 404);

    const existing = await env.DB.prepare(
      "SELECT id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
    )
      .bind(id)
      .first<EventRow>();
    if (!existing) return jsonResponse(request, { message: "Event not found." }, 404);

    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, { title: ["Invalid JSON request body."] });
    }

    const errors: ValidationErrors = {};
    const title = Object.prototype.hasOwnProperty.call(body, "title")
      ? validateStringField(body, "title", { required: true, max: 255 }, errors)
      : existing.title;
    const category = Object.prototype.hasOwnProperty.call(body, "category")
      ? validateStringField(
          body,
          "category",
          { required: true, allowed: EVENT_CATEGORIES },
          errors
        )
      : existing.category;
    const eventDate = Object.prototype.hasOwnProperty.call(body, "event_date")
      ? validateStringField(body, "event_date", { required: true, date: true }, errors)
      : existing.event_date;
    const timeRange = Object.prototype.hasOwnProperty.call(body, "time_range")
      ? validateStringField(body, "time_range", { required: true, max: 120 }, errors)
      : existing.time_range;
    const location = Object.prototype.hasOwnProperty.call(body, "location")
      ? validateStringField(body, "location", { required: true, max: 255 }, errors)
      : existing.location;
    const host = Object.prototype.hasOwnProperty.call(body, "host")
      ? validateStringField(body, "host", { required: true, max: 160 }, errors)
      : existing.host;
    const description = Object.prototype.hasOwnProperty.call(body, "description")
      ? validateStringField(body, "description", { required: true }, errors)
      : existing.description;

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    await env.DB.prepare(
      `UPDATE campus_events
       SET title = ?, category = ?, event_date = ?, time_range = ?, location = ?, host = ?, description = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(title, category, eventDate, timeRange, location, host, description, id)
      .run();

    const updated = await env.DB.prepare(
      "SELECT id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
    )
      .bind(id)
      .first<EventRow>();

    return jsonResponse(request, { data: updated ? serializeEvent(updated) : null });
  }

  if (method === "DELETE" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Event not found." }, 404);
    const result = await env.DB.prepare("DELETE FROM campus_events WHERE id = ?")
      .bind(id)
      .run();
    if (!result.meta.changes) {
      return jsonResponse(request, { message: "Event not found." }, 404);
    }
    return jsonResponse(request, { message: "Event deleted." });
  }

  return jsonResponse(request, { message: "Method not allowed." }, 405);
}

async function handleStatistics(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  idParam: string | null
): Promise<Response> {
  const method = request.method;

  if (method === "GET" && !idParam) {
    const result = await env.DB.prepare(
      `SELECT id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order
       FROM school_stats
       ORDER BY sort_order ASC, id ASC`
    ).all<StatRow>();
    return jsonResponse(request, { data: result.results.map(serializeStat) });
  }

  const auth = await authenticateRequest(request, env, ctx);
  if (!auth) return jsonResponse(request, { message: "Unauthenticated." }, 401);
  if (!auth.user.can_manage_portal) {
    return jsonResponse(
      request,
      { message: "Forbidden. Administrator or faculty role required." },
      403
    );
  }

  if (method === "POST" && !idParam) {
    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, { label: ["Invalid JSON request body."] });
    }

    const errors: ValidationErrors = {};
    const label = validateStringField(body, "label", { required: true, max: 120 }, errors);
    const subtitle = validateStringField(body, "subtitle", { required: true, max: 255 }, errors);
    const icon =
      body.icon === undefined
        ? "students"
        : validateStringField(body, "icon", { required: true, allowed: STAT_ICONS }, errors);

    const numericTarget = Number(body.numeric_target);
    if (
      body.numeric_target === undefined ||
      body.numeric_target === null ||
      body.numeric_target === "" ||
      !Number.isFinite(numericTarget) ||
      numericTarget < 0
    ) {
      addError(errors, "numeric_target", "The numeric target must be a number of at least 0.");
    }

    const decimals = body.decimals === undefined ? 0 : Number(body.decimals);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 2) {
      addError(errors, "decimals", "The decimals field must be an integer between 0 and 2.");
    }

    const sortOrder = body.sort_order === undefined ? 0 : Number(body.sort_order);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      addError(errors, "sort_order", "The sort order must be an integer of at least 0.");
    }

    let suffix: string | null = null;
    if (body.suffix !== undefined && body.suffix !== null) {
      if (typeof body.suffix !== "string" || body.suffix.length > 16) {
        addError(errors, "suffix", "The suffix field must be a string up to 16 characters.");
      } else {
        suffix = body.suffix;
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    const insert = await env.DB.prepare(
      `INSERT INTO school_stats (label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(label, numericTarget, decimals, suffix, subtitle, icon, sortOrder)
      .run();

    const created = await env.DB.prepare(
      "SELECT id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order FROM school_stats WHERE id = ?"
    )
      .bind(insert.meta.last_row_id)
      .first<StatRow>();

    return jsonResponse(request, { data: created ? serializeStat(created) : null }, 201);
  }

  if ((method === "PUT" || method === "PATCH") && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Statistic not found." }, 404);

    const existing = await env.DB.prepare(
      "SELECT id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order FROM school_stats WHERE id = ?"
    )
      .bind(id)
      .first<StatRow>();
    if (!existing) return jsonResponse(request, { message: "Statistic not found." }, 404);

    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, { label: ["Invalid JSON request body."] });
    }

    const errors: ValidationErrors = {};
    const label = Object.prototype.hasOwnProperty.call(body, "label")
      ? validateStringField(body, "label", { required: true, max: 120 }, errors)
      : existing.label;
    const subtitle = Object.prototype.hasOwnProperty.call(body, "subtitle")
      ? validateStringField(body, "subtitle", { required: true, max: 255 }, errors)
      : existing.subtitle;
    const icon = Object.prototype.hasOwnProperty.call(body, "icon")
      ? validateStringField(body, "icon", { required: true, allowed: STAT_ICONS }, errors)
      : existing.icon;

    let numericTarget = Number(existing.numeric_target);
    if (Object.prototype.hasOwnProperty.call(body, "numeric_target")) {
      const parsed = Number(body.numeric_target);
      if (
        body.numeric_target === null ||
        body.numeric_target === "" ||
        !Number.isFinite(parsed) ||
        parsed < 0
      ) {
        addError(errors, "numeric_target", "The numeric target must be a number of at least 0.");
      } else {
        numericTarget = parsed;
      }
    }

    let decimals = Number(existing.decimals);
    if (Object.prototype.hasOwnProperty.call(body, "decimals")) {
      const parsed = Number(body.decimals);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 2) {
        addError(errors, "decimals", "The decimals field must be an integer between 0 and 2.");
      } else {
        decimals = parsed;
      }
    }

    let sortOrder = Number(existing.sort_order);
    if (Object.prototype.hasOwnProperty.call(body, "sort_order")) {
      const parsed = Number(body.sort_order);
      if (!Number.isInteger(parsed) || parsed < 0) {
        addError(errors, "sort_order", "The sort order must be an integer of at least 0.");
      } else {
        sortOrder = parsed;
      }
    }

    let suffix = existing.suffix ?? null;
    if (Object.prototype.hasOwnProperty.call(body, "suffix")) {
      if (body.suffix === null || body.suffix === undefined) {
        suffix = null;
      } else if (typeof body.suffix !== "string" || body.suffix.length > 16) {
        addError(errors, "suffix", "The suffix field must be a string up to 16 characters.");
      } else {
        suffix = body.suffix;
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    await env.DB.prepare(
      `UPDATE school_stats
       SET label = ?, numeric_target = ?, decimals = ?, suffix = ?, subtitle = ?, icon = ?, sort_order = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(label, numericTarget, decimals, suffix, subtitle, icon, sortOrder, id)
      .run();

    const updated = await env.DB.prepare(
      "SELECT id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order FROM school_stats WHERE id = ?"
    )
      .bind(id)
      .first<StatRow>();

    return jsonResponse(request, { data: updated ? serializeStat(updated) : null });
  }

  if (method === "DELETE" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Statistic not found." }, 404);
    const result = await env.DB.prepare("DELETE FROM school_stats WHERE id = ?")
      .bind(id)
      .run();
    if (!result.meta.changes) {
      return jsonResponse(request, { message: "Statistic not found." }, 404);
    }
    return jsonResponse(request, { message: "Statistic deleted." });
  }

  return jsonResponse(request, { message: "Method not allowed." }, 405);
}

async function handleEmployees(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  idParam: string | null,
  url: URL
): Promise<Response> {
  const method = request.method;

  if (method === "GET" && !idParam) {
    const roleType = url.searchParams.get("role_type")?.trim();
    const department = url.searchParams.get("department")?.trim();
    const search = url.searchParams.get("search")?.trim();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (roleType && roleType !== "all") {
      conditions.push("role_type = ?");
      params.push(roleType);
    }
    if (department && department !== "all") {
      conditions.push("department = ?");
      params.push(department);
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push("(name LIKE ? OR title LIKE ? OR department LIKE ? OR summary LIKE ?)");
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await env.DB.prepare(
      `SELECT id, name, role_type, title, department, photo_url, years_of_service,
              email, office, office_hours, education, summary, bio
       FROM employees
       ${whereClause}
       ORDER BY CASE WHEN role_type = 'Teaching' THEN 0 ELSE 1 END, id ASC`
    )
      .bind(...params)
      .all<EmployeeRow>();

    return jsonResponse(request, {
      data: result.results.map(serializeEmployee),
    });
  }

  if (method === "GET" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Employee not found." }, 404);
    const row = await env.DB.prepare(
      `SELECT id, name, role_type, title, department, photo_url, years_of_service,
              email, office, office_hours, education, summary, bio
       FROM employees
       WHERE id = ?`
    )
      .bind(id)
      .first<EmployeeRow>();
    if (!row) return jsonResponse(request, { message: "Employee not found." }, 404);
    return jsonResponse(request, { data: serializeEmployee(row) });
  }

  const auth = await authenticateRequest(request, env, ctx);
  if (!auth) return jsonResponse(request, { message: "Unauthenticated." }, 401);
  if (!auth.user.can_manage_portal) {
    return jsonResponse(
      request,
      { message: "Forbidden. Administrator or faculty role required." },
      403
    );
  }

  if (method === "POST" && !idParam) {
    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, { name: ["Invalid JSON request body."] });
    }

    const errors: ValidationErrors = {};
    const name = validateStringField(body, "name", { required: true, max: 255 }, errors);
    const roleType = validateStringField(
      body,
      "role_type",
      { required: true, allowed: EMPLOYEE_ROLES },
      errors
    );
    const title = validateStringField(body, "title", { required: true, max: 255 }, errors);
    const department = validateStringField(
      body,
      "department",
      { required: true, max: 120 },
      errors
    );
    const yearsOfService = validateStringField(
      body,
      "years_of_service",
      { required: true, max: 64 },
      errors
    );
    const email = validateStringField(
      body,
      "email",
      { required: true, email: true, max: 255 },
      errors
    );
    const office = validateStringField(body, "office", { required: true, max: 120 }, errors);
    const officeHours = validateStringField(
      body,
      "office_hours",
      { required: true, max: 120 },
      errors
    );
    const education = validateStringField(
      body,
      "education",
      { required: true, max: 255 },
      errors
    );
    const summary = validateStringField(body, "summary", { required: true, max: 500 }, errors);
    const bio = validateStringField(body, "bio", { required: true }, errors);

    let photoUrl = "/assets/staff-1.jpg";
    if (body.photo_url !== undefined && body.photo_url !== null && body.photo_url !== "") {
      if (typeof body.photo_url !== "string" || body.photo_url.length > 255) {
        addError(errors, "photo_url", "The photo URL must be a string up to 255 characters.");
      } else {
        photoUrl = body.photo_url.trim() || "/assets/staff-1.jpg";
      }
    }

    if (email && Object.keys(errors).length === 0) {
      const dup = await env.DB.prepare(
        "SELECT id FROM employees WHERE lower(email) = lower(?) LIMIT 1"
      )
        .bind(email)
        .first<{ id: number }>();
      if (dup) {
        addError(errors, "email", "The email has already been taken.");
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    const insert = await env.DB.prepare(
      `INSERT INTO employees (
         name, role_type, title, department, photo_url, years_of_service,
         email, office, office_hours, education, summary, bio
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        name,
        roleType,
        title,
        department,
        photoUrl,
        yearsOfService,
        email,
        office,
        officeHours,
        education,
        summary,
        bio
      )
      .run();

    const created = await env.DB.prepare(
      `SELECT id, name, role_type, title, department, photo_url, years_of_service,
              email, office, office_hours, education, summary, bio
       FROM employees
       WHERE id = ?`
    )
      .bind(insert.meta.last_row_id)
      .first<EmployeeRow>();

    return jsonResponse(
      request,
      { data: created ? serializeEmployee(created) : null },
      201
    );
  }

  if ((method === "PUT" || method === "PATCH") && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Employee not found." }, 404);

    const existing = await env.DB.prepare(
      `SELECT id, name, role_type, title, department, photo_url, years_of_service,
              email, office, office_hours, education, summary, bio
       FROM employees
       WHERE id = ?`
    )
      .bind(id)
      .first<EmployeeRow>();
    if (!existing) return jsonResponse(request, { message: "Employee not found." }, 404);

    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, { name: ["Invalid JSON request body."] });
    }

    const errors: ValidationErrors = {};
    const name = Object.prototype.hasOwnProperty.call(body, "name")
      ? validateStringField(body, "name", { required: true, max: 255 }, errors)
      : existing.name;
    const roleType = Object.prototype.hasOwnProperty.call(body, "role_type")
      ? validateStringField(
          body,
          "role_type",
          { required: true, allowed: EMPLOYEE_ROLES },
          errors
        )
      : existing.role_type;
    const title = Object.prototype.hasOwnProperty.call(body, "title")
      ? validateStringField(body, "title", { required: true, max: 255 }, errors)
      : existing.title;
    const department = Object.prototype.hasOwnProperty.call(body, "department")
      ? validateStringField(body, "department", { required: true, max: 120 }, errors)
      : existing.department;
    const yearsOfService = Object.prototype.hasOwnProperty.call(body, "years_of_service")
      ? validateStringField(body, "years_of_service", { required: true, max: 64 }, errors)
      : existing.years_of_service;
    const email = Object.prototype.hasOwnProperty.call(body, "email")
      ? validateStringField(body, "email", { required: true, email: true, max: 255 }, errors)
      : existing.email;
    const office = Object.prototype.hasOwnProperty.call(body, "office")
      ? validateStringField(body, "office", { required: true, max: 120 }, errors)
      : existing.office;
    const officeHours = Object.prototype.hasOwnProperty.call(body, "office_hours")
      ? validateStringField(body, "office_hours", { required: true, max: 120 }, errors)
      : existing.office_hours;
    const education = Object.prototype.hasOwnProperty.call(body, "education")
      ? validateStringField(body, "education", { required: true, max: 255 }, errors)
      : existing.education;
    const summary = Object.prototype.hasOwnProperty.call(body, "summary")
      ? validateStringField(body, "summary", { required: true, max: 500 }, errors)
      : existing.summary;
    const bio = Object.prototype.hasOwnProperty.call(body, "bio")
      ? validateStringField(body, "bio", { required: true }, errors)
      : existing.bio;

    let photoUrl = existing.photo_url;
    if (Object.prototype.hasOwnProperty.call(body, "photo_url")) {
      if (body.photo_url === null || body.photo_url === undefined || body.photo_url === "") {
        photoUrl = null;
      } else if (typeof body.photo_url !== "string" || body.photo_url.length > 255) {
        addError(errors, "photo_url", "The photo URL must be a string up to 255 characters.");
      } else {
        photoUrl = body.photo_url.trim();
      }
    }

    if (email && Object.keys(errors).length === 0) {
      const dup = await env.DB.prepare(
        "SELECT id FROM employees WHERE lower(email) = lower(?) AND id != ? LIMIT 1"
      )
        .bind(email, id)
        .first<{ id: number }>();
      if (dup) {
        addError(errors, "email", "The email has already been taken.");
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    await env.DB.prepare(
      `UPDATE employees
       SET name = ?, role_type = ?, title = ?, department = ?, photo_url = ?, years_of_service = ?,
           email = ?, office = ?, office_hours = ?, education = ?, summary = ?, bio = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(
        name,
        roleType,
        title,
        department,
        photoUrl,
        yearsOfService,
        email,
        office,
        officeHours,
        education,
        summary,
        bio,
        id
      )
      .run();

    const updated = await env.DB.prepare(
      `SELECT id, name, role_type, title, department, photo_url, years_of_service,
              email, office, office_hours, education, summary, bio
       FROM employees
       WHERE id = ?`
    )
      .bind(id)
      .first<EmployeeRow>();

    return jsonResponse(request, {
      data: updated ? serializeEmployee(updated) : null,
    });
  }

  if (method === "DELETE" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Employee not found." }, 404);
    const result = await env.DB.prepare("DELETE FROM employees WHERE id = ?")
      .bind(id)
      .run();
    if (!result.meta.changes) {
      return jsonResponse(request, { message: "Employee not found." }, 404);
    }
    return jsonResponse(request, { message: "Employee profile deleted." });
  }

  return jsonResponse(request, { message: "Method not allowed." }, 405);
}

async function routeApiRequest(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  url: URL
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) });
  }

  if (!env.DB) {
    console.error(
      JSON.stringify({
        message: "D1 database binding missing",
        path: url.pathname,
      })
    );
    return jsonResponse(
      request,
      {
        message:
          "Cloudflare D1 database binding (DB) is not configured for this Worker.",
      },
      503
    );
  }

  const subPath = url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  const segments = subPath ? subPath.split("/") : [];

  if (segments.length === 1 && segments[0] === "health" && request.method === "GET") {
    await env.DB.prepare("SELECT 1 AS ok").first();
    return jsonResponse(request, { status: "ok", database: "d1-sqlite" });
  }

  if (segments.length === 1 && segments[0] === "portal" && request.method === "GET") {
    return handlePortalOverview(request, env);
  }

  if (segments[0] === "auth") {
    if (segments.length === 2 && segments[1] === "login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (segments.length === 2 && segments[1] === "me" && request.method === "GET") {
      const auth = await authenticateRequest(request, env, ctx);
      if (!auth) return jsonResponse(request, { message: "Unauthenticated." }, 401);
      return jsonResponse(request, { user: auth.user });
    }
    if (segments.length === 2 && segments[1] === "logout" && request.method === "POST") {
      const auth = await authenticateRequest(request, env, ctx);
      if (!auth) return jsonResponse(request, { message: "Unauthenticated." }, 401);
      await env.DB.prepare("DELETE FROM auth_tokens WHERE id = ?")
        .bind(auth.tokenId)
        .run();
      return jsonResponse(request, { message: "Signed out successfully." });
    }
    return jsonResponse(request, { message: "Not found." }, 404);
  }

  if (segments[0] === "announcements" && segments.length <= 2) {
    return handleAnnouncements(request, env, ctx, segments[1] ?? null, url);
  }

  if (segments[0] === "events" && segments.length <= 2) {
    return handleEvents(request, env, ctx, segments[1] ?? null, url);
  }

  if (segments[0] === "statistics" && segments.length <= 2) {
    return handleStatistics(request, env, ctx, segments[1] ?? null);
  }

  if (segments[0] === "employees" && segments.length <= 2) {
    return handleEmployees(request, env, ctx, segments[1] ?? null, url);
  }

  return jsonResponse(request, { message: "API endpoint not found." }, 404);
}

const worker = {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: WorkerExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      try {
        return await routeApiRequest(request, env, ctx, url);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          JSON.stringify({
            message: "Unhandled API error",
            method: request.method,
            path: url.pathname,
            error: message,
          })
        );
        return jsonResponse(
          request,
          { message: "Internal server error." },
          500
        );
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};

export default worker;
