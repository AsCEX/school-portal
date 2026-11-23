export type AdminPermission =
  | "manage_schools"
  | "manage_announcements"
  | "manage_events"
  | "manage_statistics"
  | "manage_employees"
  | "manage_accounts";

export const ALL_ADMIN_PERMISSIONS: ReadonlyArray<{
  key: AdminPermission;
  label: string;
  description: string;
}> = [
  {
    key: "manage_schools",
    label: "Schools & Profiles",
    description: "Edit school details, hero settings, theme colors, and contact info",
  },
  {
    key: "manage_announcements",
    label: "Announcements",
    description: "Create, publish, pin, edit, and delete school announcements",
  },
  {
    key: "manage_events",
    label: "Upcoming Events",
    description: "Schedule, update, and remove campus calendar events",
  },
  {
    key: "manage_statistics",
    label: "School Statistics",
    description: "Manage published school counters and enrollment metrics",
  },
  {
    key: "manage_employees",
    label: "Employee Profiles",
    description: "Add, edit, and remove teaching and non-teaching directory records",
  },
  {
    key: "manage_accounts",
    label: "Employee Logins & Roles",
    description: "Assign employee login credentials, roles, and permissions",
  },
];

export interface EmployeeAccount {
  user_id: number;
  employee_id: number;
  email: string;
  role: "admin" | "faculty" | "student" | "parent";
  permissions: AdminPermission[];
  school_id: number | null;
  is_active: boolean;
}

export interface SchoolInfo {
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
  is_default: boolean;
  is_active: boolean;
}

export interface Announcement {
  id: number;
  school_id?: number;
  title: string;
  category: "Important" | "Academics" | "Admissions" | "Campus Life" | string;
  is_pinned: boolean;
  published_at: string;
  office: string;
  excerpt: string;
  body: string;
}

export interface CampusEvent {
  id: number;
  school_id?: number;
  title: string;
  category: "Academic" | "Community" | "Athletics" | "Arts" | string;
  event_date: string;
  month_label: string;
  day_label: string;
  time_range: string;
  location: string;
  host: string;
  description: string;
}

export interface SchoolStat {
  id: number;
  school_id?: number;
  label: string;
  numeric_target: number;
  decimals: number;
  suffix: string | null;
  subtitle: string;
  icon: "students" | "graduation" | "ratio" | "staff" | "clubs" | "library" | string;
  sort_order: number;
}

export interface Employee {
  id: number;
  school_id?: number;
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
  account?: EmployeeAccount | null;
}

export interface PortalOverview {
  school: SchoolInfo;
  schools: SchoolInfo[];
  announcements: Announcement[];
  events: CampusEvent[];
  statistics: SchoolStat[];
  employees: Employee[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student" | "parent";
  school_id?: number | null;
  employee_id?: number | null;
  permissions: AdminPermission[];
  is_active?: boolean;
  can_manage_portal: boolean;
  is_super_admin?: boolean;
}
