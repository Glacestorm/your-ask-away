-- ============================================
-- ERP ACCOUNTING PLANS - Planes Contables Oficiales Multi-País
-- ============================================

-- Tabla principal de planes contables por país
CREATE TABLE public.erp_accounting_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  plan_code VARCHAR(50) NOT NULL,
  plan_name VARCHAR(200) NOT NULL,
  plan_version VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Estructura del plan contable
  asset_groups JSONB DEFAULT '[]'::jsonb,
  liability_groups JSONB DEFAULT '[]'::jsonb,
  equity_groups JSONB DEFAULT '[]'::jsonb,
  income_groups JSONB DEFAULT '[]'::jsonb,
  expense_groups JSONB DEFAULT '[]'::jsonb,
  
  -- Mapeo de cuentas para OCR
  ocr_field_mappings JSONB DEFAULT '{}'::jsonb,
  
  -- Patrones de detección automática
  detection_patterns JSONB DEFAULT '{}'::jsonb,
  
  -- Plantilla completa del plan de cuentas
  chart_accounts_template JSONB DEFAULT '[]'::jsonb,
  
  -- Metadatos
  regulatory_reference VARCHAR(500),
  effective_date DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(country_code, plan_code)
);

-- Tabla de importaciones de estados financieros
CREATE TABLE public.erp_statement_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES public.erp_fiscal_years(id),
  accounting_plan_id UUID REFERENCES public.erp_accounting_plans(id),
  
  -- Información del archivo
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT,
  file_size_bytes INTEGER,
  
  -- Tipo de estado financiero
  statement_type VARCHAR(50) NOT NULL, -- 'balance_sheet', 'income_statement', 'cash_flow', 'trial_balance'
  
  -- Detección automática
  detected_country VARCHAR(3),
  detected_plan VARCHAR(50),
  detection_confidence DECIMAL(5,2),
  detected_language VARCHAR(10),
  
  -- Datos extraídos
  extracted_data JSONB DEFAULT '{}'::jsonb,
  mapped_accounts JSONB DEFAULT '[]'::jsonb,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  
  -- Estado del proceso
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'extracted', 'validated', 'imported', 'failed'
  processed_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ,
  imported_by UUID REFERENCES auth.users(id),
  
  -- Asientos generados
  generated_entries JSONB DEFAULT '[]'::jsonb,
  entry_count INTEGER DEFAULT 0,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_erp_accounting_plans_country ON public.erp_accounting_plans(country_code);
CREATE INDEX idx_erp_accounting_plans_active ON public.erp_accounting_plans(is_active);
CREATE INDEX idx_erp_statement_imports_company ON public.erp_statement_imports(company_id);
CREATE INDEX idx_erp_statement_imports_status ON public.erp_statement_imports(status);

-- Trigger para updated_at
CREATE TRIGGER update_erp_accounting_plans_timestamp
  BEFORE UPDATE ON public.erp_accounting_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_erp_statement_imports_timestamp
  BEFORE UPDATE ON public.erp_statement_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

-- RLS
ALTER TABLE public.erp_accounting_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_statement_imports ENABLE ROW LEVEL SECURITY;

-- Políticas: Planes contables son públicos de lectura
CREATE POLICY "Planes contables visibles para todos"
  ON public.erp_accounting_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Solo admins pueden modificar planes"
  ON public.erp_accounting_plans FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para importaciones
CREATE POLICY "Usuarios ven importaciones de sus empresas"
  ON public.erp_statement_imports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_user_companies uc
      WHERE uc.company_id = erp_statement_imports.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "Usuarios pueden crear importaciones en sus empresas"
  ON public.erp_statement_imports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.erp_user_companies uc
      WHERE uc.company_id = erp_statement_imports.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "Usuarios pueden actualizar importaciones de sus empresas"
  ON public.erp_statement_imports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_user_companies uc
      WHERE uc.company_id = erp_statement_imports.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

-- ============================================
-- INSERTAR PLANES CONTABLES OFICIALES
-- ============================================

