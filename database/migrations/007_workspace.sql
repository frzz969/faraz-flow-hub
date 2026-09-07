-- =====================================================================
-- FARAZZ FLOW — Migration 007: Workspace (approvals, tasks, documents)
-- =====================================================================

CREATE TABLE IF NOT EXISTS approvals (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  approval_no   VARCHAR(40) NOT NULL UNIQUE,
  title         VARCHAR(190) NOT NULL,
  category      VARCHAR(48) NOT NULL COMMENT 'shipment|contract|payment|purchase|leave|expense|other',
  priority      ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  status        ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  requestor_id  BIGINT UNSIGNED NULL,
  approver_id   BIGINT UNSIGNED NULL,
  description   TEXT NULL,
  submitted_at  DATETIME NULL,
  decided_at    DATETIME NULL,
  decision_note VARCHAR(255) NULL,
  resource      VARCHAR(64) NULL,
  resource_id   VARCHAR(128) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_requestor FOREIGN KEY (requestor_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_app_approver FOREIGN KEY (approver_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_app_status ON approvals (status);
CREATE INDEX idx_app_category ON approvals (category);

CREATE TABLE IF NOT EXISTS tasks (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_no       VARCHAR(40) NOT NULL UNIQUE,
  title         VARCHAR(190) NOT NULL,
  description   TEXT NULL,
  status        ENUM('todo','in_progress','done','blocked') NOT NULL DEFAULT 'todo',
  priority      ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  assignee_id   BIGINT UNSIGNED NULL,
  creator_id    BIGINT UNSIGNED NULL,
  due_date      DATETIME NULL,
  completed_at  DATETIME NULL,
  resource      VARCHAR(64) NULL,
  resource_id   VARCHAR(128) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_task_creator FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_task_status ON tasks (status);
CREATE INDEX idx_task_assignee ON tasks (assignee_id);

CREATE TABLE IF NOT EXISTS documents (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doc_no        VARCHAR(40) NOT NULL UNIQUE,
  title         VARCHAR(190) NOT NULL,
  category      VARCHAR(48) NULL COMMENT 'contract|invoice|permit|report|policy|other',
  file_name     VARCHAR(255) NULL,
  file_path     VARCHAR(255) NULL,
  file_size     BIGINT NULL,
  mime_type     VARCHAR(96) NULL,
  version       INT NOT NULL DEFAULT 1,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  tags          VARCHAR(255) NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doc_title ON documents (title);
CREATE INDEX idx_doc_category ON documents (category);

CREATE TABLE IF NOT EXISTS document_versions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id   BIGINT UNSIGNED NOT NULL,
  version       INT NOT NULL,
  file_name     VARCHAR(255) NULL,
  file_path     VARCHAR(255) NULL,
  file_size     BIGINT NULL,
  mime_type     VARCHAR(96) NULL,
  change_note   VARCHAR(255) NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dv_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
  CONSTRAINT fk_dv_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  UNIQUE KEY uq_dv (document_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  type          VARCHAR(48) NOT NULL COMMENT 'assigned|approval|shipment|alert|system',
  title         VARCHAR(190) NOT NULL,
  message       VARCHAR(500) NULL,
  resource      VARCHAR(64) NULL,
  resource_id   VARCHAR(128) NULL,
  read_at       DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notif_user ON notifications (user_id, read_at);
CREATE INDEX idx_notif_time ON notifications (created_at);