-- SNAPSHOT GENERATED — kanonis: database/migrations/001-009, jangan edit manual
-- Snapshot gabungan dari database/migrations/001-009.sql; untuk migrasi gunakan backend/scripts/migrate.ts.

-- ================ 001_auth_core.sql ================
-- =====================================================================
-- FARAZZ FLOW — Migration 001: Core (auth, RBAC, audit, system)
-- =====================================================================

CREATE TABLE IF NOT EXISTS roles (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(64)  NOT NULL UNIQUE,
  name          VARCHAR(128) NOT NULL,
  description   VARCHAR(255) NULL,
  is_system     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(96)  NOT NULL UNIQUE COMMENT 'e.g. shipments.view',
  module        VARCHAR(48)  NOT NULL,
  action        VARCHAR(24)  NOT NULL COMMENT 'view|create|update|delete|approve|reject|export|assign|manage',
  name          VARCHAR(128) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_permissions_module ON permissions (module);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES roles (id)       ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(128) NOT NULL,
  email                 VARCHAR(190) NOT NULL UNIQUE,
  phone                 VARCHAR(32)  NULL,
  role_id               BIGINT UNSIGNED NOT NULL,
  department            VARCHAR(64)  NULL,
  password_hash         VARCHAR(255) NOT NULL COMMENT 'scrypt$N$r$p$salt$hash',
  status                ENUM('active','inactive') NOT NULL DEFAULT 'active',
  failed_login_attempts INT          NOT NULL DEFAULT 0,
  locked_until          DATETIME     NULL,
  last_login_at         DATETIME     NULL,
  last_active_at        DATETIME     NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            DATETIME     NULL,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_role  ON users (role_id);

CREATE TABLE IF NOT EXISTS sessions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  token_hash    CHAR(64)  NOT NULL UNIQUE COMMENT 'sha256 of session token',
  ip_address    VARCHAR(64) NULL,
  user_agent    VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,
  last_seen_at  DATETIME NULL,
  revoked_at    DATETIME NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sessions_user  ON sessions (user_id);
CREATE INDEX idx_sessions_expiry ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS login_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NULL,
  email       VARCHAR(190) NOT NULL,
  status      ENUM('success','failed','locked') NOT NULL,
  reason      VARCHAR(190) NULL,
  ip_address  VARCHAR(64) NULL,
  user_agent  VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_login_history_email  ON login_history (email);
CREATE INDEX idx_login_history_time   ON login_history (created_at);

CREATE TABLE IF NOT EXISTS security_events (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type  VARCHAR(64) NOT NULL COMMENT 'FAILED_LOGIN|ACCOUNT_LOCKOUT|SESSION_REVOKED|PASSWORD_CHANGE|ROLE_CHANGE|PERMISSION_CHANGE|...',
  user_id     BIGINT UNSIGNED NULL,
  resource    VARCHAR(64) NULL,
  resource_id VARCHAR(128) NULL,
  ip_address  VARCHAR(64) NULL,
  user_agent  VARCHAR(255) NULL,
  severity    ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
  details     JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_se_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_se_type ON security_events (event_type);
CREATE INDEX idx_se_time ON security_events (created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NULL,
  action      VARCHAR(64) NOT NULL COMMENT 'CREATE|UPDATE|DELETE|APPROVE|REJECT|LOGIN|LOGOUT|...',
  resource    VARCHAR(64) NULL,
  resource_id VARCHAR(128) NULL,
  `before`    JSON NULL,
  `after`     JSON NULL,
  ip_address  VARCHAR(64) NULL,
  user_agent  VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_action ON audit_logs (action);
CREATE INDEX idx_audit_resource ON audit_logs (resource, resource_id);
CREATE INDEX idx_audit_time ON audit_logs (created_at);

CREATE TABLE IF NOT EXISTS activity_logs (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NULL,
  user_name    VARCHAR(128) NULL,
  action       VARCHAR(128) NOT NULL,
  module       VARCHAR(64)  NULL,
  record       VARCHAR(128) NULL,
  before_value VARCHAR(255) NULL,
  after_value  VARCHAR(255) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_actlog_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_activity_time ON activity_logs (created_at);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(128) PRIMARY KEY,
  setting_value JSON NULL,
  description VARCHAR(255) NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  idem_key      VARCHAR(128) NOT NULL,
  user_id       BIGINT UNSIGNED NULL,
  resource      VARCHAR(64) NOT NULL,
  response_code INT NULL,
  response_body JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,
  CONSTRAINT fk_idem_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  UNIQUE KEY uq_idem (idem_key, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_idem_expiry ON idempotency_keys (expires_at);

CREATE TABLE IF NOT EXISTS background_jobs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(128) NOT NULL,
  status        ENUM('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  payload       JSON NULL,
  attempts      INT NOT NULL DEFAULT 0,
  max_attempts  INT NOT NULL DEFAULT 3,
  last_error    TEXT NULL,
  scheduled_at  DATETIME NULL,
  started_at    DATETIME NULL,
  finished_at   DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_jobs_status ON background_jobs (status, scheduled_at);

-- ================ 002_operations.sql ================
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

-- ================ 003_warehouse.sql ================
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

-- ================ 004_fleet.sql ================
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

-- ================ 005_business.sql ================
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

-- ================ 006_finance.sql ================
-- =====================================================================
-- FARAZZ FLOW — Migration 006: Finance (billing, invoices, payments, COD)
-- =====================================================================

CREATE TABLE IF NOT EXISTS billing_documents (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doc_no        VARCHAR(40) NOT NULL UNIQUE,
  doc_type      ENUM('estimate','invoice','receipt') NOT NULL,
  customer_id   BIGINT UNSIGNED NULL,
  shipment_id   BIGINT UNSIGNED NULL,
  issue_date    DATE NOT NULL,
  due_date      DATE NULL,
  sub_total     DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount      DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax           DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax_rate      DECIMAL(6,2)  NOT NULL DEFAULT 0,
  total         DECIMAL(18,2) NOT NULL DEFAULT 0,
  amount_paid   DECIMAL(18,2) NOT NULL DEFAULT 0,
  status        ENUM('draft','sent','partial','settled','cancelled','overdue') NOT NULL DEFAULT 'draft',
  paid_at       DATETIME NULL,
  notes         TEXT NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bill_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_bill_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bill_status ON billing_documents (status);
CREATE INDEX idx_bill_customer ON billing_documents (customer_id);

CREATE TABLE IF NOT EXISTS invoice_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id    BIGINT UNSIGNED NOT NULL,
  description   VARCHAR(255) NOT NULL,
  quantity      DECIMAL(14,3) NOT NULL DEFAULT 1,
  unit_price    DECIMAL(18,2) NOT NULL DEFAULT 0,
  amount        DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES billing_documents (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_no    VARCHAR(40) NOT NULL UNIQUE,
  invoice_id    BIGINT UNSIGNED NULL,
  customer_id   BIGINT UNSIGNED NULL,
  method        VARCHAR(48) NOT NULL COMMENT 'cash|transfer|card|cod|ewallet',
  amount        DECIMAL(18,2) NOT NULL,
  status        ENUM('pending','success','failed','refunded','cancelled') NOT NULL DEFAULT 'pending',
  paid_at       DATETIME NULL,
  reference     VARCHAR(64) NULL,
  notes         TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES billing_documents (id) ON DELETE SET NULL,
  CONSTRAINT fk_pay_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pay_status ON payments (status);

CREATE TABLE IF NOT EXISTS cod_settlements (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  settlement_no VARCHAR(40) NOT NULL UNIQUE,
  shipment_id   BIGINT UNSIGNED NULL,
  cod_amount    DECIMAL(18,2) NOT NULL,
  fee           DECIMAL(18,2) NOT NULL DEFAULT 0,
  net_amount    DECIMAL(18,2) NOT NULL,
  status        ENUM('pending','collected','transferred','released','disputed') NOT NULL DEFAULT 'pending',
  collected_at  DATETIME NULL,
  transferred_at DATETIME NULL,
  notes         TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cod_shipment FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cod_status ON cod_settlements (status);

-- ================ 007_workspace.sql ================
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

-- ================ 008_admin_access.sql ================
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

-- ================ 009_soft_deletes.sql ================
-- =====================================================================
-- FARAZZ FLOW — Migration 009: Add soft-delete support to all CRUD tables
-- makeCrud defaults to soft delete (deleted_at IS NULL); these tables
-- were created before that convention landed.
--
-- NOTE: service_types & pricing_rules have no updated_at column, so their
-- deleted_at goes AFTER created_at. Applied on 2026-09-07.
-- =====================================================================

ALTER TABLE approvals            ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE billing_documents    ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE cod_settlements      ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE contracts            ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE deliveries           ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE dispatches           ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE documents            ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE exceptions           ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE inbound_orders       ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE inventory            ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE invoice_items        ADD COLUMN deleted_at DATETIME NULL AFTER created_at;
ALTER TABLE maintenance_records  ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE orders               ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE orders               ADD COLUMN completed_at DATETIME NULL AFTER updated_at;
ALTER TABLE outbound_orders      ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE payments             ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE pricing_rules        ADD COLUMN deleted_at DATETIME NULL AFTER created_at;
ALTER TABLE returns              ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE routes               ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE service_types        ADD COLUMN deleted_at DATETIME NULL AFTER created_at;
ALTER TABLE sorting_tasks        ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE tasks                ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;