
-- Tabla de planes contables sectoriales
CREATE TABLE IF NOT EXISTS public.sector_chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_key TEXT NOT NULL UNIQUE,
  sector_name TEXT NOT NULL,
  cnae_codes TEXT[] NOT NULL DEFAULT '{}',
  account_structure JSONB NOT NULL DEFAULT '{}',
  ratio_definitions JSONB NOT NULL DEFAULT '{}',
  zscore_model TEXT DEFAULT 'altman_original',
  zscore_coefficients JSONB NOT NULL DEFAULT '{}',
  benchmark_ranges JSONB NOT NULL DEFAULT '{}',
  compliance_rules JSONB DEFAULT '{}',
  tax_implications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_sector_chart_cnae_codes ON public.sector_chart_of_accounts USING GIN(cnae_codes);
CREATE INDEX IF NOT EXISTS idx_sector_chart_sector_key ON public.sector_chart_of_accounts(sector_key);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_sector_chart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sector_chart_timestamp ON public.sector_chart_of_accounts;
CREATE TRIGGER trg_sector_chart_timestamp
  BEFORE UPDATE ON public.sector_chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION update_sector_chart_timestamp();

-- Función para obtener plan contable de una empresa basado en sus CNAEs
CREATE OR REPLACE FUNCTION get_company_chart_of_accounts(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_company_cnaes RECORD;
  v_weighted_ratios JSONB := '{}';
  v_weighted_zscore JSONB := '{}';
  v_weighted_benchmarks JSONB := '{}';
  v_total_weight NUMERIC := 0;
  v_sector_config RECORD;
BEGIN
  -- Obtener CNAEs de la empresa con sus porcentajes
  FOR v_company_cnaes IN 
    SELECT cc.cnae_code, cc.percentage_activity, cc.is_primary
    FROM company_cnaes cc
    WHERE cc.company_id = p_company_id
    ORDER BY cc.is_primary DESC, cc.percentage_activity DESC
  LOOP
    -- Buscar configuración sectorial para este CNAE
    SELECT * INTO v_sector_config
    FROM sector_chart_of_accounts sca
    WHERE v_company_cnaes.cnae_code = ANY(sca.cnae_codes)
    LIMIT 1;
    
    IF v_sector_config IS NOT NULL THEN
      v_total_weight := v_total_weight + COALESCE(v_company_cnaes.percentage_activity, 100);
      
      -- Acumular configuración ponderada
      v_weighted_ratios := v_weighted_ratios || jsonb_build_object(
        v_sector_config.sector_key, 
        jsonb_build_object(
          'weight', COALESCE(v_company_cnaes.percentage_activity, 100),
          'ratios', v_sector_config.ratio_definitions,
          'is_primary', v_company_cnaes.is_primary
        )
      );
      
      v_weighted_zscore := v_weighted_zscore || jsonb_build_object(
        v_sector_config.sector_key,
        jsonb_build_object(
          'weight', COALESCE(v_company_cnaes.percentage_activity, 100),
          'model', v_sector_config.zscore_model,
          'coefficients', v_sector_config.zscore_coefficients
        )
      );
      
      v_weighted_benchmarks := v_weighted_benchmarks || jsonb_build_object(
        v_sector_config.sector_key,
        jsonb_build_object(
          'weight', COALESCE(v_company_cnaes.percentage_activity, 100),
          'benchmarks', v_sector_config.benchmark_ranges
        )
      );
    END IF;
  END LOOP;
  
  v_result := jsonb_build_object(
    'company_id', p_company_id,
    'total_weight', v_total_weight,
    'sector_ratios', v_weighted_ratios,
    'sector_zscore', v_weighted_zscore,
    'sector_benchmarks', v_weighted_benchmarks,
    'generated_at', now()
  );
  
  RETURN v_result;
END;
$$;

-- Función para sincronización atómica cuando cambia CNAE
CREATE OR REPLACE FUNCTION sync_cnae_accounting_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sector_config RECORD;
BEGIN
  -- Buscar configuración sectorial para el nuevo CNAE
  SELECT * INTO v_sector_config
  FROM sector_chart_of_accounts sca
  WHERE NEW.cnae_code = ANY(sca.cnae_codes)
  LIMIT 1;
  
  IF v_sector_config IS NOT NULL THEN
    -- Sincronizar ratios sectoriales
    INSERT INTO sector_ratio_benchmarks (company_id, sector_key, ratios, benchmarks, source)
    VALUES (
      NEW.company_id, 
      v_sector_config.sector_key, 
      v_sector_config.ratio_definitions,
      v_sector_config.benchmark_ranges,
      'auto_sync'
    )
    ON CONFLICT (company_id, sector_key) 
    DO UPDATE SET 
      ratios = EXCLUDED.ratios,
      benchmarks = EXCLUDED.benchmarks,
      updated_at = now();
    
    -- Sincronizar coeficientes Z-Score
    INSERT INTO sector_zscore_coefficients (company_id, sector_key, model_type, coefficients, thresholds)
    VALUES (
      NEW.company_id,
      v_sector_config.sector_key,
      v_sector_config.zscore_model,
      v_sector_config.zscore_coefficients,
      v_sector_config.zscore_coefficients->'thresholds'
    )
    ON CONFLICT (company_id, sector_key)
    DO UPDATE SET
      model_type = EXCLUDED.model_type,
      coefficients = EXCLUDED.coefficients,
      thresholds = EXCLUDED.thresholds,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronización automática
DROP TRIGGER IF EXISTS trg_sync_cnae_accounting ON public.company_cnaes;
CREATE TRIGGER trg_sync_cnae_accounting
  AFTER INSERT OR UPDATE ON public.company_cnaes
  FOR EACH ROW EXECUTE FUNCTION sync_cnae_accounting_config();

-- Función de validación de integridad contable
CREATE OR REPLACE FUNCTION validate_accounting_sync(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cnae_count INTEGER;
  v_ratio_count INTEGER;
  v_zscore_count INTEGER;
  v_is_synced BOOLEAN;
  v_issues JSONB := '[]';
BEGIN
  -- Contar CNAEs de la empresa
  SELECT COUNT(*) INTO v_cnae_count
  FROM company_cnaes WHERE company_id = p_company_id;
  
  -- Contar configuraciones de ratios
  SELECT COUNT(*) INTO v_ratio_count
  FROM sector_ratio_benchmarks WHERE company_id = p_company_id;
  
  -- Contar configuraciones Z-Score
  SELECT COUNT(*) INTO v_zscore_count
  FROM sector_zscore_coefficients WHERE company_id = p_company_id;
  
  -- Verificar sincronización
  v_is_synced := (v_cnae_count > 0 AND v_ratio_count > 0 AND v_zscore_count > 0);
  
  IF v_cnae_count > 0 AND v_ratio_count = 0 THEN
    v_issues := v_issues || jsonb_build_array('missing_ratio_config');
  END IF;
  
  IF v_cnae_count > 0 AND v_zscore_count = 0 THEN
    v_issues := v_issues || jsonb_build_array('missing_zscore_config');
  END IF;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'is_synced', v_is_synced,
    'cnae_count', v_cnae_count,
    'ratio_configs', v_ratio_count,
    'zscore_configs', v_zscore_count,
    'issues', v_issues,
    'checked_at', now()
  );
END;
$$;

-- RLS para sector_chart_of_accounts
ALTER TABLE public.sector_chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sector charts"
ON public.sector_chart_of_accounts FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Authenticated users can view sector charts"
ON public.sector_chart_of_accounts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Datos semilla para sectores principales
INSERT INTO public.sector_chart_of_accounts (sector_key, sector_name, cnae_codes, account_structure, ratio_definitions, zscore_model, zscore_coefficients, benchmark_ranges, compliance_rules) VALUES
('manufacturing', 'Industria Manufacturera', ARRAY['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'],
  '{"groups": ["Inmovilizado", "Existencias", "Deudores", "Tesorería", "Patrimonio Neto", "Pasivo No Corriente", "Pasivo Corriente"], "critical_accounts": ["300", "400", "430", "572", "100", "170", "520"]}',
  '{"rotation_inventory": {"formula": "cost_of_sales / average_inventory", "weight": 1.2, "optimal_range": [4, 8]}, "production_efficiency": {"formula": "gross_profit / revenue", "weight": 1.0, "optimal_range": [0.25, 0.45]}, "asset_turnover": {"formula": "revenue / total_assets", "weight": 0.8, "optimal_range": [0.8, 1.5]}}',
  'altman_original',
  '{"a": 1.2, "b": 1.4, "c": 3.3, "d": 0.6, "e": 1.0, "thresholds": {"safe": 2.99, "grey_upper": 2.99, "grey_lower": 1.81, "distress": 1.81}}',
  '{"current_ratio": {"min": 1.2, "max": 2.0, "optimal": 1.5}, "quick_ratio": {"min": 0.8, "max": 1.5, "optimal": 1.0}, "debt_ratio": {"min": 0.3, "max": 0.6, "optimal": 0.45}}',
  '{"pgc_compliance": true, "inventory_valuation": "FIFO_or_weighted_average", "depreciation_methods": ["linear", "declining_balance"]}'
),
('services', 'Servicios Profesionales', ARRAY['62', '63', '69', '70', '71', '72', '73', '74', '78', '82'],
  '{"groups": ["Inmovilizado Intangible", "Deudores por Servicios", "Tesorería", "Patrimonio Neto", "Pasivo"], "critical_accounts": ["200", "430", "572", "100", "400"]}',
  '{"revenue_per_employee": {"formula": "revenue / employees", "weight": 1.5, "optimal_range": [80000, 150000]}, "operating_margin": {"formula": "operating_income / revenue", "weight": 1.2, "optimal_range": [0.15, 0.30]}, "receivables_days": {"formula": "(receivables / revenue) * 365", "weight": 1.0, "optimal_range": [30, 60]}}',
  'altman_services',
  '{"a": 6.56, "b": 3.26, "c": 6.72, "d": 1.05, "thresholds": {"safe": 2.60, "grey_upper": 2.60, "grey_lower": 1.10, "distress": 1.10}}',
  '{"current_ratio": {"min": 1.0, "max": 2.5, "optimal": 1.5}, "debt_to_equity": {"min": 0.5, "max": 2.0, "optimal": 1.0}, "profit_margin": {"min": 0.10, "max": 0.25, "optimal": 0.18}}',
  '{"pgc_compliance": true, "revenue_recognition": "completion_of_service", "intangible_amortization": "linear"}'
),
('retail', 'Comercio Minorista', ARRAY['47', '4711', '4719', '4721', '4722', '4723', '4724', '4725', '4726', '4729', '4751', '4752', '4753', '4754', '4759', '4761', '4762', '4763', '4764', '4765', '4771', '4772', '4773', '4774', '4775', '4776', '4777', '4778', '4779', '4781', '4782', '4789', '4791', '4799'],
  '{"groups": ["Local Comercial", "Existencias Comerciales", "Clientes", "Tesorería", "Patrimonio", "Proveedores"], "critical_accounts": ["211", "300", "430", "572", "100", "400"]}',
  '{"inventory_turnover": {"formula": "cost_of_goods_sold / average_inventory", "weight": 1.5, "optimal_range": [6, 12]}, "gross_margin": {"formula": "(revenue - cogs) / revenue", "weight": 1.2, "optimal_range": [0.25, 0.50]}, "sales_per_sqm": {"formula": "revenue / store_area", "weight": 1.0, "optimal_range": [3000, 8000]}}',
  'zmijewski',
  '{"a": -4.336, "b": -4.513, "c": 5.679, "d": 0.004, "thresholds": {"safe": 0.5, "grey_upper": 0.5, "grey_lower": 0.3, "distress": 0.3}}',
  '{"inventory_days": {"min": 30, "max": 90, "optimal": 45}, "payables_days": {"min": 30, "max": 60, "optimal": 45}, "current_ratio": {"min": 1.0, "max": 1.8, "optimal": 1.3}}',
  '{"pgc_compliance": true, "inventory_valuation": "retail_method_or_FIFO", "shrinkage_accounting": "periodic_adjustment"}'
),
('construction', 'Construcción', ARRAY['41', '4110', '4121', '4122', '42', '4211', '4212', '4213', '4221', '4222', '4291', '4299', '43', '4311', '4312', '4313', '4321', '4322', '4329', '4331', '4332', '4333', '4334', '4339', '4391', '4399'],
  '{"groups": ["Maquinaria", "Obra en Curso", "Clientes", "Tesorería", "Patrimonio", "Deuda Financiera", "Proveedores"], "critical_accounts": ["213", "330", "430", "572", "100", "170", "400"]}',
  '{"work_in_progress_ratio": {"formula": "wip / total_assets", "weight": 1.3, "optimal_range": [0.20, 0.40]}, "contract_backlog": {"formula": "backlog / annual_revenue", "weight": 1.2, "optimal_range": [1.0, 2.5]}, "equipment_utilization": {"formula": "revenue / equipment_value", "weight": 1.0, "optimal_range": [2.0, 4.0]}}',
  'altman_original',
  '{"a": 1.2, "b": 1.4, "c": 3.3, "d": 0.6, "e": 1.0, "thresholds": {"safe": 2.70, "grey_upper": 2.70, "grey_lower": 1.50, "distress": 1.50}}',
  '{"current_ratio": {"min": 1.1, "max": 1.8, "optimal": 1.4}, "debt_ratio": {"min": 0.4, "max": 0.7, "optimal": 0.55}, "interest_coverage": {"min": 2.0, "max": 5.0, "optimal": 3.0}}',
  '{"pgc_compliance": true, "revenue_recognition": "percentage_of_completion", "provision_for_warranties": "required"}'
),
('financial', 'Servicios Financieros', ARRAY['64', '6419', '6420', '6430', '6491', '6492', '6499', '65', '6511', '6512', '6520', '6530', '66', '6611', '6612', '6619', '6621', '6622', '6629', '6630'],
  '{"groups": ["Inversiones Financieras", "Cartera de Créditos", "Tesorería", "Patrimonio", "Depósitos", "Provisiones"], "critical_accounts": ["250", "252", "572", "100", "170", "140"]}',
  '{"capital_adequacy": {"formula": "tier1_capital / risk_weighted_assets", "weight": 2.0, "optimal_range": [0.10, 0.15]}, "non_performing_loans": {"formula": "npl / total_loans", "weight": 1.8, "optimal_range": [0.00, 0.05]}, "net_interest_margin": {"formula": "(interest_income - interest_expense) / earning_assets", "weight": 1.5, "optimal_range": [0.02, 0.04]}}',
  'altman_services',
  '{"a": 6.56, "b": 3.26, "c": 6.72, "d": 1.05, "thresholds": {"safe": 2.90, "grey_upper": 2.90, "grey_lower": 1.20, "distress": 1.20}}',
  '{"tier1_ratio": {"min": 0.08, "max": 0.15, "optimal": 0.12}, "liquidity_coverage": {"min": 1.0, "max": 1.5, "optimal": 1.2}, "leverage_ratio": {"min": 0.03, "max": 0.06, "optimal": 0.04}}',
  '{"basel_compliance": true, "ifrs9_staging": "required", "provision_methodology": "expected_credit_loss"}'
),
('hospitality', 'Hostelería y Turismo', ARRAY['55', '5510', '5520', '5530', '5590', '56', '5610', '5621', '5629', '5630', '79', '7911', '7912', '7990'],
  '{"groups": ["Inmuebles", "Existencias F&B", "Clientes", "Tesorería", "Patrimonio", "Deuda Hipotecaria", "Proveedores"], "critical_accounts": ["211", "300", "430", "572", "100", "170", "400"]}',
  '{"revpar": {"formula": "room_revenue / available_rooms", "weight": 1.5, "optimal_range": [50, 150]}, "occupancy_rate": {"formula": "rooms_sold / available_rooms", "weight": 1.3, "optimal_range": [0.60, 0.85]}, "food_cost_ratio": {"formula": "food_cost / food_revenue", "weight": 1.0, "optimal_range": [0.28, 0.35]}}',
  'altman_services',
  '{"a": 6.56, "b": 3.26, "c": 6.72, "d": 1.05, "thresholds": {"safe": 2.40, "grey_upper": 2.40, "grey_lower": 1.00, "distress": 1.00}}',
  '{"current_ratio": {"min": 0.8, "max": 1.5, "optimal": 1.1}, "debt_service_coverage": {"min": 1.2, "max": 2.0, "optimal": 1.5}, "operating_margin": {"min": 0.10, "max": 0.25, "optimal": 0.18}}',
  '{"pgc_compliance": true, "revenue_recognition": "on_service_delivery", "seasonal_adjustments": "required"}'
),
('healthcare', 'Sanidad', ARRAY['86', '8610', '8621', '8622', '8623', '8690', '87', '8710', '8720', '8730', '8790'],
  '{"groups": ["Equipamiento Médico", "Existencias Sanitarias", "Pacientes/Clientes", "Tesorería", "Patrimonio", "Financiación"], "critical_accounts": ["213", "300", "430", "572", "100", "170"]}',
  '{"revenue_per_bed": {"formula": "revenue / bed_count", "weight": 1.4, "optimal_range": [150000, 300000]}, "occupancy_rate": {"formula": "patient_days / available_bed_days", "weight": 1.2, "optimal_range": [0.75, 0.90]}, "supply_cost_ratio": {"formula": "medical_supplies / revenue", "weight": 1.0, "optimal_range": [0.15, 0.25]}}',
  'altman_services',
  '{"a": 6.56, "b": 3.26, "c": 6.72, "d": 1.05, "thresholds": {"safe": 2.50, "grey_upper": 2.50, "grey_lower": 1.10, "distress": 1.10}}',
  '{"current_ratio": {"min": 1.5, "max": 2.5, "optimal": 2.0}, "days_cash_on_hand": {"min": 60, "max": 180, "optimal": 120}, "debt_to_capital": {"min": 0.3, "max": 0.5, "optimal": 0.4}}',
  '{"pgc_compliance": true, "patient_revenue_recognition": "on_service_delivery", "bad_debt_provision": "aging_method"}'
),
('transport', 'Transporte y Logística', ARRAY['49', '4910', '4920', '4931', '4932', '4939', '4941', '4942', '50', '5010', '5020', '5030', '5040', '51', '5110', '5121', '5122', '52', '5210', '5221', '5222', '5223', '5224', '5229'],
  '{"groups": ["Flota/Vehículos", "Combustible", "Clientes", "Tesorería", "Patrimonio", "Leasing", "Proveedores"], "critical_accounts": ["218", "300", "430", "572", "100", "174", "400"]}',
  '{"revenue_per_vehicle": {"formula": "revenue / fleet_count", "weight": 1.3, "optimal_range": [80000, 150000]}, "fuel_efficiency": {"formula": "fuel_cost / km_travelled", "weight": 1.2, "optimal_range": [0.15, 0.30]}, "load_factor": {"formula": "actual_load / capacity", "weight": 1.0, "optimal_range": [0.70, 0.90]}}',
  'altman_original',
  '{"a": 1.2, "b": 1.4, "c": 3.3, "d": 0.6, "e": 1.0, "thresholds": {"safe": 2.60, "grey_upper": 2.60, "grey_lower": 1.50, "distress": 1.50}}',
  '{"current_ratio": {"min": 1.0, "max": 1.8, "optimal": 1.3}, "asset_turnover": {"min": 1.5, "max": 3.0, "optimal": 2.2}, "operating_margin": {"min": 0.05, "max": 0.12, "optimal": 0.08}}',
  '{"pgc_compliance": true, "fleet_depreciation": "usage_based_or_linear", "fuel_accounting": "fifo"}'
),
('real_estate', 'Inmobiliario', ARRAY['68', '6810', '6820', '6831', '6832'],
  '{"groups": ["Inversiones Inmobiliarias", "Obra en Curso", "Clientes", "Tesorería", "Patrimonio", "Hipotecas", "Anticipos"], "critical_accounts": ["220", "330", "430", "572", "100", "170", "438"]}',
  '{"gross_yield": {"formula": "rental_income / property_value", "weight": 1.5, "optimal_range": [0.04, 0.08]}, "occupancy_rate": {"formula": "occupied_units / total_units", "weight": 1.3, "optimal_range": [0.90, 0.98]}, "operating_expense_ratio": {"formula": "operating_expenses / gross_income", "weight": 1.0, "optimal_range": [0.30, 0.45]}}',
  'altman_services',
  '{"a": 6.56, "b": 3.26, "c": 6.72, "d": 1.05, "thresholds": {"safe": 2.30, "grey_upper": 2.30, "grey_lower": 0.90, "distress": 0.90}}',
  '{"loan_to_value": {"min": 0.50, "max": 0.75, "optimal": 0.65}, "debt_service_coverage": {"min": 1.2, "max": 2.0, "optimal": 1.5}, "cap_rate": {"min": 0.04, "max": 0.08, "optimal": 0.06}}',
  '{"pgc_compliance": true, "property_valuation": "fair_value_or_cost", "rental_recognition": "straight_line"}'
),
('agriculture', 'Agricultura y Ganadería', ARRAY['01', '0111', '0112', '0113', '0114', '0115', '0116', '0119', '0121', '0122', '0123', '0124', '0125', '0126', '0127', '0128', '0129', '0130', '0141', '0142', '0143', '0144', '0145', '0146', '0147', '0149', '0150', '0161', '0162', '0163', '0164', '0170'],
  '{"groups": ["Terrenos", "Activos Biológicos", "Existencias Agrícolas", "Tesorería", "Patrimonio", "Subvenciones", "Proveedores"], "critical_accounts": ["210", "206", "300", "572", "100", "130", "400"]}',
  '{"yield_per_hectare": {"formula": "production / cultivated_area", "weight": 1.4, "optimal_range": [3000, 8000]}, "cost_per_unit": {"formula": "total_costs / production_units", "weight": 1.2, "optimal_range": [0.10, 0.40]}, "subsidy_dependency": {"formula": "subsidies / revenue", "weight": 1.0, "optimal_range": [0.10, 0.30]}}',
  'altman_original',
  '{"a": 1.2, "b": 1.4, "c": 3.3, "d": 0.6, "e": 1.0, "thresholds": {"safe": 2.50, "grey_upper": 2.50, "grey_lower": 1.40, "distress": 1.40}}',
  '{"current_ratio": {"min": 1.0, "max": 2.0, "optimal": 1.4}, "debt_ratio": {"min": 0.3, "max": 0.6, "optimal": 0.45}, "asset_turnover": {"min": 0.3, "max": 0.8, "optimal": 0.5}}',
  '{"pgc_compliance": true, "biological_assets": "fair_value_less_costs_to_sell", "grant_recognition": "deferred_income"}'
)
ON CONFLICT (sector_key) DO UPDATE SET
  sector_name = EXCLUDED.sector_name,
  cnae_codes = EXCLUDED.cnae_codes,
  account_structure = EXCLUDED.account_structure,
  ratio_definitions = EXCLUDED.ratio_definitions,
  zscore_model = EXCLUDED.zscore_model,
  zscore_coefficients = EXCLUDED.zscore_coefficients,
  benchmark_ranges = EXCLUDED.benchmark_ranges,
  compliance_rules = EXCLUDED.compliance_rules,
  updated_at = now();
