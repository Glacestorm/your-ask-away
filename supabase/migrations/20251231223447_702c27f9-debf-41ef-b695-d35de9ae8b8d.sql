-- Crear triggers de auditoría para las tablas ERP

-- Trigger para erp_companies
DROP TRIGGER IF EXISTS erp_companies_audit_trigger ON erp_companies;
CREATE TRIGGER erp_companies_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON erp_companies
  FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();

-- Trigger para erp_roles  
DROP TRIGGER IF EXISTS erp_roles_audit_trigger ON erp_roles;
CREATE TRIGGER erp_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON erp_roles
  FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();

-- Trigger para erp_series
DROP TRIGGER IF EXISTS erp_series_audit_trigger ON erp_series;
CREATE TRIGGER erp_series_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON erp_series
  FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();

-- Trigger para erp_fiscal_years
DROP TRIGGER IF EXISTS erp_fiscal_years_audit_trigger ON erp_fiscal_years;
CREATE TRIGGER erp_fiscal_years_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON erp_fiscal_years
  FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();

-- Trigger para erp_user_companies
DROP TRIGGER IF EXISTS erp_user_companies_audit_trigger ON erp_user_companies;
CREATE TRIGGER erp_user_companies_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON erp_user_companies
  FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();