CREATE TABLE IF NOT EXISTS security_login_limits (bucket CHAR(64) PRIMARY KEY, window_id BIGINT NOT NULL, attempts INT UNSIGNED NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB;
INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES (UUID(), 'opportunities.manage', 'Manage opportunities', 'opportunities');
INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES (UUID(), 'operations.manage', 'Manage operations', 'operations');
INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES (UUID(), 'procurement.manage', 'Manage procurement', 'procurement');
INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES (UUID(), 'hr.manage', 'Manage hr', 'hr');
INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES (UUID(), 'finance.manage', 'Manage finance', 'finance');
INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES (UUID(), 'documents.manage', 'Manage documents', 'documents');
INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES (UUID(), 'notes.manage', 'Manage notes', 'notes');
INSERT IGNORE INTO role_permissions (id, role_id, permission_id) SELECT UUID(), r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'Administrator';
