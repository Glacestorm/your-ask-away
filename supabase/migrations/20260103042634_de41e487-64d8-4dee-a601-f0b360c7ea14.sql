-- =====================================================
-- MIGRACIÓN: Deprecar tablas redundantes con Banking Hub
-- Solo vistas de compatibilidad y documentación
-- =====================================================

-- 1. Crear vista de compatibilidad para erp_trade_api_connections
CREATE OR REPLACE VIEW v_erp_trade_api_connections_compat AS
SELECT 
  bc.id,
  bc.company_id,
  bp.provider_code as provider_type,
  bc.connection_name,
  bc.status::text,
  NULL::jsonb as api_key_encrypted,
  NULL::jsonb as api_secret_encrypted,
  NULL::text as certificate_data,
  bc.consent_expires_at as token_expires_at,
  bc.auto_reconcile as is_active,
  bc.last_sync_at,
  bc.created_at,
  bc.updated_at
FROM erp_bank_connections bc
JOIN erp_banking_providers bp ON bc.provider_id = bp.id;

-- 2. Añadir columnas de migración para tracking
ALTER TABLE erp_financial_entities 
ADD COLUMN IF NOT EXISTS migrated_to_banking_hub boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS migrated_at timestamptz;

ALTER TABLE erp_trade_api_connections 
ADD COLUMN IF NOT EXISTS migrated_to_banking_hub boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS migrated_at timestamptz;

-- 3. Comentarios de documentación
COMMENT ON TABLE erp_financial_entities IS 'DEPRECATED: Para entidades bancarias usar erp_banking_providers. Para cuentas usar erp_bank_accounts.';
COMMENT ON TABLE erp_trade_api_connections IS 'DEPRECATED: Usar erp_bank_connections del módulo Banking Hub.';
COMMENT ON VIEW v_erp_trade_api_connections_compat IS 'Vista de compatibilidad para código legado que use erp_trade_api_connections';