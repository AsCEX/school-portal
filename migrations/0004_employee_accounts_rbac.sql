-- ALNAVARROCES School Portal — Employee Login Accounts & Granular RBAC Permissions
-- Links users to employees(id), adds per-user JSON permissions and active status.

ALTER TABLE users ADD COLUMN employee_id INTEGER;
ALTER TABLE users ADD COLUMN permissions TEXT NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_id
  ON users(employee_id)
  WHERE employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Grant full permissions to existing administrators
UPDATE users
SET permissions = '["manage_schools","manage_announcements","manage_events","manage_statistics","manage_employees","manage_accounts"]'
WHERE role = 'admin' AND (permissions IS NULL OR permissions = '[]');

-- Grant default content-editor permissions to existing faculty accounts
UPDATE users
SET permissions = '["manage_announcements","manage_events","manage_statistics"]'
WHERE role = 'faculty' AND (permissions IS NULL OR permissions = '[]');