-- ESPAÑA - Plan General de Contabilidad 2007
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  ocr_field_mappings, detection_patterns, regulatory_reference
) VALUES (
  'ES', 'España', 'PGC_2007', 'Plan General de Contabilidad', '2007', true,
  '[
    {"group": "1", "code_range": "10-19", "name": "Inmovilizado intangible", "accounts": ["200", "201", "202", "203", "204", "205", "206"]},
    {"group": "2", "code_range": "20-29", "name": "Inmovilizado material", "accounts": ["210", "211", "212", "213", "214", "215", "216", "217", "218", "219"]},
    {"group": "3", "code_range": "30-39", "name": "Inversiones inmobiliarias", "accounts": ["220", "221"]},
    {"group": "4", "code_range": "40-49", "name": "Inversiones financieras LP", "accounts": ["240", "241", "242", "249", "250", "251", "252", "253", "254", "255", "258", "259"]},
    {"group": "5", "code_range": "50-59", "name": "Existencias", "accounts": ["300", "301", "302", "303", "304", "305", "306", "307", "308", "309"]},
    {"group": "6", "code_range": "60-69", "name": "Deudores comerciales", "accounts": ["430", "431", "432", "433", "434", "435", "436"]},
    {"group": "7", "code_range": "70-79", "name": "Inversiones financieras CP", "accounts": ["540", "541", "542", "543", "544", "545", "546", "547", "548", "549"]},
    {"group": "8", "code_range": "80-89", "name": "Efectivo y equivalentes", "accounts": ["570", "571", "572", "573", "574", "575", "576"]}
  ]'::jsonb,
  '[
    {"group": "1", "code_range": "10-19", "name": "Deudas LP", "accounts": ["170", "171", "172", "173", "174", "175", "176", "177", "178", "179"]},
    {"group": "2", "code_range": "40-49", "name": "Acreedores comerciales", "accounts": ["400", "401", "403", "404", "405", "406", "407"]},
    {"group": "3", "code_range": "50-59", "name": "Deudas CP", "accounts": ["520", "521", "522", "523", "524", "525", "526", "527", "528", "529"]}
  ]'::jsonb,
  '[
    {"group": "1", "code_range": "10-11", "name": "Capital", "accounts": ["100", "101", "102", "103", "104", "105", "108", "109"]},
    {"group": "2", "code_range": "11-12", "name": "Reservas", "accounts": ["110", "111", "112", "113", "114", "115", "118", "119"]},
    {"group": "3", "code_range": "12-13", "name": "Resultados", "accounts": ["120", "121", "129"]}
  ]'::jsonb,
  '[
    {"group": "70", "name": "Ventas de mercaderías", "accounts": ["700", "701", "702", "703", "704", "705", "706", "707", "708", "709"]},
    {"group": "71", "name": "Variación de existencias", "accounts": ["710", "711", "712", "713"]},
    {"group": "73", "name": "Trabajos realizados para la empresa", "accounts": ["730", "731", "732", "733"]},
    {"group": "74", "name": "Subvenciones", "accounts": ["740", "741", "742", "746", "747"]},
    {"group": "75", "name": "Otros ingresos de gestión", "accounts": ["750", "751", "752", "753", "754", "755", "759"]},
    {"group": "76", "name": "Ingresos financieros", "accounts": ["760", "761", "762", "763", "764", "765", "766", "767", "768", "769"]},
    {"group": "77", "name": "Beneficios extraordinarios", "accounts": ["770", "771", "772", "773", "774", "775", "776", "778", "779"]}
  ]'::jsonb,
  '[
    {"group": "60", "name": "Compras", "accounts": ["600", "601", "602", "606", "607", "608", "609"]},
    {"group": "61", "name": "Variación de existencias", "accounts": ["610", "611", "612"]},
    {"group": "62", "name": "Servicios exteriores", "accounts": ["620", "621", "622", "623", "624", "625", "626", "627", "628", "629"]},
    {"group": "63", "name": "Tributos", "accounts": ["630", "631", "633", "634", "636", "638", "639"]},
    {"group": "64", "name": "Gastos de personal", "accounts": ["640", "641", "642", "643", "644", "645", "649"]},
    {"group": "65", "name": "Otros gastos de gestión", "accounts": ["650", "651", "652", "653", "654", "655", "656", "659"]},
    {"group": "66", "name": "Gastos financieros", "accounts": ["660", "661", "662", "663", "664", "665", "666", "667", "668", "669"]},
    {"group": "67", "name": "Pérdidas extraordinarias", "accounts": ["670", "671", "672", "673", "674", "675", "676", "678", "679"]},
    {"group": "68", "name": "Amortizaciones", "accounts": ["680", "681", "682"]},
    {"group": "69", "name": "Pérdidas por deterioro", "accounts": ["690", "691", "692", "693", "694", "695", "696", "697", "698", "699"]}
  ]'::jsonb,
  '{
    "balance_sheet": {
      "activo_no_corriente": ["Activo no corriente", "ACTIVO NO CORRIENTE", "A) ACTIVO NO CORRIENTE"],
      "activo_corriente": ["Activo corriente", "ACTIVO CORRIENTE", "B) ACTIVO CORRIENTE"],
      "patrimonio_neto": ["Patrimonio neto", "PATRIMONIO NETO", "A) PATRIMONIO NETO"],
      "pasivo_no_corriente": ["Pasivo no corriente", "PASIVO NO CORRIENTE", "B) PASIVO NO CORRIENTE"],
      "pasivo_corriente": ["Pasivo corriente", "PASIVO CORRIENTE", "C) PASIVO CORRIENTE"],
      "inmovilizado_intangible": ["Inmovilizado intangible", "I. Inmovilizado intangible"],
      "inmovilizado_material": ["Inmovilizado material", "II. Inmovilizado material"],
      "existencias": ["Existencias", "II. Existencias"],
      "deudores_comerciales": ["Deudores comerciales", "III. Deudores comerciales"],
      "efectivo": ["Efectivo y otros activos líquidos", "VII. Efectivo"]
    },
    "income_statement": {
      "importe_neto_cifra_negocios": ["Importe neto de la cifra de negocios", "1. Importe neto cifra negocios"],
      "aprovisionamientos": ["Aprovisionamientos", "4. Aprovisionamientos"],
      "gastos_personal": ["Gastos de personal", "6. Gastos de personal"],
      "amortizacion": ["Amortización del inmovilizado", "7. Amortización"],
      "resultado_explotacion": ["RESULTADO DE EXPLOTACIÓN", "A) RESULTADO DE EXPLOTACIÓN"],
      "resultado_financiero": ["RESULTADO FINANCIERO", "B) RESULTADO FINANCIERO"],
      "resultado_antes_impuestos": ["RESULTADO ANTES DE IMPUESTOS", "C) RESULTADO ANTES DE IMPUESTOS"],
      "resultado_ejercicio": ["RESULTADO DEL EJERCICIO", "D) RESULTADO DEL EJERCICIO"]
    }
  }'::jsonb,
  '{
    "keywords": ["PGC", "Plan General de Contabilidad", "Registro Mercantil", "ICAC", "España", "BOE"],
    "currency_symbol": "€",
    "decimal_separator": ",",
    "thousands_separator": ".",
    "date_format": "DD/MM/YYYY",
    "language_codes": ["es", "es-ES"]
  }'::jsonb,
  'Real Decreto 1514/2007, de 16 de noviembre'
);

