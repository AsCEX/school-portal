-- ALNAVARROCES School Portal — Initial Seed Data
-- Demo account password for all accounts: "password" (PBKDF2-SHA256, 100,000 iterations)

INSERT OR IGNORE INTO users (name, email, role, password_hash) VALUES
  (
    'Dr. Elena Vance',
    'admin@alnavarroces.edu.ph',
    'admin',
    'pbkdf2_sha256$100000$4bbcfefe3255c8cb252336afbe8732f9$e06d4fd0da85fb7b910b25c7d5378e472a6a0b73f188843cfe6abc114a28fa6e'
  ),
  (
    'Mr. Marcus Chen',
    'faculty@alnavarroces.edu.ph',
    'faculty',
    'pbkdf2_sha256$100000$48c920fb46cb2de04b2521a889f956c0$916cab287acd61585ecd2995c10dae0bdbc39f367b084b4e57ab10666bdcca52'
  ),
  (
    'Jordan Lin',
    'student@alnavarroces.edu.ph',
    'student',
    'pbkdf2_sha256$100000$d883bc22c69c1c535124e28470ebcf5b$8044bb0435f9644e65151f3a1b0369261d49c04a849837e8bb1e7c5cc9a47dd0'
  ),
  (
    'Hannah Reyes',
    'parent@alnavarroces.edu.ph',
    'parent',
    'pbkdf2_sha256$100000$f2de86f606e70e3090dcdb541a0cd622$4c8f1397a4d8ef69f1f5b0f2ae5cd2f9916f30cf39da44aac36a290594c03508'
  );

INSERT INTO announcements (title, category, is_pinned, published_at, office, excerpt, body)
SELECT
  'Second Quarter Periodical Examination Schedule (Grades 1–6)',
  'Important',
  1,
  '2026-11-20',
  'Office of the Principal',
  'The official Second Quarter exam timetable for Grades 1 to 6 at A.L. Navarro Central Elementary School is now posted. Review sheets are available from class advisers.',
  'Second Quarter periodical assessments at A.L. Navarro Central Elementary School (ALNAVARROCES) will take place from December 14 through December 16. Learners should arrive by 7:15 AM in complete uniform. Afternoon remedial reading and numeracy review sessions are open in the School Learning Resource Center until 4:00 PM.'
WHERE NOT EXISTS (
  SELECT 1 FROM announcements WHERE title = 'Second Quarter Periodical Examination Schedule (Grades 1–6)'
);

INSERT INTO announcements (title, category, is_pinned, published_at, office, excerpt, body)
SELECT
  'SY 2027–2028 Early Registration for Kindergarten & Incoming Grade 1',
  'Admissions',
  0,
  '2026-11-16',
  'Enrollment & Records Office',
  'Parents and guardians may begin early registration for incoming Kindergarten and Grade 1 learners starting January 2027 at the Main Administration Building.',
  'A.L. Navarro Central Elementary School welcomes incoming Kindergarten, Grade 1, and transferee learners for School Year 2027–2028. Please prepare a photocopy of the learner’s PSA Birth Certificate and previous school report card (SF9) when visiting the Enrollment & Records Office.'
WHERE NOT EXISTS (
  SELECT 1 FROM announcements WHERE title = 'SY 2027–2028 Early Registration for Kindergarten & Incoming Grade 1'
);

INSERT INTO announcements (title, category, is_pinned, published_at, office, excerpt, body)
SELECT
  'National Reading Month & Storybooks Celebration Week',
  'Academics',
  0,
  '2026-11-12',
  'English & Filipino Departments',
  'Join our school-wide Drop Everything and Read (DEAR) sessions, storytelling showcase, and Book Character Parade across all grade levels.',
  'To foster joyful literacy habits among our young learners, ALNAVARROCES is celebrating National Reading Month with daily 20-minute guided reading blocks, parent volunteer storytelling circles, and an interactive reading corner inside the School Library.'
WHERE NOT EXISTS (
  SELECT 1 FROM announcements WHERE title = 'National Reading Month & Storybooks Celebration Week'
);

