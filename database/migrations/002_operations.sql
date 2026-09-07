-- =====================================================================
-- FARAZZ FLOW — Migration 002: Operations (shipments, orders, deliveries)
-- =====================================================================

CREATE TABLE IF NOT EXISTS customers (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(40)  NOT NULL UNIQUE,
  name          VARCHAR(190) NOT NULL,
  type          ENUM('shipper','consignee','both') NOT NULL DEFAULT 'both',
  contact_person VARCHAR(128) NULL,
  email         VARCHAR(190) NULL,
  phone         VARCHAR(32)  NULL,
  address       VARCHAR(255) NULL,
  city          VARCHAR(96)  NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  notes         TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shipments (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_no       VARCHAR(40)  NOT NULL UNIQUE,
  customer_id       BIGINT UNSIGNED NULL,
  origin            VARCHAR(128) NOT NULL,
  destination       VARCHAR(128) NOT NULL,
  origin_city       VARCHAR(96)  NULL,
  destination_city  VARCHAR(96)  NULL,
  service_type      VARCHAR(48)  NULL,
  status            VARCHAR(48) NOT NULL DEFAULT 'pending'
                    COMMENT 'pending|booked|picked_up|in_transit|out_for_delivery|delivered|cancelled|exception',
  weight_kg         DECIMAL(12,3) NULL,
  volume_m3         DECIMAL(12,3) NULL,
  declared_value    DECIMAL(18,2) NULL,
  cod_amount        DECIMAL(18,2) NULL,
  base_fare         DECIMAL(18,2) NULL,
  fuel_surcharge    DECIMAL(18,2) NULL,
  extra_charge      DECIMAL(18,2) NULL,
  total_amount      DECIMAL(18,2) NULL,
  customer_note     TEXT NULL,
  planned_date      DATETIME NULL,
  delivered_at      DATETIME NULL,
  courier_name      VARCHAR(128) NULL,
  reference         VARCHAR(64) NULL,
  created_by        BIGINT UNSIGNED NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL,
  CONSTRAINT fk_ship_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_ship_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ship_status ON shipments (status);
CREATE INDEX idx_ship_created ON shipments (created_at);
CREATE INDEX idx_ship_customer ON shipments (customer_id);

CREATE TABLE IF NOT EXISTS shipment_status_history (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id   BIGINT UNSIGNED NOT NULL,
  status        VARCHAR(48) NOT NULL,
  note          VARCHAR(255) NULL,
  changed_by    BIGINT UNSIGNED NULL,
  changed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ssh_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
  CONSTRAINT fk_ssh_user FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ssh_shipment ON shipment_status_history (shipment_id);

CREATE TABLE IF NOT EXISTS orders (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_no          VARCHAR(40)  NOT NULL UNIQUE,
  customer_id       BIGINT UNSIGNED NULL,
  shipment_id       BIGINT UNSIGNED NULL,
  order_date        DATE NOT NULL,
  status            VARCHAR(48) NOT NULL DEFAULT 'draft'
                    COMMENT 'draft|confirmed|processing|completed|cancelled',
  total_amount      DECIMAL(18,2) NOT NULL DEFAULT 0,
  notes             TEXT NULL,
  created_by        BIGINT UNSIGNED NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ord_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_ord_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE SET NULL,
  CONSTRAINT fk_ord_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ord_status ON orders (status);
CREATE INDEX idx_ord_date  ON orders (order_date);

CREATE TABLE IF NOT EXISTS deliveries (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  delivery_no   VARCHAR(40) NOT NULL UNIQUE,
  shipment_id   BIGINT UNSIGNED NULL,
  vehicle_id    BIGINT UNSIGNED NULL,
  driver_id     BIGINT UNSIGNED NULL,
  status        VARCHAR(48) NOT NULL DEFAULT 'scheduled'
                COMMENT 'scheduled|out_for_delivery|delivered|failed_attempt|returned',
  address       VARCHAR(255) NULL,
  city          VARCHAR(96)  NULL,
  recipient_name VARCHAR(128) NULL,
  signature     VARCHAR(128) NULL,
  proof_photo   VARCHAR(255) NULL,
  scheduled_at  DATETIME NULL,
  delivered_at  DATETIME NULL,
  notes         TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_del_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_del_status ON deliveries (status);

CREATE TABLE IF NOT EXISTS exceptions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id   BIGINT UNSIGNED NOT NULL,
  exception_type VARCHAR(64) NOT NULL
                 COMMENT 'address_mismatch|damaged|not_home|delayed|wrong_item|rejected|other',
  severity      ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  description   TEXT NULL,
  status        ENUM('open','reviewing','resolved','closed') NOT NULL DEFAULT 'open',
  resolved_note TEXT NULL,
  reported_by   BIGINT UNSIGNED NULL,
  resolved_by   BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_exc_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
  CONSTRAINT fk_exc_reporter FOREIGN KEY (reported_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_exc_resolver FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_exc_status ON exceptions (status);

CREATE TABLE IF NOT EXISTS `returns` (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_no     VARCHAR(40)  NOT NULL UNIQUE,
  shipment_id   BIGINT UNSIGNED NULL,
  order_id      BIGINT UNSIGNED NULL,
  reason        VARCHAR(190) NOT NULL,
  status        ENUM('requested','approved','picked_up','returned','rejected') NOT NULL DEFAULT 'requested',
  notes         TEXT NULL,
  request_date  DATE NOT NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ret_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE SET NULL,
  CONSTRAINT fk_ret_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL,
  CONSTRAINT fk_ret_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ret_status ON returns (status);