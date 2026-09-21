CREATE TABLE IF NOT EXISTS prospects (
  id CHAR(36) PRIMARY KEY, email VARCHAR(320) NOT NULL, first_name VARCHAR(255), last_name VARCHAR(255),
  company VARCHAR(255), job_title VARCHAR(255), phone VARCHAR(100), status VARCHAR(40) NOT NULL DEFAULT 'new',
  notes TEXT, extra LONGTEXT NOT NULL, source_file VARCHAR(255),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY prospects_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clients (
  id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, company VARCHAR(255), email VARCHAR(320), phone VARCHAR(100),
  website VARCHAR(500), industry VARCHAR(255), status VARCHAR(40) NOT NULL DEFAULT 'active', address TEXT, notes TEXT,
  prospect_id CHAR(36), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY clients_prospect_idx (prospect_id), CONSTRAINT clients_prospect_fk FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mailboxes (
  id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, from_email VARCHAR(320) NOT NULL, from_name VARCHAR(255),
  provider VARCHAR(40) NOT NULL DEFAULT 'smtp', smtp_host VARCHAR(255), smtp_port INT DEFAULT 587, smtp_secure BOOLEAN NOT NULL DEFAULT FALSE,
  smtp_username VARCHAR(255), imap_host VARCHAR(255), imap_port INT DEFAULT 993, imap_username VARCHAR(255),
  is_default BOOLEAN NOT NULL DEFAULT FALSE, last_sync_at DATETIME(3), last_status VARCHAR(500),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE KEY mailboxes_from_email_key (from_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mailbox_secrets (
  mailbox_id CHAR(36) PRIMARY KEY, smtp_password TEXT, imap_password TEXT, oauth_access_token TEXT,
  oauth_refresh_token TEXT, oauth_expires_at DATETIME(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT mailbox_secrets_mailbox_fk FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaigns (
  id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, subject TEXT NOT NULL, body_html LONGTEXT NOT NULL,
  mailbox_id CHAR(36), cc LONGTEXT NOT NULL, bcc LONGTEXT NOT NULL, attachments LONGTEXT NOT NULL,
  track_opens BOOLEAN NOT NULL DEFAULT TRUE, track_clicks BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(40) NOT NULL DEFAULT 'draft', sent_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT campaigns_mailbox_fk FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id CHAR(36) PRIMARY KEY, campaign_id CHAR(36) NOT NULL, prospect_id CHAR(36) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending', error VARCHAR(500), message_id VARCHAR(500),
  sent_at DATETIME(3), opened_at DATETIME(3), open_count INT NOT NULL DEFAULT 0,
  clicked_at DATETIME(3), click_count INT NOT NULL DEFAULT 0, replied_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY recipients_campaign_prospect_key (campaign_id, prospect_id), KEY recipients_prospect_idx (prospect_id),
  CONSTRAINT recipients_campaign_fk FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT recipients_prospect_fk FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS deals (
  id CHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, client_id CHAR(36), prospect_id CHAR(36),
  value DECIMAL(15,2) NOT NULL DEFAULT 0, currency VARCHAR(8) NOT NULL DEFAULT 'USD', stage VARCHAR(40) NOT NULL DEFAULT 'new',
  probability INT NOT NULL DEFAULT 20, expected_close_date DATE, owner VARCHAR(255), notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY deals_client_idx (client_id), KEY deals_prospect_idx (prospect_id),
  CONSTRAINT deals_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT deals_prospect_fk FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agreements (
  id CHAR(36) PRIMARY KEY, client_id CHAR(36) NOT NULL, deal_id CHAR(36), title VARCHAR(255) NOT NULL,
  agreement_type VARCHAR(40) NOT NULL DEFAULT 'contract', status VARCHAR(40) NOT NULL DEFAULT 'active',
  start_date DATE, end_date DATE, value DECIMAL(15,2) NOT NULL DEFAULT 0, currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  billing_cycle VARCHAR(40) NOT NULL DEFAULT 'monthly', response_time_hours INT, resolution_time_hours INT,
  coverage_hours VARCHAR(255), auto_renew BOOLEAN NOT NULL DEFAULT FALSE, notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY agreements_client_idx (client_id), KEY agreements_deal_idx (deal_id),
  CONSTRAINT agreements_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT agreements_deal_fk FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agreement_items (
  id CHAR(36) PRIMARY KEY, agreement_id CHAR(36) NOT NULL, description TEXT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1, unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY items_agreement_idx (agreement_id), CONSTRAINT items_agreement_fk FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activities (
  id CHAR(36) PRIMARY KEY, entity_type VARCHAR(40) NOT NULL, entity_id CHAR(36) NOT NULL,
  activity_type VARCHAR(40) NOT NULL DEFAULT 'note', body TEXT NOT NULL,
  occurred_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), KEY activities_entity_idx (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS replies (
  id CHAR(36) PRIMARY KEY, mailbox_id CHAR(36), prospect_id CHAR(36), campaign_id CHAR(36),
  from_email VARCHAR(320) NOT NULL, subject TEXT, snippet TEXT,
  received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), external_id VARCHAR(500),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE KEY replies_external_id_key (external_id),
  KEY replies_prospect_idx (prospect_id),
  CONSTRAINT replies_mailbox_fk FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id) ON DELETE SET NULL,
  CONSTRAINT replies_prospect_fk FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL,
  CONSTRAINT replies_campaign_fk FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quotations (
  id CHAR(36) PRIMARY KEY, quote_number VARCHAR(60) NOT NULL, title VARCHAR(255) NOT NULL,
  client_id CHAR(36), deal_id CHAR(36), status VARCHAR(40) NOT NULL DEFAULT 'draft',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD', issue_date DATE, valid_until DATE,
  tax_rate DECIMAL(6,2) NOT NULL DEFAULT 0, discount DECIMAL(15,2) NOT NULL DEFAULT 0, notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY quotations_client_idx (client_id),
  CONSTRAINT quotations_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quotation_items (
  id CHAR(36) PRIMARY KEY, quotation_id CHAR(36) NOT NULL, description TEXT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1, unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY quotation_items_idx (quotation_id),
  CONSTRAINT quotation_items_fk FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, code VARCHAR(60), client_id CHAR(36),
  manager VARCHAR(255), status VARCHAR(40) NOT NULL DEFAULT 'planned', start_date DATE, end_date DATE,
  budget DECIMAL(15,2) NOT NULL DEFAULT 0, currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  progress INT NOT NULL DEFAULT 0, description TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY projects_client_idx (client_id),
  CONSTRAINT projects_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bids (
  id CHAR(36) PRIMARY KEY, reference VARCHAR(80), title VARCHAR(255) NOT NULL, buyer VARCHAR(255),
  client_id CHAR(36), status VARCHAR(40) NOT NULL DEFAULT 'identified', closing_date DATE, submission_date DATE,
  value DECIMAL(15,2) NOT NULL DEFAULT 0, currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  bond_amount DECIMAL(15,2) NOT NULL DEFAULT 0, notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY bids_client_idx (client_id),
  CONSTRAINT bids_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cost_sheets (
  id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, client_id CHAR(36), quotation_id CHAR(36),
  bid_id CHAR(36), project_id CHAR(36), status VARCHAR(40) NOT NULL DEFAULT 'draft',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD', notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY cost_sheets_client_idx (client_id),
  CONSTRAINT cost_sheets_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cost_sheet_items (
  id CHAR(36) PRIMARY KEY, cost_sheet_id CHAR(36) NOT NULL, category VARCHAR(60) NOT NULL DEFAULT 'labour',
  description TEXT NOT NULL, quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0, markup_percent DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY cost_sheet_items_idx (cost_sheet_id),
  CONSTRAINT cost_sheet_items_fk FOREIGN KEY (cost_sheet_id) REFERENCES cost_sheets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, client_id CHAR(36), project_id CHAR(36),
  job_type VARCHAR(60) NOT NULL DEFAULT 'once-off', assignee VARCHAR(255),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', status VARCHAR(40) NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE, completed_at DATETIME(3), notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY jobs_client_idx (client_id),
  CONSTRAINT jobs_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT jobs_project_fk FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, entity_type VARCHAR(40) NOT NULL DEFAULT 'general',
  entity_id CHAR(36), assignee VARCHAR(255), priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(40) NOT NULL DEFAULT 'open', due_date DATE, notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY tasks_entity_idx (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS suppliers (
  id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, contact_name VARCHAR(255), email VARCHAR(320),
  phone VARCHAR(100), category VARCHAR(120), notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id CHAR(36) PRIMARY KEY, po_number VARCHAR(60) NOT NULL, supplier_id CHAR(36), project_id CHAR(36),
  status VARCHAR(40) NOT NULL DEFAULT 'requested', order_date DATE, expected_date DATE,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD', notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY purchase_orders_supplier_idx (supplier_id),
  CONSTRAINT purchase_orders_supplier_fk FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  CONSTRAINT purchase_orders_project_fk FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id CHAR(36) PRIMARY KEY, purchase_order_id CHAR(36) NOT NULL, description TEXT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1, unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  received_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY purchase_order_items_idx (purchase_order_id),
  CONSTRAINT purchase_order_items_fk FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prequalifications (
  id CHAR(36) PRIMARY KEY, reference VARCHAR(80), buyer VARCHAR(255) NOT NULL, category VARCHAR(255),
  submission_type VARCHAR(40) NOT NULL DEFAULT 'eoi', status VARCHAR(40) NOT NULL DEFAULT 'preparing',
  submitted_date DATE, valid_until DATE, outcome VARCHAR(120), notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS requests (
  id CHAR(36) PRIMARY KEY, reference VARCHAR(80), title VARCHAR(255) NOT NULL, issuer VARCHAR(255),
  client_id CHAR(36), request_type VARCHAR(10) NOT NULL DEFAULT 'rfp',
  status VARCHAR(40) NOT NULL DEFAULT 'received', received_date DATE, due_date DATE,
  value DECIMAL(15,2) NOT NULL DEFAULT 0, currency VARCHAR(10) NOT NULL DEFAULT 'USD', scope TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY requests_type_idx (request_type),
  CONSTRAINT requests_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS marketing_activities (
  id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, channel VARCHAR(60) NOT NULL DEFAULT 'email',
  status VARCHAR(40) NOT NULL DEFAULT 'planned', start_date DATE, end_date DATE,
  budget DECIMAL(15,2) NOT NULL DEFAULT 0, spend DECIMAL(15,2) NOT NULL DEFAULT 0,
  leads INT NOT NULL DEFAULT 0, currency VARCHAR(10) NOT NULL DEFAULT 'USD', notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS documents (
  id CHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, category VARCHAR(60) NOT NULL DEFAULT 'general',
  entity_type VARCHAR(40) NOT NULL DEFAULT 'general', entity_id CHAR(36), owner VARCHAR(255),
  version VARCHAR(40), file_url TEXT, issue_date DATE, expiry_date DATE, notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY documents_entity_idx (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vacancies (
  id CHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, department VARCHAR(120),
  employment_type VARCHAR(40) NOT NULL DEFAULT 'full-time', status VARCHAR(40) NOT NULL DEFAULT 'open',
  openings INT NOT NULL DEFAULT 1, location VARCHAR(255), closing_date DATE, description TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS applicants (
  id CHAR(36) PRIMARY KEY, vacancy_id CHAR(36), full_name VARCHAR(255) NOT NULL, email VARCHAR(320),
  phone VARCHAR(100), stage VARCHAR(40) NOT NULL DEFAULT 'applied', rating INT NOT NULL DEFAULT 0,
  resume_url TEXT, notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY applicants_vacancy_idx (vacancy_id),
  CONSTRAINT applicants_vacancy_fk FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) PRIMARY KEY, employee_number VARCHAR(60), full_name VARCHAR(255) NOT NULL,
  email VARCHAR(320), phone VARCHAR(100), job_title VARCHAR(255), department VARCHAR(120),
  employment_type VARCHAR(40) NOT NULL DEFAULT 'full-time', status VARCHAR(40) NOT NULL DEFAULT 'active',
  start_date DATE, end_date DATE, base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD', notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leave_requests (
  id CHAR(36) PRIMARY KEY, employee_id CHAR(36), leave_type VARCHAR(40) NOT NULL DEFAULT 'annual',
  start_date DATE, end_date DATE, days DECIMAL(6,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'pending', reason TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY leave_employee_idx (employee_id),
  CONSTRAINT leave_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payroll_runs (
  id CHAR(36) PRIMARY KEY, period VARCHAR(40) NOT NULL, pay_date DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'draft', currency VARCHAR(10) NOT NULL DEFAULT 'USD', notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payroll_items (
  id CHAR(36) PRIMARY KEY, payroll_run_id CHAR(36) NOT NULL, employee_id CHAR(36),
  gross DECIMAL(15,2) NOT NULL DEFAULT 0, allowances DECIMAL(15,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(15,2) NOT NULL DEFAULT 0, tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  net DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY payroll_items_run_idx (payroll_run_id),
  CONSTRAINT payroll_items_run_fk FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  CONSTRAINT payroll_items_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY, invoice_number VARCHAR(60) NOT NULL, client_id CHAR(36),
  quotation_id CHAR(36), project_id CHAR(36), status VARCHAR(40) NOT NULL DEFAULT 'draft',
  issue_date DATE, due_date DATE, amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0, paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD', notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY invoices_client_idx (client_id),
  CONSTRAINT invoices_client_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id CHAR(36) PRIMARY KEY, description VARCHAR(255) NOT NULL, category VARCHAR(60) NOT NULL DEFAULT 'general',
  vendor VARCHAR(255), amount DECIMAL(15,2) NOT NULL DEFAULT 0, currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  expense_date DATE, project_id CHAR(36), status VARCHAR(40) NOT NULL DEFAULT 'recorded', notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT expenses_project_fk FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY, invoice_id CHAR(36), amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD', paid_at DATE, method VARCHAR(60), reference VARCHAR(120),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY payments_invoice_idx (invoice_id),
  CONSTRAINT payments_invoice_fk FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS system_settings (
  id CHAR(36) PRIMARY KEY, setting_key VARCHAR(120) NOT NULL, setting_group VARCHAR(60) NOT NULL,
  setting_value LONGTEXT, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY system_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS app_secrets (
  id CHAR(36) PRIMARY KEY, secret_key VARCHAR(120) NOT NULL, encrypted_value LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY app_secrets_key (secret_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_templates (
  id CHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL, event_key VARCHAR(120) NOT NULL,
  subject TEXT NOT NULL, body_html LONGTEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY email_templates_event (event_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY, name VARCHAR(120) NOT NULL, description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) PRIMARY KEY, permission_key VARCHAR(160) NOT NULL, name VARCHAR(160) NOT NULL,
  module VARCHAR(80) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY permissions_key (permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  id CHAR(36) PRIMARY KEY, role_id CHAR(36) NOT NULL, permission_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY role_permission_unique (role_id, permission_id),
  CONSTRAINT role_permissions_role_fk FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_permission_fk FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS system_users (
  id CHAR(36) PRIMARY KEY, full_name VARCHAR(255) NOT NULL, email VARCHAR(320) NOT NULL,
  role_id CHAR(36), status VARCHAR(40) NOT NULL DEFAULT 'invited',
  last_login_at DATETIME(3), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY system_users_email (email),
  CONSTRAINT system_users_role_fk FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prospect_categories (
  id CHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL, description TEXT, offerings TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY prospect_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS category_id CHAR(36) NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS website VARCHAR(500) NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500) NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS fit_score INT NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS fit_reason TEXT NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_contact_at DATETIME(3) NULL;

CREATE TABLE IF NOT EXISTS prospect_interactions (
  id CHAR(36) PRIMARY KEY, prospect_id CHAR(36) NOT NULL,
  interaction_type VARCHAR(60) NOT NULL DEFAULT 'note', direction VARCHAR(20) NOT NULL DEFAULT 'internal',
  subject VARCHAR(255), body LONGTEXT NOT NULL, occurred_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY prospect_interactions_prospect (prospect_id),
  CONSTRAINT prospect_interactions_prospect_fk FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_prospect_searches (
  id CHAR(36) PRIMARY KEY, prompt LONGTEXT NOT NULL, search_context LONGTEXT,
  results_json LONGTEXT NOT NULL, status VARCHAR(40) NOT NULL DEFAULT 'completed',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO roles (id, name, description, is_system) VALUES
  (UUID(), 'Administrator', 'Full system administration', TRUE),
  (UUID(), 'Sales Manager', 'Manage prospects, clients, campaigns and deals', TRUE),
  (UUID(), 'Team Member', 'Standard operational access', TRUE);

INSERT IGNORE INTO permissions (id, permission_key, name, module) VALUES
  (UUID(), 'settings.manage', 'Manage settings', 'Settings'),
  (UUID(), 'users.manage', 'Manage users and roles', 'Settings'),
  (UUID(), 'prospects.view', 'View prospects', 'Prospects'),
  (UUID(), 'prospects.manage', 'Create and update prospects', 'Prospects'),
  (UUID(), 'prospects.convert', 'Convert prospects to clients', 'Prospects'),
  (UUID(), 'campaigns.manage', 'Manage campaigns', 'Campaigns'),
  (UUID(), 'clients.manage', 'Manage clients', 'Clients');

INSERT IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT UUID(), r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'Administrator';
