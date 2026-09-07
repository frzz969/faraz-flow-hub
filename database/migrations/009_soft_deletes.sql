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