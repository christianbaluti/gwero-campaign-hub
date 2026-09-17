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
