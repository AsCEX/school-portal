import type { WorkerEnv, WorkerExecutionContext } from "./types";

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
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const SCHOOL_COLUMNS = `
  id, slug, school_code, short_name, name, tagline, grade_levels,
  hero_description, hero_image_url, logo_url, primary_color, primary_dark_color,
  academic_year, current_term, admissions_status, campus_hours,
  phone, email, address, custom_domain, is_default, is_active
`;

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student" | "parent";
  school_id: number | null;
  password_hash: string;
}

interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student" | "parent";
  school_id: number | null;
  can_manage_portal: boolean;
  is_super_admin: boolean;
}

interface SchoolRow {
  id: number;
  slug: string;
  school_code: string | null;
  short_name: string;
  name: string;
  tagline: string;
  grade_levels: string;
  hero_description: string;
  hero_image_url: string;
  logo_url: string | null;
  primary_color: string;
  primary_dark_color: string;
  academic_year: string;
  current_term: string;
  admissions_status: string;
  campus_hours: string;
  phone: string;
  email: string;
  address: string;
  custom_domain: string | null;
  is_default: number | boolean;
  is_active: number | boolean;
}

interface AnnouncementRow {
  id: number;
  school_id: number;
  title: string;
  category: string;
  is_pinned: number | boolean;
  published_at: string;
  office: string;
  excerpt: string;
  body: string;
}

interface EventRow {
  id: number;
  school_id: number;
  title: string;
  category: string;
  event_date: string;
  time_range: string;
  location: string;
  host: string;
  description: string;
}

interface StatRow {
  id: number;
  school_id: number;
  label: string;
  numeric_target: number;
  decimals: number;
  suffix: string | null;
  subtitle: string;
  icon: string;
  sort_order: number;
}

interface EmployeeRow {
  id: number;
  school_id: number;
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
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, X-School-Slug"
  );
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