-- ESPAÑA - PGC PYMES
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  detection_patterns, regulatory_reference
) VALUES (
  'ES', 'España', 'PGC_PYMES', 'Plan General de Contabilidad para PYMES', '2007', false,
  '[{"group": "2", "name": "Inmovilizado", "accounts": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29"]},
    {"group": "3", "name": "Existencias", "accounts": ["30", "31", "32", "33", "34", "35", "36"]},
    {"group": "4", "name": "Deudores", "accounts": ["43", "44", "46", "47"]},
    {"group": "5", "name": "Tesorería", "accounts": ["57"]}]'::jsonb,
  '[{"group": "1", "name": "Deudas LP", "accounts": ["17", "18"]},
    {"group": "4", "name": "Acreedores", "accounts": ["40", "41", "46", "47"]},
    {"group": "5", "name": "Deudas CP", "accounts": ["52", "56"]}]'::jsonb,
  '[{"group": "1", "name": "Capital y Reservas", "accounts": ["10", "11", "12", "13"]}]'::jsonb,
  '[{"group": "7", "name": "Ingresos", "accounts": ["70", "71", "73", "74", "75", "76", "77", "79"]}]'::jsonb,
  '[{"group": "6", "name": "Gastos", "accounts": ["60", "61", "62", "63", "64", "65", "66", "67", "68", "69"]}]'::jsonb,
  '{"keywords": ["PYMES", "pequeñas", "medianas empresas"], "language_codes": ["es"]}'::jsonb,
  'Real Decreto 1515/2007, de 16 de noviembre'
);

