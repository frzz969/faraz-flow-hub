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