function serializeSchool(row: SchoolRow | Record<string, unknown>) {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    school_code:
      row.school_code === null || row.school_code === undefined || row.school_code === ""
        ? null
        : String(row.school_code),
    short_name: String(row.short_name ?? ""),
    name: String(row.name ?? ""),
    tagline: String(row.tagline ?? ""),
    grade_levels: String(row.grade_levels ?? ""),
    hero_description: String(row.hero_description ?? ""),
    hero_image_url: String(row.hero_image_url || "/assets/campus-hero.jpg"),
    logo_url:
      row.logo_url === null || row.logo_url === undefined || row.logo_url === ""
        ? null
        : String(row.logo_url),
    primary_color: String(row.primary_color || "#07187C"),
    primary_dark_color: String(row.primary_dark_color || "#041246"),
    academic_year: String(row.academic_year ?? ""),
    current_term: String(row.current_term ?? ""),
    admissions_status: String(row.admissions_status ?? ""),
    campus_hours: String(row.campus_hours ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    address: String(row.address ?? ""),
    custom_domain:
      row.custom_domain === null || row.custom_domain === undefined || row.custom_domain === ""
        ? null
        : String(row.custom_domain),
    is_default: Boolean(row.is_default),
    is_active: row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

function serializeAnnouncement(row: AnnouncementRow | Record<string, unknown>) {
  return {
    id: Number(row.id),
    school_id: Number(row.school_id ?? 1),
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
    school_id: Number(row.school_id ?? 1),
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
    school_id: Number(row.school_id ?? 1),
    label: String(row.label ?? ""),
    numeric_target: Number(row.numeric_target),
    decimals: Number(row.decimals),
    suffix:
      row.suffix === null || row.suffix === undefined ? null : String(row.suffix),
    subtitle: String(row.subtitle ?? ""),
    icon: String(row.icon ?? "students"),
    sort_order: Number(row.sort_order),
  };
}

function serializeEmployee(row: EmployeeRow | Record<string, unknown>) {
  return {
    id: Number(row.id),
    school_id: Number(row.school_id ?? 1),
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

function serializeUser(
  row: Pick<UserRow, "id" | "name" | "email" | "role" | "school_id">
): AuthenticatedUser {
  const schoolId =
    row.school_id === null || row.school_id === undefined
      ? null
      : Number(row.school_id);
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    school_id: schoolId,
    can_manage_portal: row.role === "admin" || row.role === "faculty",
    is_super_admin: row.role === "admin" && schoolId === null,
  };
}

function canManageSchool(user: AuthenticatedUser, schoolId: number): boolean {
  if (!user.can_manage_portal) return false;
  if (user.school_id === null) return true;
  return user.school_id === schoolId;
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
  if (
    !Number.isInteger(iterations) ||
    iterations < 10000 ||
    iterations > 100000 ||
    !salt ||
    !expected
  ) {
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
       u.role AS role,
       u.school_id AS school_id
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
      school_id: number | null;
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

async function resolveSchool(
  request: Request,
  env: WorkerEnv,
  url: URL,
  options: { allowInactive?: boolean; explicitSchoolId?: number | null } = {}
): Promise<SchoolRow | null> {
  const activeFilter = options.allowInactive ? "" : "AND is_active = 1";

  if (options.explicitSchoolId) {
    return env.DB.prepare(
      `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE id = ? ${activeFilter} LIMIT 1`
    )
      .bind(options.explicitSchoolId)
      .first<SchoolRow>();
  }

  const rawSelector = (
    url.searchParams.get("school") ||
    request.headers.get("X-School-Slug") ||
    ""
  ).trim();

  if (rawSelector) {
    const asId = parsePositiveId(rawSelector);
    if (asId) {
      const byId = await env.DB.prepare(
        `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE id = ? ${activeFilter} LIMIT 1`
      )
        .bind(asId)
        .first<SchoolRow>();
      if (byId) return byId;
    }
    return env.DB.prepare(
      `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE lower(slug) = lower(?) ${activeFilter} LIMIT 1`
    )
      .bind(rawSelector)
      .first<SchoolRow>();
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1" &&
    !hostname.endsWith(".pages.dev") &&
    !hostname.endsWith(".workers.dev")
  ) {
    const byDomain = await env.DB.prepare(
      `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE lower(custom_domain) = ? ${activeFilter} LIMIT 1`
    )
      .bind(hostname)
      .first<SchoolRow>();
    if (byDomain) return byDomain;
  }

  const defaultSchool = await env.DB.prepare(
    `SELECT ${SCHOOL_COLUMNS}
     FROM schools
     WHERE is_default = 1 ${activeFilter}
     ORDER BY id ASC
     LIMIT 1`
  ).first<SchoolRow>();
  if (defaultSchool) return defaultSchool;

  const fallbackWhere = options.allowInactive ? "" : "WHERE is_active = 1";
  return env.DB.prepare(
    `SELECT ${SCHOOL_COLUMNS} FROM schools ${fallbackWhere} ORDER BY id ASC LIMIT 1`
  ).first<SchoolRow>();
}

function validateStringField(
  body: Record<string, unknown>,
  field: string,
  options: {
    required: boolean;
    max?: number;
    email?: boolean;
    date?: boolean;
    slug?: boolean;
    hexColor?: boolean;
    allowed?: Set<string>;
  },
  errors: ValidationErrors
): string | undefined {
  const hasKey = Object.prototype.hasOwnProperty.call(body, field);
  const raw = body[field];

  if (!hasKey || raw === undefined || raw === null || raw === "") {
    if (options.required) {
      addError(
        errors,
        field,
        `The ${field.replaceAll("_", " ")} field is required.`
      );
    }
    return undefined;
  }

  if (typeof raw !== "string") {
    addError(
      errors,
      field,
      `The ${field.replaceAll("_", " ")} field must be a string.`
    );
    return undefined;
  }

  const value = raw.trim();
  if (value.length === 0) {
    if (options.required) {
      addError(
        errors,
        field,
        `The ${field.replaceAll("_", " ")} field is required.`
      );
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
    addError(
      errors,
      field,
      `The ${field.replaceAll("_", " ")} field must be a valid email address.`
    );
  }
  if (options.date && !isValidDateString(value)) {
    addError(
      errors,
      field,
      `The ${field.replaceAll("_", " ")} field must be a valid YYYY-MM-DD date.`
    );
  }
  if (options.slug && !SLUG_PATTERN.test(value.toLowerCase())) {
    addError(
      errors,
      field,
      "The slug may only contain lowercase letters, numbers, and hyphens (e.g. alnavarroces)."
    );
  }
  if (options.hexColor && !HEX_COLOR_PATTERN.test(value)) {
    addError(
      errors,
      field,
      `The ${field.replaceAll("_", " ")} field must be a valid 6-digit hex color (e.g. #07187C).`
    );
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

async function resolveTargetSchoolIdForWrite(
  request: Request,
  env: WorkerEnv,
  url: URL,
  authUser: AuthenticatedUser,
  body: Record<string, unknown>
): Promise<{ schoolId: number } | { error: Response }> {
  const bodySchoolId =
    body.school_id !== undefined && body.school_id !== null && body.school_id !== ""
      ? Number(body.school_id)
      : null;

  const school = await resolveSchool(request, env, url, {
    allowInactive: true,
    explicitSchoolId:
      bodySchoolId && Number.isSafeInteger(bodySchoolId) && bodySchoolId > 0
        ? bodySchoolId
        : authUser.school_id,
  });

  if (!school) {
    return {
      error: jsonResponse(request, { message: "Target school not found." }, 404),
    };
  }

  if (!canManageSchool(authUser, Number(school.id))) {
    return {
      error: jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to manage this school." },
        403
      ),
    };
  }

  return { schoolId: Number(school.id) };
}

async function handlePortalOverview(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  url: URL
): Promise<Response> {
  const auth = await authenticateRequest(request, env, ctx);
  const allowInactive = Boolean(auth?.user.can_manage_portal);

  const school = await resolveSchool(request, env, url, { allowInactive });
  if (!school) {
    return jsonResponse(request, { message: "School not found." }, 404);
  }

  const schoolId = Number(school.id);
  const schoolsWhere = allowInactive ? "" : "WHERE is_active = 1";

  const [schoolsRes, announcementsRes, eventsRes, statsRes, employeesRes] =
    await env.DB.batch([
      env.DB.prepare(
        `SELECT ${SCHOOL_COLUMNS}
         FROM schools
         ${schoolsWhere}
         ORDER BY is_default DESC, id ASC`
      ),
      env.DB.prepare(
        `SELECT id, school_id, title, category, is_pinned, published_at, office, excerpt, body
         FROM announcements
         WHERE school_id = ?
         ORDER BY is_pinned DESC, published_at DESC, id DESC`
      ).bind(schoolId),
      env.DB.prepare(
        `SELECT id, school_id, title, category, event_date, time_range, location, host, description
         FROM campus_events
         WHERE school_id = ?
         ORDER BY event_date ASC, id ASC`
      ).bind(schoolId),
      env.DB.prepare(
        `SELECT id, school_id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order
         FROM school_stats
         WHERE school_id = ?
         ORDER BY sort_order ASC, id ASC`
      ).bind(schoolId),
      env.DB.prepare(
        `SELECT id, school_id, name, role_type, title, department, photo_url, years_of_service,
                email, office, office_hours, education, summary, bio
         FROM employees
         WHERE school_id = ?
         ORDER BY CASE WHEN role_type = 'Teaching' THEN 0 ELSE 1 END, id ASC`
      ).bind(schoolId),
    ]);

  return jsonResponse(request, {
    school: serializeSchool(school),
    schools: schoolsRes.results.map(serializeSchool),
    announcements: announcementsRes.results.map(serializeAnnouncement),
    events: eventsRes.results.map(serializeEvent),
    statistics: statsRes.results.map(serializeStat),
    employees: employeesRes.results.map(serializeEmployee),
  });
}

async function handleSchools(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  idOrSlug: string | null,
  url: URL
): Promise<Response> {
  const method = request.method;

  if (method === "GET" && !idOrSlug) {
    const includeInactive = url.searchParams.get("include_inactive") === "1";
    let showAll = false;
    if (includeInactive) {
      const auth = await authenticateRequest(request, env, ctx);
      showAll = Boolean(auth?.user.can_manage_portal);
    }

    const where = showAll ? "" : "WHERE is_active = 1";
    const result = await env.DB.prepare(
      `SELECT ${SCHOOL_COLUMNS}
       FROM schools
       ${where}
       ORDER BY is_default DESC, id ASC`
    ).all<SchoolRow>();

    return jsonResponse(request, {
      data: result.results.map(serializeSchool),
    });
  }

  if (method === "GET" && idOrSlug) {
    const asId = parsePositiveId(idOrSlug);
    const row = asId
      ? await env.DB.prepare(
          `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE id = ? LIMIT 1`
        )
          .bind(asId)
          .first<SchoolRow>()
      : await env.DB.prepare(
          `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE lower(slug) = lower(?) LIMIT 1`
        )
          .bind(idOrSlug)
          .first<SchoolRow>();

    if (!row) {
      return jsonResponse(request, { message: "School not found." }, 404);
    }
    return jsonResponse(request, { data: serializeSchool(row) });
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

  if (method === "POST" && !idOrSlug) {
    if (auth.user.role !== "admin") {
      return jsonResponse(
        request,
        { message: "Forbidden. Only administrators can register new schools." },
        403
      );
    }

    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, {
        name: ["Invalid JSON request body."],
      });
    }

    const errors: ValidationErrors = {};
    const rawSlug = validateStringField(
      body,
      "slug",
      { required: true, max: 64, slug: true },
      errors
    );
    const slug = rawSlug ? rawSlug.toLowerCase() : undefined;
    const shortName = validateStringField(
      body,
      "short_name",
      { required: true, max: 64 },
      errors
    );
    const name = validateStringField(
      body,
      "name",
      { required: true, max: 200 },
      errors
    );
    const tagline = validateStringField(
      body,
      "tagline",
      { required: true, max: 200 },
      errors
    );
    const gradeLevels =
      validateStringField(
        body,
        "grade_levels",
        { required: false, max: 120 },
        errors
      ) || "Kindergarten to Grade 6";
    const heroDescription = validateStringField(
      body,
      "hero_description",
      { required: true, max: 600 },
      errors
    );
    const heroImageUrl =
      validateStringField(
        body,
        "hero_image_url",
        { required: false, max: 255 },
        errors
      ) || "/assets/campus-hero.jpg";
    const primaryColor =
      validateStringField(
        body,
        "primary_color",
        { required: false, hexColor: true },
        errors
      ) || "#07187C";
    const primaryDarkColor =
      validateStringField(
        body,
        "primary_dark_color",
        { required: false, hexColor: true },
        errors
      ) || "#041246";
    const academicYear = validateStringField(
      body,
      "academic_year",
      { required: true, max: 64 },
      errors
    );
    const currentTerm = validateStringField(
      body,
      "current_term",
      { required: true, max: 120 },
      errors
    );
    const admissionsStatus = validateStringField(
      body,
      "admissions_status",
      { required: true, max: 120 },
      errors
    );
    const campusHours = validateStringField(
      body,
      "campus_hours",
      { required: true, max: 120 },
      errors
    );
    const phone = validateStringField(
      body,
      "phone",
      { required: true, max: 64 },
      errors
    );
    const email = validateStringField(
      body,
      "email",
      { required: true, email: true, max: 255 },
      errors
    );
    const address = validateStringField(
      body,
      "address",
      { required: true, max: 255 },
      errors
    );

    const schoolCode =
      body.school_code === null || body.school_code === undefined || body.school_code === ""
        ? null
        : validateStringField(body, "school_code", { required: false, max: 64 }, errors) ?? null;

    const logoUrl =
      body.logo_url === null || body.logo_url === undefined || body.logo_url === ""
        ? null
        : validateStringField(body, "logo_url", { required: false, max: 255 }, errors) ?? null;

    const rawDomain =
      body.custom_domain === null ||
      body.custom_domain === undefined ||
      body.custom_domain === ""
        ? null
        : validateStringField(
            body,
            "custom_domain",
            { required: false, max: 255 },
            errors
          )?.toLowerCase() ?? null;

    let isDefault = 0;
    if (body.is_default !== undefined) {
      if (typeof body.is_default !== "boolean") {
        addError(errors, "is_default", "The is default field must be true or false.");
      } else {
        isDefault = body.is_default ? 1 : 0;
      }
    }

    let isActive = 1;
    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        addError(errors, "is_active", "The is active field must be true or false.");
      } else {
        isActive = body.is_active ? 1 : 0;
      }
    }

    if (slug && Object.keys(errors).length === 0) {
      const dupSlug = await env.DB.prepare(
        "SELECT id FROM schools WHERE lower(slug) = lower(?) LIMIT 1"
      )
        .bind(slug)
        .first<{ id: number }>();
      if (dupSlug) {
        addError(errors, "slug", "A school with this slug already exists.");
      }
    }

    if (rawDomain && Object.keys(errors).length === 0) {
      const dupDomain = await env.DB.prepare(
        "SELECT id FROM schools WHERE lower(custom_domain) = lower(?) LIMIT 1"
      )
        .bind(rawDomain)
        .first<{ id: number }>();
      if (dupDomain) {
        addError(errors, "custom_domain", "This custom domain is already assigned to another school.");
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    if (isDefault === 1) {
      await env.DB.prepare("UPDATE schools SET is_default = 0").run();
    }

    const insert = await env.DB.prepare(
      `INSERT INTO schools (
         slug, school_code, short_name, name, tagline, grade_levels,
         hero_description, hero_image_url, logo_url, primary_color, primary_dark_color,
         academic_year, current_term, admissions_status, campus_hours,
         phone, email, address, custom_domain, is_default, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        slug,
        schoolCode,
        shortName,
        name,
        tagline,
        gradeLevels,
        heroDescription,
        heroImageUrl,
        logoUrl,
        primaryColor,
        primaryDarkColor,
        academicYear,
        currentTerm,
        admissionsStatus,
        campusHours,
        phone,
        email,
        address,
        rawDomain,
        isDefault,
        isActive
      )
      .run();

    const created = await env.DB.prepare(
      `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE id = ?`
    )
      .bind(insert.meta.last_row_id)
      .first<SchoolRow>();

    return jsonResponse(
      request,
      { data: created ? serializeSchool(created) : null },
      201
    );
  }

  if ((method === "PUT" || method === "PATCH") && idOrSlug) {
    const id = parsePositiveId(idOrSlug);
    if (!id) return jsonResponse(request, { message: "School not found." }, 404);

    if (!canManageSchool(auth.user, id)) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to edit this school." },
        403
      );
    }

    const existing = await env.DB.prepare(
      `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE id = ?`
    )
      .bind(id)
      .first<SchoolRow>();
    if (!existing) return jsonResponse(request, { message: "School not found." }, 404);

    const body = await readJsonBody(request);
    if (!body) {
      return validationErrorResponse(request, { name: ["Invalid JSON request body."] });
    }

    const errors: ValidationErrors = {};
    const rawSlug = Object.prototype.hasOwnProperty.call(body, "slug")
      ? validateStringField(body, "slug", { required: true, max: 64, slug: true }, errors)
      : existing.slug;
    const slug = rawSlug ? rawSlug.toLowerCase() : existing.slug;

    const shortName = Object.prototype.hasOwnProperty.call(body, "short_name")
      ? validateStringField(body, "short_name", { required: true, max: 64 }, errors)
      : existing.short_name;
    const name = Object.prototype.hasOwnProperty.call(body, "name")
      ? validateStringField(body, "name", { required: true, max: 200 }, errors)
      : existing.name;
    const tagline = Object.prototype.hasOwnProperty.call(body, "tagline")
      ? validateStringField(body, "tagline", { required: true, max: 200 }, errors)
      : existing.tagline;
    const gradeLevels = Object.prototype.hasOwnProperty.call(body, "grade_levels")
      ? validateStringField(body, "grade_levels", { required: true, max: 120 }, errors)
      : existing.grade_levels;
    const heroDescription = Object.prototype.hasOwnProperty.call(body, "hero_description")
      ? validateStringField(body, "hero_description", { required: true, max: 600 }, errors)
      : existing.hero_description;
    const heroImageUrl = Object.prototype.hasOwnProperty.call(body, "hero_image_url")
      ? validateStringField(body, "hero_image_url", { required: true, max: 255 }, errors)
      : existing.hero_image_url;
    const primaryColor = Object.prototype.hasOwnProperty.call(body, "primary_color")
      ? validateStringField(body, "primary_color", { required: true, hexColor: true }, errors)
      : existing.primary_color;
    const primaryDarkColor = Object.prototype.hasOwnProperty.call(body, "primary_dark_color")
      ? validateStringField(
          body,
          "primary_dark_color",
          { required: true, hexColor: true },
          errors
        )
      : existing.primary_dark_color;
    const academicYear = Object.prototype.hasOwnProperty.call(body, "academic_year")
      ? validateStringField(body, "academic_year", { required: true, max: 64 }, errors)
      : existing.academic_year;
    const currentTerm = Object.prototype.hasOwnProperty.call(body, "current_term")
      ? validateStringField(body, "current_term", { required: true, max: 120 }, errors)
      : existing.current_term;
    const admissionsStatus = Object.prototype.hasOwnProperty.call(body, "admissions_status")
      ? validateStringField(body, "admissions_status", { required: true, max: 120 }, errors)
      : existing.admissions_status;
    const campusHours = Object.prototype.hasOwnProperty.call(body, "campus_hours")
      ? validateStringField(body, "campus_hours", { required: true, max: 120 }, errors)
      : existing.campus_hours;
    const phone = Object.prototype.hasOwnProperty.call(body, "phone")
      ? validateStringField(body, "phone", { required: true, max: 64 }, errors)
      : existing.phone;
    const email = Object.prototype.hasOwnProperty.call(body, "email")
      ? validateStringField(body, "email", { required: true, email: true, max: 255 }, errors)
      : existing.email;
    const address = Object.prototype.hasOwnProperty.call(body, "address")
      ? validateStringField(body, "address", { required: true, max: 255 }, errors)
      : existing.address;

    let schoolCode = existing.school_code;
    if (Object.prototype.hasOwnProperty.call(body, "school_code")) {
      schoolCode =
        body.school_code === null || body.school_code === undefined || body.school_code === ""
          ? null
          : validateStringField(body, "school_code", { required: false, max: 64 }, errors) ?? null;
    }

    let logoUrl = existing.logo_url;
    if (Object.prototype.hasOwnProperty.call(body, "logo_url")) {
      logoUrl =
        body.logo_url === null || body.logo_url === undefined || body.logo_url === ""
          ? null
          : validateStringField(body, "logo_url", { required: false, max: 255 }, errors) ?? null;
    }

    let customDomain = existing.custom_domain;
    if (Object.prototype.hasOwnProperty.call(body, "custom_domain")) {
      customDomain =
        body.custom_domain === null ||
        body.custom_domain === undefined ||
        body.custom_domain === ""
          ? null
          : validateStringField(
              body,
              "custom_domain",
              { required: false, max: 255 },
              errors
            )?.toLowerCase() ?? null;
    }

    let isDefault = existing.is_default ? 1 : 0;
    if (Object.prototype.hasOwnProperty.call(body, "is_default")) {
      if (typeof body.is_default !== "boolean") {
        addError(errors, "is_default", "The is default field must be true or false.");
      } else {
        isDefault = body.is_default ? 1 : 0;
      }
    }

    let isActive = existing.is_active ? 1 : 0;
    if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
      if (typeof body.is_active !== "boolean") {
        addError(errors, "is_active", "The is active field must be true or false.");
      } else {
        isActive = body.is_active ? 1 : 0;
      }
    }

    if (slug && Object.keys(errors).length === 0) {
      const dupSlug = await env.DB.prepare(
        "SELECT id FROM schools WHERE lower(slug) = lower(?) AND id != ? LIMIT 1"
      )
        .bind(slug, id)
        .first<{ id: number }>();
      if (dupSlug) {
        addError(errors, "slug", "A school with this slug already exists.");
      }
    }

    if (customDomain && Object.keys(errors).length === 0) {
      const dupDomain = await env.DB.prepare(
        "SELECT id FROM schools WHERE lower(custom_domain) = lower(?) AND id != ? LIMIT 1"
      )
        .bind(customDomain, id)
        .first<{ id: number }>();
      if (dupDomain) {
        addError(errors, "custom_domain", "This custom domain is already assigned to another school.");
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(request, errors);
    }

    if (isDefault === 1) {
      await env.DB.prepare("UPDATE schools SET is_default = 0 WHERE id != ?")
        .bind(id)
        .run();
    }

    await env.DB.prepare(
      `UPDATE schools
       SET slug = ?, school_code = ?, short_name = ?, name = ?, tagline = ?, grade_levels = ?,
           hero_description = ?, hero_image_url = ?, logo_url = ?, primary_color = ?, primary_dark_color = ?,
           academic_year = ?, current_term = ?, admissions_status = ?, campus_hours = ?,
           phone = ?, email = ?, address = ?, custom_domain = ?, is_default = ?, is_active = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(
        slug,
        schoolCode,
        shortName,
        name,
        tagline,
        gradeLevels,
        heroDescription,
        heroImageUrl,
        logoUrl,
        primaryColor,
        primaryDarkColor,
        academicYear,
        currentTerm,
        admissionsStatus,
        campusHours,
        phone,
        email,
        address,
        customDomain,
        isDefault,
        isActive,
        id
      )
      .run();

    const updated = await env.DB.prepare(
      `SELECT ${SCHOOL_COLUMNS} FROM schools WHERE id = ?`
    )
      .bind(id)
      .first<SchoolRow>();

    return jsonResponse(request, {
      data: updated ? serializeSchool(updated) : null,
    });
  }

  if (method === "DELETE" && idOrSlug) {
    if (auth.user.role !== "admin") {
      return jsonResponse(
        request,
        { message: "Forbidden. Only administrators can delete schools." },
        403
      );
    }

    const id = parsePositiveId(idOrSlug);
    if (!id) return jsonResponse(request, { message: "School not found." }, 404);

    const countRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM schools").first<{
      total: number;
    }>();
    if (Number(countRow?.total ?? 0) <= 1) {
      return jsonResponse(
        request,
        { message: "Cannot delete the last remaining school." },
        422
      );
    }

    const target = await env.DB.prepare(
      "SELECT id, is_default FROM schools WHERE id = ? LIMIT 1"
    )
      .bind(id)
      .first<{ id: number; is_default: number }>();
    if (!target) return jsonResponse(request, { message: "School not found." }, 404);

    await env.DB.batch([
      env.DB.prepare("DELETE FROM announcements WHERE school_id = ?").bind(id),
      env.DB.prepare("DELETE FROM campus_events WHERE school_id = ?").bind(id),
      env.DB.prepare("DELETE FROM school_stats WHERE school_id = ?").bind(id),
      env.DB.prepare("DELETE FROM employees WHERE school_id = ?").bind(id),
      env.DB.prepare("UPDATE users SET school_id = NULL WHERE school_id = ?").bind(id),
      env.DB.prepare("DELETE FROM schools WHERE id = ?").bind(id),
    ]);

    if (target.is_default) {
      const replacement = await env.DB.prepare(
        "SELECT id FROM schools WHERE is_active = 1 ORDER BY id ASC LIMIT 1"
      ).first<{ id: number }>();
      if (replacement) {
        await env.DB.prepare("UPDATE schools SET is_default = 1 WHERE id = ?")
          .bind(replacement.id)
          .run();
      }
    }

    return jsonResponse(request, { message: "School deleted." });
  }

  return jsonResponse(request, { message: "Method not allowed." }, 405);
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
    "SELECT id, name, email, role, school_id, password_hash FROM users WHERE lower(email) = lower(?) LIMIT 1"
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
    const school = await resolveSchool(request, env, url);
    if (!school) return jsonResponse(request, { message: "School not found." }, 404);

    const category = url.searchParams.get("category")?.trim();
    const search = url.searchParams.get("search")?.trim();
    const conditions: string[] = ["school_id = ?"];
    const params: unknown[] = [Number(school.id)];

    if (category && category !== "all") {
      conditions.push("category = ?");
      params.push(category);
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push("(title LIKE ? OR excerpt LIKE ? OR office LIKE ?)");
      params.push(term, term, term);
    }

    const result = await env.DB.prepare(
      `SELECT id, school_id, title, category, is_pinned, published_at, office, excerpt, body
       FROM announcements
       WHERE ${conditions.join(" AND ")}
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
      "SELECT id, school_id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
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

    const target = await resolveTargetSchoolIdForWrite(
      request,
      env,
      url,
      auth.user,
      body
    );
    if ("error" in target) return target.error;

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
      `INSERT INTO announcements (school_id, title, category, is_pinned, published_at, office, excerpt, body)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(target.schoolId, title, category, isPinned, publishedAt, office, excerpt, content)
      .run();

    const created = await env.DB.prepare(
      "SELECT id, school_id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
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
      "SELECT id, school_id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
    )
      .bind(id)
      .first<AnnouncementRow>();
    if (!existing) return jsonResponse(request, { message: "Announcement not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to edit this record." },
        403
      );
    }

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
      "SELECT id, school_id, title, category, is_pinned, published_at, office, excerpt, body FROM announcements WHERE id = ?"
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

    const existing = await env.DB.prepare(
      "SELECT id, school_id FROM announcements WHERE id = ?"
    )
      .bind(id)
      .first<{ id: number; school_id: number }>();
    if (!existing) return jsonResponse(request, { message: "Announcement not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to delete this record." },
        403
      );
    }

    await env.DB.prepare("DELETE FROM announcements WHERE id = ?").bind(id).run();
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
    const school = await resolveSchool(request, env, url);
    if (!school) return jsonResponse(request, { message: "School not found." }, 404);

    const category = url.searchParams.get("category")?.trim();
    const hasCategory = Boolean(category && category !== "all");
    const stmt = hasCategory
      ? env.DB.prepare(
          `SELECT id, school_id, title, category, event_date, time_range, location, host, description
           FROM campus_events
           WHERE school_id = ? AND category = ?
           ORDER BY event_date ASC, id ASC`
        ).bind(Number(school.id), category)
      : env.DB.prepare(
          `SELECT id, school_id, title, category, event_date, time_range, location, host, description
           FROM campus_events
           WHERE school_id = ?
           ORDER BY event_date ASC, id ASC`
        ).bind(Number(school.id));
    const result = await stmt.all<EventRow>();
    return jsonResponse(request, { data: result.results.map(serializeEvent) });
  }

  if (method === "GET" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Event not found." }, 404);
    const row = await env.DB.prepare(
      "SELECT id, school_id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
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

    const target = await resolveTargetSchoolIdForWrite(
      request,
      env,
      url,
      auth.user,
      body
    );
    if ("error" in target) return target.error;

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
      `INSERT INTO campus_events (school_id, title, category, event_date, time_range, location, host, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(target.schoolId, title, category, eventDate, timeRange, location, host, description)
      .run();

    const created = await env.DB.prepare(
      "SELECT id, school_id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
    )
      .bind(insert.meta.last_row_id)
      .first<EventRow>();

    return jsonResponse(request, { data: created ? serializeEvent(created) : null }, 201);
  }

  if ((method === "PUT" || method === "PATCH") && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Event not found." }, 404);

    const existing = await env.DB.prepare(
      "SELECT id, school_id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
    )
      .bind(id)
      .first<EventRow>();
    if (!existing) return jsonResponse(request, { message: "Event not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to edit this record." },
        403
      );
    }

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
      "SELECT id, school_id, title, category, event_date, time_range, location, host, description FROM campus_events WHERE id = ?"
    )
      .bind(id)
      .first<EventRow>();

    return jsonResponse(request, { data: updated ? serializeEvent(updated) : null });
  }

  if (method === "DELETE" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Event not found." }, 404);

    const existing = await env.DB.prepare(
      "SELECT id, school_id FROM campus_events WHERE id = ?"
    )
      .bind(id)
      .first<{ id: number; school_id: number }>();
    if (!existing) return jsonResponse(request, { message: "Event not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to delete this record." },
        403
      );
    }

    await env.DB.prepare("DELETE FROM campus_events WHERE id = ?").bind(id).run();
    return jsonResponse(request, { message: "Event deleted." });
  }

  return jsonResponse(request, { message: "Method not allowed." }, 405);
}

async function handleStatistics(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
  idParam: string | null,
  url: URL
): Promise<Response> {
  const method = request.method;

  if (method === "GET" && !idParam) {
    const school = await resolveSchool(request, env, url);
    if (!school) return jsonResponse(request, { message: "School not found." }, 404);

    const result = await env.DB.prepare(
      `SELECT id, school_id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order
       FROM school_stats
       WHERE school_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
      .bind(Number(school.id))
      .all<StatRow>();
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

    const target = await resolveTargetSchoolIdForWrite(
      request,
      env,
      url,
      auth.user,
      body
    );
    if ("error" in target) return target.error;

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
      `INSERT INTO school_stats (school_id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(target.schoolId, label, numericTarget, decimals, suffix, subtitle, icon, sortOrder)
      .run();

    const created = await env.DB.prepare(
      "SELECT id, school_id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order FROM school_stats WHERE id = ?"
    )
      .bind(insert.meta.last_row_id)
      .first<StatRow>();

    return jsonResponse(request, { data: created ? serializeStat(created) : null }, 201);
  }

  if ((method === "PUT" || method === "PATCH") && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Statistic not found." }, 404);

    const existing = await env.DB.prepare(
      "SELECT id, school_id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order FROM school_stats WHERE id = ?"
    )
      .bind(id)
      .first<StatRow>();
    if (!existing) return jsonResponse(request, { message: "Statistic not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to edit this record." },
        403
      );
    }

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
      "SELECT id, school_id, label, numeric_target, decimals, suffix, subtitle, icon, sort_order FROM school_stats WHERE id = ?"
    )
      .bind(id)
      .first<StatRow>();

    return jsonResponse(request, { data: updated ? serializeStat(updated) : null });
  }

  if (method === "DELETE" && idParam) {
    const id = parsePositiveId(idParam);
    if (!id) return jsonResponse(request, { message: "Statistic not found." }, 404);

    const existing = await env.DB.prepare(
      "SELECT id, school_id FROM school_stats WHERE id = ?"
    )
      .bind(id)
      .first<{ id: number; school_id: number }>();
    if (!existing) return jsonResponse(request, { message: "Statistic not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to delete this record." },
        403
      );
    }

    await env.DB.prepare("DELETE FROM school_stats WHERE id = ?").bind(id).run();
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
    const school = await resolveSchool(request, env, url);
    if (!school) return jsonResponse(request, { message: "School not found." }, 404);

    const roleType = url.searchParams.get("role_type")?.trim();
    const department = url.searchParams.get("department")?.trim();
    const search = url.searchParams.get("search")?.trim();
    const conditions: string[] = ["school_id = ?"];
    const params: unknown[] = [Number(school.id)];

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

    const result = await env.DB.prepare(
      `SELECT id, school_id, name, role_type, title, department, photo_url, years_of_service,
              email, office, office_hours, education, summary, bio
       FROM employees
       WHERE ${conditions.join(" AND ")}
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
      `SELECT id, school_id, name, role_type, title, department, photo_url, years_of_service,
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

    const target = await resolveTargetSchoolIdForWrite(
      request,
      env,
      url,
      auth.user,
      body
    );
    if ("error" in target) return target.error;

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
         school_id, name, role_type, title, department, photo_url, years_of_service,
         email, office, office_hours, education, summary, bio
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        target.schoolId,
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
      `SELECT id, school_id, name, role_type, title, department, photo_url, years_of_service,
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
      `SELECT id, school_id, name, role_type, title, department, photo_url, years_of_service,
              email, office, office_hours, education, summary, bio
       FROM employees
       WHERE id = ?`
    )
      .bind(id)
      .first<EmployeeRow>();
    if (!existing) return jsonResponse(request, { message: "Employee not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to edit this record." },
        403
      );
    }

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
      `SELECT id, school_id, name, role_type, title, department, photo_url, years_of_service,
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

    const existing = await env.DB.prepare(
      "SELECT id, school_id FROM employees WHERE id = ?"
    )
      .bind(id)
      .first<{ id: number; school_id: number }>();
    if (!existing) return jsonResponse(request, { message: "Employee not found." }, 404);
    if (!canManageSchool(auth.user, Number(existing.school_id))) {
      return jsonResponse(
        request,
        { message: "Forbidden. You do not have permission to delete this record." },
        403
      );
    }

    await env.DB.prepare("DELETE FROM employees WHERE id = ?").bind(id).run();
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
          "Cloudflare D1 database binding (DB) is not configured for this environment.",
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
    return handlePortalOverview(request, env, ctx, url);
  }

  if (segments[0] === "schools" && segments.length <= 2) {
    return handleSchools(request, env, ctx, segments[1] ?? null, url);
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
    return handleStatistics(request, env, ctx, segments[1] ?? null, url);
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