-- FRANCIA - Plan Comptable Général
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  ocr_field_mappings, detection_patterns, regulatory_reference
) VALUES (
  'FR', 'France', 'PCG', 'Plan Comptable Général', '2019', true,
  '[
    {"group": "2", "name": "Immobilisations", "accounts": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29"]},
    {"group": "3", "name": "Stocks et en-cours", "accounts": ["31", "32", "33", "34", "35", "36", "37", "38", "39"]},
    {"group": "4", "name": "Créances", "accounts": ["41", "42", "43", "44", "45", "46", "47", "48", "49"]},
    {"group": "5", "name": "Trésorerie", "accounts": ["50", "51", "52", "53", "54", "58", "59"]}
  ]'::jsonb,
  '[
    {"group": "1", "name": "Dettes financières", "accounts": ["16", "17", "18", "19"]},
    {"group": "4", "name": "Dettes exploitation", "accounts": ["40", "42", "43", "44", "45", "46", "47", "48", "49"]}
  ]'::jsonb,
  '[
    {"group": "1", "name": "Capitaux propres", "accounts": ["10", "11", "12", "13", "14", "15"]}
  ]'::jsonb,
  '[
    {"group": "7", "name": "Produits", "accounts": ["70", "71", "72", "73", "74", "75", "76", "77", "78", "79"]}
  ]'::jsonb,
  '[
    {"group": "6", "name": "Charges", "accounts": ["60", "61", "62", "63", "64", "65", "66", "67", "68", "69"]}
  ]'::jsonb,
  '{
    "balance_sheet": {
      "actif_immobilise": ["Actif immobilisé", "ACTIF IMMOBILISÉ"],
      "actif_circulant": ["Actif circulant", "ACTIF CIRCULANT"],
      "capitaux_propres": ["Capitaux propres", "CAPITAUX PROPRES"],
      "dettes": ["Dettes", "DETTES"]
    },
    "income_statement": {
      "chiffre_affaires": ["Chiffre d''affaires net", "CA net"],
      "resultat_exploitation": ["Résultat d''exploitation"],
      "resultat_financier": ["Résultat financier"],
      "resultat_net": ["Résultat net", "RÉSULTAT NET"]
    }
  }'::jsonb,
  '{
    "keywords": ["PCG", "Plan Comptable", "liasse fiscale", "France", "ANC"],
    "currency_symbol": "€",
    "decimal_separator": ",",
    "thousands_separator": " ",
    "date_format": "DD/MM/YYYY",
    "language_codes": ["fr", "fr-FR"]
  }'::jsonb,
  'Règlement ANC 2014-03 modifié'
);

-- ALEMANIA - Handelsgesetzbuch (HGB)
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  ocr_field_mappings, detection_patterns, regulatory_reference
) VALUES (
  'DE', 'Deutschland', 'HGB', 'Handelsgesetzbuch Kontenrahmen', '2023', true,
  '[
    {"group": "0", "name": "Anlagevermögen", "accounts": ["0"]},
    {"group": "1", "name": "Umlaufvermögen", "accounts": ["1"]},
    {"group": "2", "name": "Forderungen", "accounts": ["2"]},
    {"group": "3", "name": "Vorräte", "accounts": ["3"]}
  ]'::jsonb,
  '[
    {"group": "4", "name": "Verbindlichkeiten", "accounts": ["4"]},
    {"group": "8", "name": "Kurzfristige Verbindlichkeiten", "accounts": ["8"]}
  ]'::jsonb,
  '[
    {"group": "0", "name": "Eigenkapital", "accounts": ["0"]}
  ]'::jsonb,
  '[
    {"group": "5", "name": "Erträge", "accounts": ["5"]}
  ]'::jsonb,
  '[
    {"group": "6", "name": "Aufwendungen", "accounts": ["6"]},
    {"group": "7", "name": "Abschreibungen", "accounts": ["7"]}
  ]'::jsonb,
  '{
    "balance_sheet": {
      "anlagevermoegen": ["Anlagevermögen", "A. ANLAGEVERMÖGEN"],
      "umlaufvermoegen": ["Umlaufvermögen", "B. UMLAUFVERMÖGEN"],
      "eigenkapital": ["Eigenkapital", "A. EIGENKAPITAL"],
      "verbindlichkeiten": ["Verbindlichkeiten", "C. VERBINDLICHKEITEN"]
    },
    "income_statement": {
      "umsatzerloese": ["Umsatzerlöse"],
      "jahresueberschuss": ["Jahresüberschuss", "Jahresfehlbetrag"]
    }
  }'::jsonb,
  '{
    "keywords": ["HGB", "Handelsgesetzbuch", "Deutschland", "Bilanz", "GuV"],
    "currency_symbol": "€",
    "decimal_separator": ",",
    "thousands_separator": ".",
    "date_format": "DD.MM.YYYY",
    "language_codes": ["de", "de-DE"]
  }'::jsonb,
  'Handelsgesetzbuch (HGB) §§ 238-342e'
);

