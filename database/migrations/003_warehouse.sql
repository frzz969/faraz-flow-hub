-- =====================================================================
-- FARAZZ FLOW — Migration 003: Warehouse (facilities, inventory, movements)
-- =====================================================================

CREATE TABLE IF NOT EXISTS warehouses (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(40) NOT NULL UNIQUE,
  name          VARCHAR(128) NOT NULL,
  address       VARCHAR(255) NULL,
  city          VARCHAR(96) NULL,
  capacity      DECIMAL(14,2) NULL COMMENT 'm3',
  used_capacity DECIMAL(14,2) NULL DEFAULT 0,
  manager_id    BIGINT UNSIGNED NULL,
  status        ENUM('active','inactive','maintenance') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  CONSTRAINT fk_wh_manager FOREIGN KEY (manager_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warehouse_zones (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  code          VARCHAR(40) NOT NULL,
  name          VARCHAR(96)  NULL,
  zone_type     ENUM('storage','staging','sorting','damaged','returns') NOT NULL DEFAULT 'storage',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wz_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
  UNIQUE KEY uq_wz (warehouse_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  sku           VARCHAR(64) NOT NULL,
  name          VARCHAR(190) NOT NULL,
  category      VARCHAR(64) NULL,
  quantity      DECIMAL(14,3) NOT NULL DEFAULT 0,
  reserved_qty  DECIMAL(14,3) NOT NULL DEFAULT 0,
  unit          VARCHAR(24) NULL,
  min_stock     DECIMAL(14,3) NULL,
  location      VARCHAR(64) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
  UNIQUE KEY uq_inv (warehouse_id, sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_inv_name ON inventory (name);

CREATE TABLE IF NOT EXISTS stock_movements (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inventory_id  BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('in','out','transfer','adjustment','reserve','release') NOT NULL,
  quantity      DECIMAL(14,3) NOT NULL,
  reference     VARCHAR(64) NULL COMMENT 'PO/WO/invoice no',
  note          VARCHAR(255) NULL,
  user_id       BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sm_item FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
  CONSTRAINT fk_sm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sm_item ON stock_movements (inventory_id);
CREATE INDEX idx_sm_time ON stock_movements (created_at);

CREATE TABLE IF NOT EXISTS inbound_orders (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inbound_no    VARCHAR(40) NOT NULL UNIQUE,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  supplier_id   BIGINT UNSIGNED NULL,
  expected_date DATE NULL,
  received_at   DATETIME NULL,
  status        ENUM('expected','received','checked','stored') NOT NULL DEFAULT 'expected',
  notes         TEXT NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ib_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
  CONSTRAINT fk_ib_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS outbound_orders (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outbound_no   VARCHAR(40) NOT NULL UNIQUE,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  order_id      BIGINT UNSIGNED NULL,
  shipment_id   BIGINT UNSIGNED NULL,
  ship_date     DATE NULL,
  shipped_at    DATETIME NULL,
  status        ENUM('preparing','picked','packed','shipped') NOT NULL DEFAULT 'preparing',
  notes         TEXT NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ob_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
  CONSTRAINT fk_ob_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sorting_tasks (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_no       VARCHAR(40) NOT NULL UNIQUE,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  shipment_id   BIGINT UNSIGNED NULL,
  zone_from     VARCHAR(40) NULL,
  zone_to       VARCHAR(40) NULL,
  status        ENUM('pending','in_progress','sorted','failed') NOT NULL DEFAULT 'pending',
  assigned_to   BIGINT UNSIGNED NULL,
  started_at    DATETIME NULL,
  finished_at   DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_st_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
  CONSTRAINT fk_st_user FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_st_status ON sorting_tasks (status);