INSERT INTO announcements (title, category, is_pinned, published_at, office, excerpt, body)
SELECT
  'General PTA Assembly & Second Quarter Card Distribution',
  'Campus Life',
  0,
  '2026-11-08',
  'PTA & Student Affairs',
  'All parents and guardians are invited to attend the General PTA Assembly followed by homeroom consultations with grade-level advisers.',
  'Strong home-school partnerships help every elementary learner succeed. After the General PTA Assembly at the Covered Court, parents may proceed to their child’s assigned classroom to receive Quarter 2 progress cards and discuss learning milestones with class advisers.'
WHERE NOT EXISTS (
  SELECT 1 FROM announcements WHERE title = 'General PTA Assembly & Second Quarter Card Distribution'
);

INSERT INTO announcements (title, category, is_pinned, published_at, office, excerpt, body)
SELECT
  'Campus Health, Nutrition & Rainy-Day Safety Advisory',
  'Important',
  0,
  '2026-11-04',
  'School Clinic & DRRM Team',
  'Please remind learners to bring rain gear and labeled water tumblers daily. Official weather advisories are posted here and via homeroom group updates.',
  'In coordination with the School Disaster Risk Reduction and Management (DRRM) committee and School Clinic, ALNAVARROCES encourages families to keep emergency contact numbers updated with class advisers and follow official class suspension notices.'
WHERE NOT EXISTS (
  SELECT 1 FROM announcements WHERE title = 'Campus Health, Nutrition & Rainy-Day Safety Advisory'
);

INSERT INTO campus_events (title, category, event_date, time_range, location, host, description)
SELECT
  'General PTA Assembly & Card Day',
  'Community',
  '2026-11-28',
  '8:00 AM – 3:00 PM',
  'ALNAVARROCES Covered Court & Classrooms',
  'Office of the Principal & PTA',
  'General parent-teacher orientation followed by homeroom distribution of report cards and individual learner progress consultations.'
WHERE NOT EXISTS (
  SELECT 1 FROM campus_events WHERE title = 'General PTA Assembly & Card Day'
);

INSERT INTO campus_events (title, category, event_date, time_range, location, host, description)
SELECT
  'Elementary Science & Math Quiz Bee',
  'Academic',
  '2026-12-03',
  '9:00 AM – 2:30 PM',
  'School Audio-Visual Room',
  'Mathematics & Science Coordinators',
  'Grade 3–6 classroom representatives compete in hands-on science discovery challenges and mental math rounds.'
WHERE NOT EXISTS (
  SELECT 1 FROM campus_events WHERE title = 'Elementary Science & Math Quiz Bee'
);

INSERT INTO campus_events (title, category, event_date, time_range, location, host, description)
SELECT
  'Annual Elementary Intramurals & Fun Run',
  'Athletics',
  '2026-12-06',
  '7:30 AM – 4:00 PM',
  'ALNAVARROCES Grounds & Quadrangle',
  'MAPEH & Sports Committee',
  'A celebration of teamwork and sportsmanship featuring track relays, ball games, Larong Pinoy, and family cheering squads.'
WHERE NOT EXISTS (
  SELECT 1 FROM campus_events WHERE title = 'Annual Elementary Intramurals & Fun Run'
);

INSERT INTO campus_events (title, category, event_date, time_range, location, host, description)
SELECT
  'Christmas Lantern Parade & Children’s Choir',
  'Arts',
  '2026-12-11',
  '4:00 PM – 6:30 PM',
  'Main School Quadrangle',
  'Performing Arts & Grade-Level Advisers',
  'Learners showcase eco-friendly lanterns and perform festive choral pieces with teachers and families.'
WHERE NOT EXISTS (
  SELECT 1 FROM campus_events WHERE title = 'Christmas Lantern Parade & Children’s Choir'
);

