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
  can_manage_portal: boolean;
  is_super_admin?: boolean;
}
