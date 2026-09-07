-- =====================================================================
-- FARAZZ FLOW — Migration 005: Business (suppliers, pricing, contracts)
-- =====================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(40) NOT NULL UNIQUE,
  name          VARCHAR(190) NOT NULL,
  contact_person VARCHAR(128) NULL,
  email         VARCHAR(190) NULL,
  phone         VARCHAR(32) NULL,
  address       VARCHAR(255) NULL,
  category      VARCHAR(64) NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  notes         TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_types (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(40) NOT NULL UNIQUE,
  name          VARCHAR(128) NOT NULL,
  description   VARCHAR(255) NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_rules (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id      BIGINT UNSIGNED NULL,
  service_type_id BIGINT UNSIGNED NULL,
  weight_min_kg DECIMAL(12,3) NULL,
  weight_max_kg DECIMAL(12,3) NULL,
  base_price    DECIMAL(18,2) NOT NULL,
  price_per_kg  DECIMAL(18,2) NULL,
  price_per_m3  DECIMAL(18,2) NULL,
  min_charge    DECIMAL(18,2) NULL,
  effective_from DATE NOT NULL,
  effective_to  DATE NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pr_route FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE SET NULL,
  CONSTRAINT fk_pr_service FOREIGN KEY (service_type_id) REFERENCES service_types (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pr_active ON pricing_rules (status, effective_from);

CREATE TABLE IF NOT EXISTS contracts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_no   VARCHAR(40) NOT NULL UNIQUE,
  customer_id   BIGINT UNSIGNED NULL,
  title         VARCHAR(190) NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NULL,
  value         DECIMAL(18,2) NULL,
  status        ENUM('draft','active','expired','terminated') NOT NULL DEFAULT 'draft',
  terms         TEXT NULL,
  attachment    VARCHAR(255) NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cont_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_cont_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cont_status ON contracts (status);