-- ITALIA - Piano dei Conti
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  detection_patterns, regulatory_reference
) VALUES (
  'IT', 'Italia', 'OIC', 'Piano dei Conti OIC', '2023', true,
  '[{"group": "B", "name": "Immobilizzazioni", "accounts": ["B.I", "B.II", "B.III"]},
    {"group": "C", "name": "Attivo circolante", "accounts": ["C.I", "C.II", "C.III", "C.IV"]}]'::jsonb,
  '[{"group": "D", "name": "Debiti", "accounts": ["D"]}]'::jsonb,
  '[{"group": "A", "name": "Patrimonio netto", "accounts": ["A.I", "A.II", "A.III", "A.IV", "A.V", "A.VI", "A.VII", "A.VIII", "A.IX"]}]'::jsonb,
  '[{"group": "A", "name": "Valore della produzione", "accounts": ["A.1", "A.2", "A.3", "A.4", "A.5"]}]'::jsonb,
  '[{"group": "B", "name": "Costi della produzione", "accounts": ["B.6", "B.7", "B.8", "B.9", "B.10", "B.11", "B.12", "B.13", "B.14"]}]'::jsonb,
  '{"keywords": ["OIC", "Codice Civile", "Italia", "bilancio", "conto economico"], "language_codes": ["it", "it-IT"]}'::jsonb,
  'Codice Civile art. 2423-2435 e Principi OIC'
);

-- PORTUGAL - Sistema de Normalização Contabilística
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  detection_patterns, regulatory_reference
) VALUES (
  'PT', 'Portugal', 'SNC', 'Sistema de Normalização Contabilística', '2016', true,
  '[{"group": "4", "name": "Investimentos", "accounts": ["41", "42", "43", "44", "45", "46"]},
    {"group": "3", "name": "Inventários", "accounts": ["31", "32", "33", "34", "35", "36", "37", "38", "39"]},
    {"group": "2", "name": "Contas a receber", "accounts": ["21", "22", "23", "24", "25", "26", "27", "28", "29"]},
    {"group": "1", "name": "Meios financeiros líquidos", "accounts": ["11", "12", "13", "14"]}]'::jsonb,
  '[{"group": "2", "name": "Contas a pagar", "accounts": ["21", "22", "23", "24", "25", "26", "27", "28", "29"]}]'::jsonb,
  '[{"group": "5", "name": "Capital próprio", "accounts": ["51", "52", "53", "54", "55", "56", "57", "58", "59"]}]'::jsonb,
  '[{"group": "7", "name": "Rendimentos", "accounts": ["71", "72", "73", "74", "75", "76", "77", "78", "79"]}]'::jsonb,
  '[{"group": "6", "name": "Gastos", "accounts": ["61", "62", "63", "64", "65", "66", "67", "68", "69"]}]'::jsonb,
  '{"keywords": ["SNC", "Portugal", "Balanço", "Demonstração de resultados"], "language_codes": ["pt", "pt-PT"]}'::jsonb,
  'Decreto-Lei 98/2015 e Aviso 8256/2015'
);

