-- Añadir nuevos campos a la tabla visits
ALTER TABLE public.visits
ADD COLUMN productos_ofrecidos TEXT[],
ADD COLUMN porcentaje_vinculacion NUMERIC(5,2) CHECK (porcentaje_vinculacion >= 0 AND porcentaje_vinculacion <= 100),
ADD COLUMN pactos_realizados TEXT;

-- Insertar productos típicos de banca en la tabla products si no existen
-- Productos de PASIVO (ahorro/depósitos)
INSERT INTO public.products (name, category, description, active) VALUES
('Cuenta Corriente', 'pasivo', 'Cuenta corriente para operativa diaria', true),
('Cuenta de Ahorro', 'pasivo', 'Cuenta remunerada de ahorro', true),
('Depósito a Plazo Fijo', 'pasivo', 'Depósito a plazo con interés fijo', true),
('Depósito Estructurado', 'pasivo', 'Depósito con rentabilidad ligada a subyacente', true),
('Plan de Pensiones', 'pasivo', 'Producto de ahorro para la jubilación', true)
ON CONFLICT DO NOTHING;

-- Productos de ACTIVO (préstamos/financiación)
INSERT INTO public.products (name, category, description, active) VALUES
('Hipoteca Vivienda', 'activo', 'Financiación para compra de vivienda', true),
('Préstamo Personal', 'activo', 'Préstamo personal para particulares', true),
('Préstamo Empresa', 'activo', 'Financiación empresarial', true),
('Línea de Crédito', 'activo', 'Línea de crédito disponible', true),
('Leasing', 'activo', 'Arrendamiento financiero', true),
('Renting', 'activo', 'Alquiler operativo', true),
('Descuento Comercial', 'activo', 'Anticipo de efectos comerciales', true),
('Confirming', 'activo', 'Gestión de pagos a proveedores', true),
('Avales y Garantías', 'activo', 'Emisión de avales bancarios', true),
('Financiación Comercio Exterior', 'activo', 'Financiación de operaciones internacionales', true)
ON CONFLICT DO NOTHING;

-- Servicios adicionales
INSERT INTO public.products (name, category, description, active) VALUES
('Tarjeta de Crédito', 'servicio', 'Tarjeta de crédito', true),
('Tarjeta de Débito', 'servicio', 'Tarjeta de débito', true),
('Banca Online', 'servicio', 'Servicios de banca digital', true),
('Transferencias', 'servicio', 'Servicio de transferencias', true),
('Seguros', 'servicio', 'Productos de seguros', true),
('Gestión de Activos', 'servicio', 'Gestión patrimonial', true)
ON CONFLICT DO NOTHING;

-- Crear índice para mejorar búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Comentarios para documentación
COMMENT ON COLUMN public.visits.productos_ofrecidos IS 'Array de nombres de productos ofrecidos en la visita';
COMMENT ON COLUMN public.visits.porcentaje_vinculacion IS 'Porcentaje de vinculación conseguido (0-100)';
COMMENT ON COLUMN public.visits.pactos_realizados IS 'Descripción de los pactos realizados con el cliente';