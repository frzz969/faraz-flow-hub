-- =====================================================================
-- FARAZZ FLOW — Migration 004: Fleet (vehicles, drivers, routes, dispatch)
-- =====================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plate_no      VARCHAR(24) NOT NULL UNIQUE,
  model         VARCHAR(96) NULL,
  type          VARCHAR(48) NULL COMMENT 'truck|van|pickup|motorcycle|cold',
  capacity_kg   DECIMAL(12,2) NULL,
  capacity_m3   DECIMAL(12,2) NULL,
  status        ENUM('available','in_use','maintenance','retired') NOT NULL DEFAULT 'available',
  last_maintenance_at DATETIME NULL,
  next_maintenance_at DATETIME NULL,
  odometer      DECIMAL(12,2) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_veh_status ON vehicles (status);

CREATE TABLE IF NOT EXISTS drivers (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NULL,
  license_no    VARCHAR(48) NULL,
  license_expiry DATE NULL,
  phone         VARCHAR(32) NULL,
  status        ENUM('available','on_duty','off_duty','suspended') NOT NULL DEFAULT 'available',
  rating        DECIMAL(3,2) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  CONSTRAINT fk_drv_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_drv_status ON drivers (status);

CREATE TABLE IF NOT EXISTS routes (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_code    VARCHAR(40) NOT NULL UNIQUE,
  name          VARCHAR(128) NULL,
  origin        VARCHAR(128) NOT NULL,
  destination   VARCHAR(128) NOT NULL,
  distance_km   DECIMAL(10,2) NULL,
  estimated_min INT NULL,
  vehicle_type  VARCHAR(48) NULL,
  base_price    DECIMAL(18,2) NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_routes_od ON routes (origin, destination);

CREATE TABLE IF NOT EXISTS dispatches (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispatch_no   VARCHAR(40) NOT NULL UNIQUE,
  route_id      BIGINT UNSIGNED NULL,
  shipment_id   BIGINT UNSIGNED NULL,
  vehicle_id    BIGINT UNSIGNED NULL,
  driver_id     BIGINT UNSIGNED NULL,
  status        ENUM('planned','dispatch','on_route','completed','cancelled') NOT NULL DEFAULT 'planned',
  scheduled_at  DATETIME NULL,
  departed_at   DATETIME NULL,
  arrived_at    DATETIME NULL,
  notes         TEXT NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dsp_route   FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE SET NULL,
  CONSTRAINT fk_dsp_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE SET NULL,
  CONSTRAINT fk_dsp_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL,
  CONSTRAINT fk_dsp_driver  FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_dsp_status ON dispatches (status);
CREATE INDEX idx_dsp_shipment ON dispatches (shipment_id);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id    BIGINT UNSIGNED NOT NULL,
  maintenance_type VARCHAR(64) NOT NULL,
  scheduled_date DATE NULL,
  completed_at  DATETIME NULL,
  cost          DECIMAL(18,2) NULL,
  status        ENUM('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  notes         TEXT NULL,
  assignee_id   BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mt_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
  CONSTRAINT fk_mt_user FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_mt_status ON maintenance_records (status);