-- REINO UNIDO - UK GAAP / FRS 102
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  ocr_field_mappings, detection_patterns, regulatory_reference
) VALUES (
  'GB', 'United Kingdom', 'FRS102', 'Financial Reporting Standard 102', '2023', true,
  '[{"group": "FA", "name": "Fixed Assets", "accounts": ["FA01", "FA02", "FA03"]},
    {"group": "CA", "name": "Current Assets", "accounts": ["CA01", "CA02", "CA03", "CA04"]}]'::jsonb,
  '[{"group": "CL", "name": "Current Liabilities", "accounts": ["CL01", "CL02", "CL03"]},
    {"group": "LTL", "name": "Long-term Liabilities", "accounts": ["LTL01", "LTL02"]}]'::jsonb,
  '[{"group": "EQ", "name": "Shareholders Equity", "accounts": ["EQ01", "EQ02", "EQ03", "EQ04"]}]'::jsonb,
  '[{"group": "REV", "name": "Revenue", "accounts": ["REV01", "REV02"]},
    {"group": "OI", "name": "Other Income", "accounts": ["OI01", "OI02"]}]'::jsonb,
  '[{"group": "COS", "name": "Cost of Sales", "accounts": ["COS01", "COS02"]},
    {"group": "ADM", "name": "Administrative Expenses", "accounts": ["ADM01", "ADM02", "ADM03"]}]'::jsonb,
  '{
    "balance_sheet": {
      "fixed_assets": ["Fixed Assets", "Non-current assets"],
      "current_assets": ["Current Assets"],
      "shareholders_equity": ["Shareholders'' equity", "Capital and reserves"],
      "current_liabilities": ["Creditors: amounts falling due within one year"],
      "long_term_liabilities": ["Creditors: amounts falling due after more than one year"]
    },
    "income_statement": {
      "turnover": ["Turnover", "Revenue"],
      "cost_of_sales": ["Cost of sales"],
      "gross_profit": ["Gross profit"],
      "operating_profit": ["Operating profit"],
      "profit_before_tax": ["Profit before taxation"],
      "profit_after_tax": ["Profit for the financial year"]
    }
  }'::jsonb,
  '{
    "keywords": ["FRS 102", "UK GAAP", "Companies House", "United Kingdom", "Sterling"],
    "currency_symbol": "£",
    "decimal_separator": ".",
    "thousands_separator": ",",
    "date_format": "DD/MM/YYYY",
    "language_codes": ["en", "en-GB"]
  }'::jsonb,
  'FRS 102 The Financial Reporting Standard applicable in the UK and Republic of Ireland'
);

-- IFRS - Normas Internacionales
INSERT INTO public.erp_accounting_plans (
  country_code, country_name, plan_code, plan_name, plan_version, is_default,
  asset_groups, liability_groups, equity_groups, income_groups, expense_groups,
  ocr_field_mappings, detection_patterns, regulatory_reference
) VALUES (
  'XX', 'International', 'IFRS', 'International Financial Reporting Standards', '2023', true,
  '[{"group": "NCA", "name": "Non-current Assets", "accounts": ["NCA"]},
    {"group": "CA", "name": "Current Assets", "accounts": ["CA"]}]'::jsonb,
  '[{"group": "NCL", "name": "Non-current Liabilities", "accounts": ["NCL"]},
    {"group": "CL", "name": "Current Liabilities", "accounts": ["CL"]}]'::jsonb,
  '[{"group": "EQ", "name": "Equity", "accounts": ["EQ"]}]'::jsonb,
  '[{"group": "REV", "name": "Revenue", "accounts": ["REV"]},
    {"group": "OCI", "name": "Other Comprehensive Income", "accounts": ["OCI"]}]'::jsonb,
  '[{"group": "EXP", "name": "Expenses", "accounts": ["EXP"]}]'::jsonb,
  '{
    "balance_sheet": {
      "non_current_assets": ["Non-current assets", "NON-CURRENT ASSETS"],
      "current_assets": ["Current assets", "CURRENT ASSETS"],
      "equity": ["Equity", "EQUITY"],
      "non_current_liabilities": ["Non-current liabilities"],
      "current_liabilities": ["Current liabilities"]
    },
    "income_statement": {
      "revenue": ["Revenue"],
      "cost_of_sales": ["Cost of sales"],
      "gross_profit": ["Gross profit"],
      "operating_profit": ["Operating profit", "Profit from operations"],
      "profit_before_tax": ["Profit before tax"],
      "profit_for_period": ["Profit for the period", "Net income"]
    }
  }'::jsonb,
  '{
    "keywords": ["IFRS", "IAS", "International", "IASB"],
    "currency_symbol": "$",
    "decimal_separator": ".",
    "thousands_separator": ",",
    "date_format": "YYYY-MM-DD",
    "language_codes": ["en"]
  }'::jsonb,
  'IFRS Foundation - International Accounting Standards Board'
);