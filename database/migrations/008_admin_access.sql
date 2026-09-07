-- =====================================================================
-- FARAZZ FLOW — Migration 008: Admin/system permissions (RBAC additions)
-- Adds the permission codes used by the /api/v1/admin router and grants
-- them to the system roles. The frontend matrix covers business modules;
-- these are the server-side control-plane permissions.
-- =====================================================================

INSERT IGNORE INTO permissions (code, module, action, name) VALUES
  ('admin.users.view',    'Admin', 'users.view',     'Admin — view users'),
  ('admin.users.create',  'Admin', 'users.create',   'Admin — create users'),
  ('admin.users.update',  'Admin', 'users.update',   'Admin — update users'),
  ('admin.users.delete',  'Admin', 'users.delete',   'Admin — delete users'),
  ('admin.roles.view',    'Admin', 'roles.view',     'Admin — view roles'),
  ('admin.roles.update',  'Admin', 'roles.update',   'Admin — update roles'),
  ('admin.roles.delete',  'Admin', 'roles.delete',   'Admin — delete roles'),
  ('admin.audit.view',    'Admin', 'audit.view',     'Admin — view audit logs'),
  ('admin.settings.view', 'Admin', 'settings.view',  'Admin — view system settings'),
  ('admin.settings.update','Admin','settings.update', 'Admin — update system settings');

-- Grant all admin.* permissions to admin-related roles.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('super_admin', 'operations_manager')
  AND p.module = 'Admin';

-- Finance gets audit visibility (read-only).
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'finance'
  AND p.code = 'admin.audit.view';