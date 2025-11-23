-- Añadir campo BP (número de cuenta bancaria) y tipo de cliente a la tabla companies
ALTER TABLE companies 
ADD COLUMN bp TEXT,
ADD COLUMN client_type TEXT CHECK (client_type IN ('cliente', 'potencial_cliente'));

-- Añadir comentarios para documentar los campos
COMMENT ON COLUMN companies.bp IS 'Número de cuenta bancaria de la empresa (Bank Account Number)';
COMMENT ON COLUMN companies.client_type IS 'Tipo de cliente: cliente o potencial_cliente';