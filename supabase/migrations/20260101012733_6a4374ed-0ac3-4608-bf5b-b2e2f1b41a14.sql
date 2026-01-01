-- Drop the actual audit trigger on erp_companies (the name is erp_companies_audit, not erp_audit_companies_trigger)
DROP TRIGGER IF EXISTS erp_companies_audit ON public.erp_companies;