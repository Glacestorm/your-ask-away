-- Añadir columnas faltantes a customer_shipping para la pestaña Logística
ALTER TABLE customer_shipping 
ADD COLUMN IF NOT EXISTS preferred_carrier text,
ADD COLUMN IF NOT EXISTS delivery_notes text,
ADD COLUMN IF NOT EXISTS requires_appointment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS partial_delivery_allowed boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS default_warehouse_id uuid REFERENCES warehouses(id);

-- Añadir columnas faltantes a sepa_mandates para mandatos SEPA completos
ALTER TABLE sepa_mandates 
ADD COLUMN IF NOT EXISTS iban text,
ADD COLUMN IF NOT EXISTS bic text,
ADD COLUMN IF NOT EXISTS debtor_name text,
ADD COLUMN IF NOT EXISTS creditor_id text,
ADD COLUMN IF NOT EXISTS sequence_type text DEFAULT 'FRST' CHECK (sequence_type IN ('FRST', 'RCUR', 'OOFF', 'FNAL')),
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Añadir columnas faltantes a warehouse_locations para ubicaciones detalladas
ALTER TABLE warehouse_locations 
ADD COLUMN IF NOT EXISTS zone text,
ADD COLUMN IF NOT EXISTS aisle text,
ADD COLUMN IF NOT EXISTS rack text,
ADD COLUMN IF NOT EXISTS level text;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_customer_shipping_warehouse ON customer_shipping(default_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sepa_mandates_customer ON sepa_mandates(customer_id);
CREATE INDEX IF NOT EXISTS idx_sepa_mandates_active ON sepa_mandates(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_zone ON warehouse_locations(zone);

-- Comentarios de documentación
COMMENT ON COLUMN customer_shipping.preferred_carrier IS 'Transportista preferido del cliente';
COMMENT ON COLUMN customer_shipping.requires_appointment IS 'Si requiere cita previa para entregas';
COMMENT ON COLUMN customer_shipping.partial_delivery_allowed IS 'Si permite entregas parciales';
COMMENT ON COLUMN sepa_mandates.sequence_type IS 'Tipo de secuencia SEPA: FRST=Primero, RCUR=Recurrente, OOFF=Único, FNAL=Final';
COMMENT ON COLUMN warehouse_locations.zone IS 'Zona del almacén';
COMMENT ON COLUMN warehouse_locations.aisle IS 'Pasillo';
COMMENT ON COLUMN warehouse_locations.rack IS 'Estante';
COMMENT ON COLUMN warehouse_locations.level IS 'Nivel/altura';