INSERT INTO campus_events (title, category, event_date, time_range, location, host, description)
SELECT
  'Second Quarter Periodical Examinations',
  'Academic',
  '2026-12-14',
  '7:30 AM – 12:00 PM',
  'Assigned Homeroom Classrooms',
  'Academic Affairs Committee',
  'Day 1 of Quarter 2 written assessments for Grades 1 through 6 across core learning areas.'
WHERE NOT EXISTS (
  SELECT 1 FROM campus_events WHERE title = 'Second Quarter Periodical Examinations'
);

INSERT INTO school_stats (label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
SELECT 'Enrolled Learners', 1480, 0, '+', 'Kindergarten through Grade 6 elementary learners', 'students', 1
WHERE NOT EXISTS (SELECT 1 FROM school_stats WHERE label = 'Enrolled Learners');

INSERT INTO school_stats (label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
SELECT 'Completion Rate', 98.6, 1, '%', 'Learners advancing smoothly to Junior High School', 'graduation', 2
WHERE NOT EXISTS (SELECT 1 FROM school_stats WHERE label = 'Completion Rate');

INSERT INTO school_stats (label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
SELECT 'Learner–Teacher Ratio', 24, 0, ':1', 'Attentive homeroom mentorship and guided reading', 'ratio', 3
WHERE NOT EXISTS (SELECT 1 FROM school_stats WHERE label = 'Learner–Teacher Ratio');

INSERT INTO school_stats (label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
SELECT 'Teaching & Non-Teaching', 68, 0, '', '52 Teaching Personnel · 16 Non-Teaching Staff', 'staff', 4
WHERE NOT EXISTS (SELECT 1 FROM school_stats WHERE label = 'Teaching & Non-Teaching');

INSERT INTO school_stats (label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
SELECT 'Learner Clubs & Teams', 24, 0, '+', 'Scouting, Math Club, Journalism, Choir & Sports', 'clubs', 5
WHERE NOT EXISTS (SELECT 1 FROM school_stats WHERE label = 'Learner Clubs & Teams');

INSERT INTO school_stats (label, numeric_target, decimals, suffix, subtitle, icon, sort_order)
SELECT 'Storybooks & Resources', 14, 0, 'K', 'Illustrated library books, ICT tablets & learning kits', 'library', 6
WHERE NOT EXISTS (SELECT 1 FROM school_stats WHERE label = 'Storybooks & Resources');

INSERT OR IGNORE INTO employees (
  name, role_type, title, department, photo_url, years_of_service,
  email, office, office_hours, education, summary, bio
) VALUES
  (
    'Dr. Elena Vance',
    'Teaching',
    'School Principal IV',
    'School Leadership',
    '/assets/staff-1.jpg',
    '16 yrs at ALNAVARROCES',
    'e.vance@alnavarroces.edu.ph',
    'Principal’s Office, Bldg. A',
    'Mon–Fri, 8:00 AM – 4:00 PM',
    'Ed.D. Educational Management',
    'Leads instructional excellence, child-friendly campus initiatives, and teacher development across K–6.',
    'Dr. Vance champions foundational literacy, numeracy, and inclusive elementary education at A.L. Navarro Central Elementary School, partnering closely with teachers, parents, and local community stakeholders.'
  ),
  (
    'Mr. Marcus Chen',
    'Teaching',
    'Master Teacher II — Mathematics & ICT',
    'Mathematics & ICT',
    '/assets/staff-2.jpg',
    '11 yrs at ALNAVARROCES',
    'm.chen@alnavarroces.edu.ph',
    'Grade 6 Wing, Room 204',
    'Tue & Thu, 2:30 PM – 4:00 PM',
    'M.A.Ed. Mathematics Education',
    'Grade 6 Mathematics Coordinator, ICT focal teacher, and coach of the ALNAVARROCES Math Quiz Bee team.',
    'Mr. Chen designs interactive math manipulatives and digital learning stations that make problem solving enjoyable and accessible for upper-elementary learners.'
  ),
  (
    'Ms. Amara Okafor',
    'Teaching',
    'Master Teacher I — Science & Gulayan sa Paaralan',
    'Elementary Science',
    '/assets/staff-3.jpg',
    '8 yrs at ALNAVARROCES',
    'a.okafor@alnavarroces.edu.ph',
    'Science Room, Bldg. B',
    'Mon & Wed, 2:30 PM – 4:00 PM',
    'M.A.Ed. General Science',
    'Leads Grade 4–6 Science inquiry labs, Young Eco-Stewards Club, and the school garden nutrition program.',
    'Ms. Okafor encourages hands-on curiosity through outdoor observation, simple classroom experiments, and environmental stewardship projects across the campus.'
  ),
  (
    'Mr. David Alvarez',
    'Teaching',
    'Teacher III — English & Reading Coordinator',
    'Languages & Literacy',
    '/assets/staff-4.jpg',
    '9 yrs at ALNAVARROCES',
    'd.alvarez@alnavarroces.edu.ph',
    'Grade 5 Building, Room 105',
    'Tue & Fri, 2:00 PM – 3:45 PM',
    'B.E.Ed. Elementary Education, MA Units in Reading',
    'Coordinates the school-wide Reading Remediation Program, Campus Journalism, and Storytelling Club.',
    'Mr. Alvarez helps learners build lifelong confidence in reading comprehension, phonics, and creative writing through engaging classroom read-alouds and peer mentoring.'
  ),
  (
    'Mrs. Claire Holloway',
    'Non-Teaching',
    'Administrative Officer II & School Registrar',
    'Administration & Records',
    '/assets/staff-5.jpg',
    '14 yrs at ALNAVARROCES',
    'c.holloway@alnavarroces.edu.ph',
    'Admin & Records Room 101',
    'Mon–Fri, 7:30 AM – 4:30 PM',
    'M.P.A. Public Administration',
    'Manages learner enrollment records (LIS/SF10), school forms, and front-desk parent assistance.',
    'Mrs. Holloway ensures smooth enrollment processing, accurate student permanent records, and warm, responsive service for all ALNAVARROCES families.'
  ),
  (
    'Mr. Kenneth Park',
    'Non-Teaching',
    'School ICT & Campus Operations Officer',
    'IT & Facilities',
    '/assets/staff-6.jpg',
    '7 yrs at ALNAVARROCES',
    'k.park@alnavarroces.edu.ph',
    'ICT & Property Office, Room 112',
    'Mon–Fri, 7:00 AM – 4:00 PM',
    'B.S. Information Technology',
    'Maintains the ALNAVARROCES portal, computer laboratory workstations, campus Wi-Fi, and facilities safety.',
    'Mr. Park supports teachers with digital classroom equipment, maintains school information systems, and coordinates preventive maintenance across campus buildings.'
  ),
  (
    'Ms. Priya Nair',
    'Non-Teaching',
    'Guidance Advocate & School Clinic Coordinator',
    'Learner Welfare & Health',
    '/assets/staff-7.jpg',
    '6 yrs at ALNAVARROCES',
    'p.nair@alnavarroces.edu.ph',
    'Guidance & Health Center',
    'Mon–Fri, 7:30 AM – 4:00 PM',
    'M.A. Guidance and Counseling',
    'Leads child-protection wellness sessions, school feeding health monitoring, and family guidance support.',
    'Ms. Nair works hand in hand with advisers and parents to maintain a safe, caring, anti-bullying campus environment where every child feels supported.'
  ),
  (
    'Mr. Robert Thornton',
    'Non-Teaching',
    'School Librarian & Learning Resource Manager',
    'Library & LRMDS',
    '/assets/staff-8.jpg',
    '18 yrs at ALNAVARROCES',
    'r.thornton@alnavarroces.edu.ph',
    'ALNAVARROCES Learning Resource Center',
    'Mon–Fri, 7:30 AM – 4:30 PM',
    'B.L.I.S. Library & Information Science',
    'Curates storybook collections, DepEd learning modules, and interactive reading corners for K–6 learners.',
    'Mr. Thornton transformed the ALNAVARROCES Library into a welcoming story hub where learners discover illustrated books, science encyclopedias, and guided literacy activities.'
  );
