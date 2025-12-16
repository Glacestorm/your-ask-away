-- Crear tabla cnae_sector_mapping si no existe
CREATE TABLE IF NOT EXISTS public.cnae_sector_mapping (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cnae_code TEXT NOT NULL,
    cnae_description TEXT,
    sector TEXT NOT NULL,
    sector_name TEXT NOT NULL,
    default_regulations TEXT[] DEFAULT '{}',
    default_kpis TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cnae_sector_mapping_code ON public.cnae_sector_mapping(cnae_code);

ALTER TABLE public.cnae_sector_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read CNAE mapping" ON public.cnae_sector_mapping;
CREATE POLICY "Anyone can read CNAE mapping"
ON public.cnae_sector_mapping
FOR SELECT
USING (true);

-- Seed data para mapeo CNAE-sector común
INSERT INTO public.cnae_sector_mapping (cnae_code, cnae_description, sector, sector_name, default_regulations, default_kpis) VALUES
('6419', 'Otra intermediación monetaria', 'banking', 'Banca y Servicios Financieros', ARRAY['DORA', 'MiFID-II', 'CRR-CRD', 'PSD2', 'AMLD'], ARRAY['ROE', 'ROA', 'LCR', 'NSFR', 'CET1', 'Mora']),
('6430', 'Inversión colectiva', 'banking', 'Gestión de Fondos', ARRAY['MiFID-II', 'UCITS', 'AIFMD'], ARRAY['AUM', 'TER', 'Sharpe', 'Alpha']),
('6499', 'Otros servicios financieros', 'banking', 'Servicios Financieros', ARRAY['MiFID-II', 'PSD2'], ARRAY['ROE', 'Margen']),
('6511', 'Seguros de vida', 'insurance', 'Seguros de Vida', ARRAY['Solvencia-II', 'IDD'], ARRAY['SCR', 'Siniestralidad', 'Prima Media']),
('6512', 'Seguros distintos de vida', 'insurance', 'Seguros Generales', ARRAY['Solvencia-II', 'IDD'], ARRAY['Loss Ratio', 'Combined Ratio']),
('8610', 'Actividades hospitalarias', 'healthcare', 'Hospitales', ARRAY['RGPD-Salud', 'ENS'], ARRAY['Ocupación', 'Estancia Media', 'Reingresos']),
('8621', 'Actividades de medicina general', 'healthcare', 'Atención Primaria', ARRAY['RGPD-Salud'], ARRAY['Pacientes/día', 'Derivaciones']),
('4711', 'Comercio minorista alimentación', 'retail', 'Supermercados', ARRAY['LSSI', 'RGPD'], ARRAY['Ventas/m2', 'Rotación', 'Ticket Medio']),
('4719', 'Otro comercio minorista', 'retail', 'Retail General', ARRAY['LSSI', 'RGPD'], ARRAY['Conversión', 'AOV', 'Retención']),
('2910', 'Fabricación vehículos motor', 'manufacturing', 'Automoción', ARRAY['ISO-14001', 'REACH'], ARRAY['OEE', 'Defectos/Millón', 'Lead Time']),
('2611', 'Fabricación componentes electrónicos', 'manufacturing', 'Electrónica', ARRAY['RoHS', 'WEEE'], ARRAY['Yield', 'Ciclo', 'Scrap Rate']),
('6810', 'Compraventa inmuebles', 'real_estate', 'Inmobiliario', ARRAY['LCCI', 'Blanqueo'], ARRAY['Yield', 'Ocupación', 'NOI']),
('6820', 'Alquiler inmuebles', 'real_estate', 'Gestión Patrimonial', ARRAY['LAU', 'RGPD'], ARRAY['Yield', 'Morosidad', 'Rotación']),
('3511', 'Producción energía eléctrica', 'energy', 'Generación Eléctrica', ARRAY['RED-II', 'ETS'], ARRAY['Factor Carga', 'LCOE', 'Emisiones']),
('3514', 'Comercio energía eléctrica', 'energy', 'Comercialización', ARRAY['CNMC', 'OMIE'], ARRAY['Margen MWh', 'Churn', 'ARPU']),
('6110', 'Telecomunicaciones por cable', 'telecom', 'Telecomunicaciones', ARRAY['CNMC-Telecom', 'RGPD'], ARRAY['ARPU', 'Churn', 'NPS']),
('6120', 'Telecomunicaciones inalámbricas', 'telecom', 'Telecomunicaciones Móviles', ARRAY['CNMC-Telecom', 'Espectro'], ARRAY['ARPU', 'MOU', 'Data/User']),
('8520', 'Educación primaria', 'education', 'Educación Primaria', ARRAY['LOMLOE', 'RGPD-Menores'], ARRAY['Ratio Alumno/Profesor', 'Aprobados']),
('8542', 'Educación terciaria', 'education', 'Universidad', ARRAY['LOU', 'ANECA'], ARRAY['Empleabilidad', 'Investigación', 'Rankings']),
('4910', 'Transporte ferroviario', 'logistics', 'Ferrocarril', ARRAY['ERA', 'Seguridad-Ferroviaria'], ARRAY['Puntualidad', 'Ocupación', 'Incidentes']),
('4941', 'Transporte mercancías carretera', 'logistics', 'Transporte Terrestre', ARRAY['ADR', 'Tacógrafo'], ARRAY['Km/Litro', 'Entregas/Día', 'Incidencias']),
('5510', 'Hoteles y alojamientos', 'hospitality', 'Hotelería', ARRAY['Turismo', 'RGPD'], ARRAY['RevPAR', 'ADR', 'Ocupación']),
('5610', 'Restaurantes', 'hospitality', 'Restauración', ARRAY['Sanidad-Alimentaria', 'APPCC'], ARRAY['Ticket Medio', 'Rotación Mesas', 'Food Cost'])
ON CONFLICT (cnae_code) DO NOTHING;