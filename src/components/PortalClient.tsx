"use client";

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchPortalOverview } from "@/lib/api";
import type {
  Announcement,
  CampusEvent,
  Employee,
  PortalOverview,
  SchoolStat,
} from "@/types/portal";
import { SchoolCrest, StatIcon } from "./Icons";

const SAVED_EVENTS_KEY = "alnces_saved_events_v1";

function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function AnimatedStatNumber({
  stat,
  active,
}: {
  stat: SchoolStat;
  active: boolean;
}) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!active) return;

    const finalFormatted =
      stat.decimals > 0
        ? stat.numeric_target.toFixed(stat.decimals)
        : Math.round(stat.numeric_target).toLocaleString();
    const finalText = `${finalFormatted}${stat.suffix ?? ""}`;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(finalText);
      return;
    }

    const duration = 1100;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = stat.numeric_target * eased;
      const formatted =
        stat.decimals > 0
          ? current.toFixed(stat.decimals)
          : Math.round(current).toLocaleString();
      setDisplay(`${formatted}${stat.suffix ?? ""}`);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplay(finalText);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, stat.decimals, stat.numeric_target, stat.suffix]);

  return <div className="stat-value">{display}</div>;
}

export function PortalClient() {
  const [portal, setPortal] = useState<PortalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const [announcementCategory, setAnnouncementCategory] = useState("all");
  const [eventCategory, setEventCategory] = useState("all");
  const [savedEventIds, setSavedEventIds] = useState<number[]>([]);

  const [staffRole, setStaffRole] = useState<"all" | "Teaching" | "Non-Teaching">("all");
  const [staffDepartment, setStaffDepartment] = useState("all");
  const [staffQuery, setStaffQuery] = useState("");
  const deferredStaffQuery = useDeferredValue(staffQuery);
  const hasPortalData = portal !== null;

  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLElement | null>(null);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const loadPortalData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const overview = await fetchPortalOverview();
      setPortal(overview);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Unable to connect to Laravel API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();

    // Load saved event bookmarks
    try {
      const raw = localStorage.getItem(SAVED_EVENTS_KEY);
      if (raw) {
        setSavedEventIds(JSON.parse(raw) as number[]);
      }
    } catch {
      // ignore storage errors
    }
  }, [loadPortalData]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["home", "announcements", "statistics", "directory"];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [hasPortalData]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasPortalData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAnnouncement(null);
        setSelectedEvent(null);
        setSelectedEmployee(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleSaveEvent = (eventId: number) => {
    setSavedEventIds((prev) => {
      const next = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];
      localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const savedEventSet = useMemo(() => new Set(savedEventIds), [savedEventIds]);

  const announcements = useMemo(() => {
    const items = portal?.announcements ?? [];
    if (announcementCategory === "all") return items;
    return items.filter((a) => a.category === announcementCategory);
  }, [portal, announcementCategory]);

  const events = useMemo(() => {
    const items = portal?.events ?? [];
    if (eventCategory === "all") return items;
    return items.filter((ev) => ev.category === eventCategory);
  }, [portal, eventCategory]);

  const allEmployees = useMemo(() => portal?.employees ?? [], [portal]);

  const { departments, teachingCount, nonTeachingCount } = useMemo(() => {
    const deptSet = new Set<string>();
    let teaching = 0;
    let nonTeaching = 0;
    for (const emp of allEmployees) {
      deptSet.add(emp.department);
      if (emp.role_type === "Teaching") teaching += 1;
      else nonTeaching += 1;
    }
    return {
      departments: Array.from(deptSet).sort(),
      teachingCount: teaching,
      nonTeachingCount: nonTeaching,
    };
  }, [allEmployees]);

  const filteredEmployees = useMemo(() => {
    const q = deferredStaffQuery.trim().toLowerCase();
    return allEmployees.filter((emp) => {
      const matchesRole = staffRole === "all" || emp.role_type === staffRole;
      const matchesDept =
        staffDepartment === "all" || emp.department === staffDepartment;
      const matchesQuery =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.title.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.summary.toLowerCase().includes(q);
      return matchesRole && matchesDept && matchesQuery;
    });
  }, [allEmployees, staffRole, staffDepartment, deferredStaffQuery]);

  const school = portal?.school ?? {
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
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* Top Utility Bar */}
      <div className="utility-bar">
        <div className="container utility-inner">
          <div className="utility-left">
            <span className="utility-status">
              <span className="status-dot" aria-hidden="true" />
              {school.academic_year} &middot; Live Portal System
            </span>
          </div>
          <div className="utility-right">
            <a href="#announcements" className="utility-link">
              Academic Calendar
            </a>
            <span className="utility-divider" aria-hidden="true">
              |
            </span>
            <a href="#statistics" className="utility-link">
              School Statistics
            </a>
            <span className="utility-divider" aria-hidden="true">
              |
            </span>
            <a href="#directory" className="utility-link">
              Staff Directory
            </a>
            <span className="utility-divider" aria-hidden="true">
              |
            </span>
            <a href={`tel:${school.phone}`} className="utility-link">
              {school.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Sticky Header */}
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="container header-inner">
          <a href="#home" className="brand" aria-label={`${school.name} Home`}>
            <span className="brand-crest" aria-hidden="true">
              <SchoolCrest />
            </span>
            <span className="brand-text">
              <span className="brand-name">{school.short_name || "ALNAVARROCES"}</span>
              <span className="brand-sub">{school.name}</span>
            </span>
          </a>

          <nav className="main-nav" aria-label="Primary Navigation">
            <ul className="nav-list">
              <li>
                <a
                  href="#home"
                  className={`nav-link ${activeSection === "home" ? "active" : ""}`}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#announcements"
                  className={`nav-link ${activeSection === "announcements" ? "active" : ""
                    }`}
                >
                  Announcements &amp; Events
                </a>
              </li>
              <li>
                <a
                  href="#statistics"
                  className={`nav-link ${activeSection === "statistics" ? "active" : ""
                    }`}
                >
                  Statistics
                </a>
              </li>
              <li>
                <a
                  href="#directory"
                  className={`nav-link ${activeSection === "directory" ? "active" : ""
                    }`}
                >
                  Faculty &amp; Staff
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav">
            <div className="container mobile-nav-inner">
              <a
                href="#home"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#announcements"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Announcements &amp; Events
              </a>
              <a
                href="#statistics"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                School Statistics
              </a>
              <a
                href="#directory"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Teaching &amp; Non-Teaching Staff
              </a>
            </div>
          </div>
        )}
      </header>

      {/* API Connection Warning (if Laravel server isn't up yet) */}
      {apiError && (
        <div className="api-status-banner" role="alert">
          <div className="container api-status-inner">
            <span>
              <strong>Backend API unreachable:</strong> {apiError}. Start Laravel with{" "}
              <code>cd backend &amp;&amp; php artisan serve</code>.
            </span>
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={loadPortalData}
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      <main id="main-content">
        {/* Hero Banner */}
        <section className="hero" id="home" aria-label={`Welcome to ${school.name}`}>
          <div className="hero-media">
            <img
              src="/assets/campus-hero.jpg"
              alt="A.L. Navarro Central Elementary School campus courtyard and buildings"
              fetchPriority="high"
              className="hero-img"
            />
            <div className="hero-overlay" aria-hidden="true" />
          </div>

          <div className="container hero-content">
            <div className="hero-body">
              <div className="hero-badge">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 1.5L10 5.5L14.5 6.2L11.2 9.4L12 13.8L8 11.7L4 13.8L4.8 9.4L1.5 6.2L6 5.5L8 1.5Z"
                    fill="currentColor"
                  />
                </svg>
                {school.short_name || "ALNAVARROCES"} &middot; Kindergarten to Grade 6
              </div>
              <h1 className="hero-title">
                A.L. Navarro Central Elementary School
              </h1>
              <p className="hero-lead">
                Welcome to the {school.short_name || "ALNAVARROCES"} official school portal —
                your central hub for announcements, upcoming campus events, school
                statistics, and our dedicated teaching and non-teaching personnel directory.
              </p>
              <div className="hero-actions">
                <a href="#announcements" className="btn btn-white btn-lg">
                  Latest Announcements
                  <svg className="btn-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M4.5 10H15.5M15.5 10L11 5.5M15.5 10L11 14.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a href="#directory" className="btn btn-outline-white btn-lg">
                  Meet Our Staff
                </a>
              </div>
            </div>
          </div>

          {/* Hero Quick Info Strip */}
          <div className="hero-strip-wrap">
            <div className="container">
              <div className="hero-strip">
                <div className="strip-item">
                  <div className="strip-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="2.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M3 10H21M8 3V6M16 3V6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="strip-label">Current Term</span>
                    <strong className="strip-value">{school.current_term}</strong>
                  </div>
                </div>

                <div className="strip-item">
                  <div className="strip-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3L2 8.5L12 14L22 8.5L12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 11V16.5C6 18.2 8.7 19.5 12 19.5C15.3 19.5 18 18.2 18 16.5V11"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="strip-label">Admissions 2027</span>
                    <strong className="strip-value">{school.admissions_status}</strong>
                  </div>
                </div>

                <div className="strip-item">
                  <div className="strip-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                      <path
                        d="M12 7V12L15.5 14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="strip-label">Campus Hours</span>
                    <strong className="strip-value">{school.campus_hours}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements & Events */}
        <section
          className="section section-tinted"
          id="announcements"
          aria-labelledby="announcements-heading"
        >
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Campus Pulse</span>
                <h2 className="section-title" id="announcements-heading">
                  Announcements &amp; Upcoming Events
                </h2>
                <p className="section-desc">
                  Stay up to date with official administrative notices, academic deadlines,
                  and school-wide celebrations synced directly from the Laravel backend.
                </p>
              </div>
              <div className="saved-counter-pill" aria-live="polite">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 3.5H15C15.5523 3.5 16 3.94772 16 4.5V17L10 13.5L4 17V4.5C4 3.94772 4.44772 3.5 5 3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  <strong>{savedEventIds.length}</strong> Saved Events
                </span>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading announcements &amp; campus events...</div>
            ) : (
              <div className="news-events-grid">
                {/* Announcements */}
                <div>
                  <div className="panel-toolbar">
                    <h3 className="panel-heading">Official Announcements</h3>
                    <div
                      className="filter-pills"
                      role="tablist"
                      aria-label="Filter announcements by category"
                    >
                      {["all", "Important", "Academics", "Admissions", "Campus Life"].map(
                        (cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={`pill ${announcementCategory === cat ? "active" : ""}`}
                            role="tab"
                            aria-selected={announcementCategory === cat}
                            onClick={() => setAnnouncementCategory(cat)}
                          >
                            {cat === "all" ? "All" : cat}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="announcements-list">
                    {announcements.length === 0 ? (
                      <div className="empty-state">
                        <p className="empty-title">No announcements in this category.</p>
                      </div>
                    ) : (
                      announcements.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`announcement-card ${item.is_pinned ? "is-pinned" : ""}`}
                          onClick={() => setSelectedAnnouncement(item)}
                        >
                          <div className="announcement-meta">
                            {item.is_pinned && (
                              <span className="tag tag-solid">Pinned Notice</span>
                            )}
                            <span className="tag tag-soft">{item.category}</span>
                            <span className="announcement-date">
                              {formatDate(item.published_at)}
                            </span>
                          </div>
                          <h4 className="announcement-title">{item.title}</h4>
                          <p className="announcement-excerpt">{item.excerpt}</p>
                          <div className="announcement-footer">
                            <span className="announcement-office">{item.office}</span>
                            <span className="read-more-link">
                              Read notice
                              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path
                                  d="M3.5 8H12.5M12.5 8L8.8 4.3M12.5 8L8.8 11.7"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Events */}
                <aside aria-label="Upcoming Campus Events">
                  <div className="events-card">
                    <div className="events-card-header">
                      <div>
                        <span className="events-kicker">Campus Schedule</span>
                        <h3 className="events-title">Upcoming Events</h3>
                      </div>
                      <div>
                        <label htmlFor="event-category-filter" className="sr-only">
                          Filter events
                        </label>
                        <select
                          id="event-category-filter"
                          className="event-select"
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                        >
                          <option value="all">All Types</option>
                          <option value="Academic">Academic</option>
                          <option value="Community">Community</option>
                          <option value="Athletics">Athletics</option>
                          <option value="Arts">Arts</option>
                        </select>
                      </div>
                    </div>

                    <div className="events-list">
                      {events.length === 0 ? (
                        <div className="event-item">
                          <p className="announcement-excerpt" style={{ margin: 0 }}>
                            No upcoming events in this category.
                          </p>
                        </div>
                      ) : (
                        events.map((ev) => {
                          const saved = savedEventSet.has(ev.id);
                          return (
                            <div key={ev.id} className="event-item">
                              <div className="event-date-box" aria-hidden="true">
                                <span className="event-month">{ev.month_label}</span>
                                <span className="event-day">{ev.day_label}</span>
                              </div>
                              <button
                                type="button"
                                className="event-info"
                                onClick={() => setSelectedEvent(ev)}
                              >
                                <h4 className="event-name">{ev.title}</h4>
                                <div className="event-details">
                                  <span>{ev.time_range}</span>
                                  <span>&middot;</span>
                                  <span>{ev.location}</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                className={`event-bookmark-btn ${saved ? "is-saved" : ""}`}
                                aria-label={
                                  saved
                                    ? `Remove saved reminder for ${ev.title}`
                                    : `Save reminder for ${ev.title}`
                                }
                                aria-pressed={saved}
                                onClick={() => toggleSaveEvent(ev.id)}
                              >
                                <svg
                                  viewBox="0 0 20 20"
                                  fill={saved ? "currentColor" : "none"}
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M5 3.5H15C15.5523 3.5 16 3.94772 16 4.5V17L10 13.5L4 17V4.5C4 3.94772 4.44772 3.5 5 3.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="events-card-footer">
                      <span className="events-footnote">
                        Click any event for venue details or bookmark a reminder.
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>

        {/* School Statistics */}
        <section
          ref={statsRef}
          className="section stats-section"
          id="statistics"
          aria-labelledby="statistics-heading"
        >
          <div className="stats-pattern" aria-hidden="true" />
          <div className="container stats-container">
            <div className="section-header">
              <div>
                <span className="section-eyebrow eyebrow-light">
                  Institutional Overview
                </span>
                <h2 className="section-title title-light" id="statistics-heading">
                  School Statistics
                </h2>
                <p className="section-desc desc-light">
                  A transparent snapshot of our vibrant learning community, academic
                  outcomes, and dedicated teaching and support teams.
                </p>
              </div>
              <div className="accreditation-chip">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 2L12.4 4.2L15.6 4.4L16.4 7.5L18.5 10L16.4 12.5L15.6 15.6L12.4 15.8L10 18L7.6 15.8L4.4 15.6L3.6 12.5L1.5 10L3.6 7.5L4.4 4.4L7.6 4.2L10 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M7 10.2L9.1 12.2L13.2 8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                2026 Verified Annual Report
              </div>
            </div>

            <div className="stats-grid">
              {(portal?.statistics ?? []).map((stat) => (
                <article key={stat.id} className="stat-card">
                  <div className="stat-icon" aria-hidden="true">
                    <StatIcon name={stat.icon} />
                  </div>
                  <AnimatedStatNumber stat={stat} active={statsVisible} />
                  <h3 className="stat-label">{stat.label}</h3>
                  <p className="stat-sub">{stat.subtitle}</p>
                </article>
              ))}
            </div>

            <div className="stats-summary-bar">
              <div className="summary-bar-text">
                <strong>Dedicated Elementary Workforce:</strong> ALNAVARROCES educators and
                non-teaching staff work together to deliver child-friendly, inclusive K–6
                instruction, reading programs, and learner wellness services.
              </div>
              <a href="#directory" className="btn btn-white btn-sm">
                Browse Staff Directory
              </a>
            </div>
          </div>
        </section>

        {/* Teaching & Non-Teaching Employee Profiles */}
        <section className="section" id="directory" aria-labelledby="directory-heading">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Our People</span>
                <h2 className="section-title" id="directory-heading">
                  Teaching &amp; Non-Teaching Employee Profiles
                </h2>
                <p className="section-desc">
                  Connect with the educators, administrators, counselors, and campus
                  specialists who make {school.name} thrive every day.
                </p>
              </div>
            </div>

            <div className="directory-controls">
              <div
                className="role-tabs"
                role="tablist"
                aria-label="Filter employees by teaching or non-teaching classification"
              >
                <button
                  type="button"
                  className={`role-tab ${staffRole === "all" ? "active" : ""}`}
                  role="tab"
                  aria-selected={staffRole === "all"}
                  onClick={() => setStaffRole("all")}
                >
                  All Staff <span className="tab-count">{allEmployees.length}</span>
                </button>
                <button
                  type="button"
                  className={`role-tab ${staffRole === "Teaching" ? "active" : ""}`}
                  role="tab"
                  aria-selected={staffRole === "Teaching"}
                  onClick={() => setStaffRole("Teaching")}
                >
                  Teaching Faculty <span className="tab-count">{teachingCount}</span>
                </button>
                <button
                  type="button"
                  className={`role-tab ${staffRole === "Non-Teaching" ? "active" : ""}`}
                  role="tab"
                  aria-selected={staffRole === "Non-Teaching"}
                  onClick={() => setStaffRole("Non-Teaching")}
                >
                  Non-Teaching Staff <span className="tab-count">{nonTeachingCount}</span>
                </button>
              </div>

              <div className="directory-filters">
                <div className="search-box">
                  <svg className="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
                    <path
                      d="M13.5 13.5L17.5 17.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                  <label htmlFor="staff-search" className="sr-only">
                    Search employees
                  </label>
                  <input
                    type="search"
                    id="staff-search"
                    className="search-input"
                    placeholder="Search by name, title, or department..."
                    value={staffQuery}
                    onChange={(e) => setStaffQuery(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="department-filter" className="sr-only">
                    Filter by department
                  </label>
                  <select
                    id="department-filter"
                    className="dept-select"
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="directory-meta" aria-live="polite">
              Showing {filteredEmployees.length} of {allEmployees.length}{" "}
              {staffRole === "all"
                ? "employees"
                : staffRole === "Teaching"
                  ? "teaching faculty members"
                  : "non-teaching staff members"}
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="empty-state">
                <p className="empty-title">No employee profiles match your filters.</p>
                <p className="empty-desc">
                  Try clearing your search keyword or switching to All Staff.
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setStaffRole("all");
                    setStaffDepartment("all");
                    setStaffQuery("");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="staff-grid">
                {filteredEmployees.map((emp) => (
                  <article key={emp.id} className="staff-card">
                    <div className="staff-photo-wrap">
                      <img
                        src={emp.photo_url || "/assets/staff-1.jpg"}
                        alt={`Portrait of ${emp.name}, ${emp.title}`}
                        className="staff-photo"
                        loading="lazy"
                      />
                      <span
                        className={`staff-type-badge ${emp.role_type === "Teaching"
                          ? "badge-teaching"
                          : "badge-nonteaching"
                          }`}
                      >
                        {emp.role_type}
                      </span>
                    </div>
                    <div className="staff-body">
                      <span className="staff-dept">{emp.department}</span>
                      <h3 className="staff-name">{emp.name}</h3>
                      <p className="staff-title">{emp.title}</p>
                      <p className="staff-summary">{emp.summary}</p>
                      <div className="staff-card-footer">
                        <span className="staff-exp">{emp.years_of_service}</span>
                        <button
                          type="button"
                          className="staff-profile-btn"
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <a href="#home" className="brand brand-footer">
              <span className="brand-crest" aria-hidden="true">
                <SchoolCrest inverted />
              </span>
              <span className="brand-text">
                <span className="brand-name">{school.short_name || "ALNAVARROCES"}</span>
                <span className="brand-sub">{school.name}</span>
              </span>
            </a>
            <p className="footer-desc">
              Official Kindergarten–Grade 6 digital school portal powered by ACZolutions.
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Portal Navigation</h4>
            <ul className="footer-links">
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#announcements">Announcements &amp; Events</a>
              </li>
              <li>
                <a href="#statistics">School Statistics</a>
              </li>
              <li>
                <a href="#directory">Faculty &amp; Staff Directory</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Campus Resources</h4>
            <ul className="footer-links">
              <li>
                <a href="#announcements">Official Announcements</a>
              </li>
              <li>
                <a href="#announcements">Upcoming Campus Events</a>
              </li>
              <li>
                <a href="#statistics">Annual School Statistics</a>
              </li>
              <li>
                <a href="#directory">Teaching &amp; Non-Teaching Staff</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Campus Contact</h4>
            <address className="footer-address">
              {school.address}
              <br />
              <a href={`tel:${school.phone}`}>{school.phone}</a>
              <br />
              <a href={`mailto:${school.email}`}>{school.email}</a>
            </address>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <p>&copy; 2026 {school.name}. All rights reserved.</p>
            <p>Main Office: {school.campus_hours}</p>
          </div>
        </div>
      </footer>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ann-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAnnouncement(null);
          }}
        >
          <div className="modal-dialog">
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedAnnouncement(null)}
              aria-label="Close modal"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="announcement-meta">
              {selectedAnnouncement.is_pinned && (
                <span className="tag tag-solid">Pinned Notice</span>
              )}
              <span className="tag tag-soft">{selectedAnnouncement.category}</span>
              <span className="announcement-date">
                {formatDate(selectedAnnouncement.published_at)}
              </span>
            </div>
            <h3 className="modal-heading" id="ann-modal-title">
              {selectedAnnouncement.title}
            </h3>
            <div className="modal-meta-grid">
              <div>
                <span className="meta-cell-label">Issued By</span>
                <span className="meta-cell-value">{selectedAnnouncement.office}</span>
              </div>
              <div>
                <span className="meta-cell-label">Published</span>
                <span className="meta-cell-value">
                  {formatDate(selectedAnnouncement.published_at)}
                </span>
              </div>
            </div>
            <p className="modal-body-text">{selectedAnnouncement.body}</p>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evt-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEvent(null);
          }}
        >
          <div className="modal-dialog">
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close modal"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="announcement-meta">
              <span className="tag tag-solid">
                {selectedEvent.month_label} {selectedEvent.day_label}
              </span>
              <span className="tag tag-soft">{selectedEvent.category}</span>
            </div>
            <h3 className="modal-heading" id="evt-modal-title">
              {selectedEvent.title}
            </h3>
            <div className="modal-meta-grid">
              <div>
                <span className="meta-cell-label">Time</span>
                <span className="meta-cell-value">{selectedEvent.time_range}</span>
              </div>
              <div>
                <span className="meta-cell-label">Location</span>
                <span className="meta-cell-value">{selectedEvent.location}</span>
              </div>
              <div>
                <span className="meta-cell-label">Hosted By</span>
                <span className="meta-cell-value">{selectedEvent.host}</span>
              </div>
              <div>
                <span className="meta-cell-label">Date</span>
                <span className="meta-cell-value">
                  {formatDate(selectedEvent.event_date)}
                </span>
              </div>
            </div>
            <p className="modal-body-text">{selectedEvent.description}</p>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => toggleSaveEvent(selectedEvent.id)}
              >
                {savedEventSet.has(selectedEvent.id)
                  ? "Saved in Reminders"
                  : "Save Event Reminder"}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emp-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployee(null);
          }}
        >
          <div className="modal-dialog">
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedEmployee(null)}
              aria-label="Close modal"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="profile-modal-header">
              <img
                src={selectedEmployee.photo_url || "/assets/staff-1.jpg"}
                alt={`Portrait of ${selectedEmployee.name}`}
                className="profile-modal-avatar"
              />
              <div>
                <span
                  className={`tag ${selectedEmployee.role_type === "Teaching"
                    ? "tag-solid"
                    : "tag-outline"
                    }`}
                >
                  {selectedEmployee.role_type} Staff
                </span>
                <h3
                  className="modal-heading"
                  id="emp-modal-title"
                  style={{ paddingRight: 0, marginBottom: 4 }}
                >
                  {selectedEmployee.name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "var(--ink-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {selectedEmployee.title}
                </p>
              </div>
            </div>

            <div className="modal-meta-grid">
              <div>
                <span className="meta-cell-label">Department</span>
                <span className="meta-cell-value">{selectedEmployee.department}</span>
              </div>
              <div>
                <span className="meta-cell-label">Tenure</span>
                <span className="meta-cell-value">{selectedEmployee.years_of_service}</span>
              </div>
              <div>
                <span className="meta-cell-label">Office</span>
                <span className="meta-cell-value">{selectedEmployee.office}</span>
              </div>
              <div>
                <span className="meta-cell-label">Office Hours</span>
                <span className="meta-cell-value">{selectedEmployee.office_hours}</span>
              </div>
            </div>

            <p
              style={{
                margin: "0 0 8px",
                fontSize: "0.84rem",
                color: "var(--primary)",
                fontWeight: 700,
              }}
            >
              Education: {selectedEmployee.education}
            </p>
            <p className="modal-body-text" style={{ marginTop: 8 }}>
              {selectedEmployee.bio}
            </p>
            <div className="modal-actions-row">
              <a
                href={`mailto:${selectedEmployee.email}`}
                className="btn btn-primary btn-sm"
              >
                Email {selectedEmployee.name.split(" ")[0]}
              </a>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
