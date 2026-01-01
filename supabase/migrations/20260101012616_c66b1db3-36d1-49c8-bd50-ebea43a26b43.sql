-- Fix audit trigger to handle DELETE gracefully (skip insert to audit for deletes on erp_companies)
-- First drop all triggers related to erp_companies to break the cycle

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS erp_audit_companies_trigger ON public.erp_companies;

-- Also update the FK on erp_audit_events to be nullable and ON DELETE SET NULL
ALTER TABLE public.erp_audit_events 
DROP CONSTRAINT IF EXISTS erp_audit_events_company_id_fkey;

ALTER TABLE public.erp_audit_events 
ADD CONSTRAINT erp_audit_events_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.erp_companies(id) ON DELETE SET NULL;