
-- Crear triggers usando funciones sin sufijo _fn
DROP TRIGGER IF EXISTS trigger_notify_new_official_regulation ON public.organization_compliance_documents;
DROP TRIGGER IF EXISTS trigger_notify_new_internal_document ON public.organization_compliance_documents;
DROP TRIGGER IF EXISTS trigger_notify_compliance_non_conformity ON public.compliance_requirements;
DROP TRIGGER IF EXISTS auto_activate_compliance_on_module_install ON public.installed_modules;

-- Usar funciones originales (sin _fn)
CREATE TRIGGER trigger_notify_new_official_regulation
    AFTER INSERT ON public.organization_compliance_documents
    FOR EACH ROW
    WHEN (NEW.document_type = 'official_regulation')
    EXECUTE FUNCTION public.notify_new_official_regulation();

CREATE TRIGGER trigger_notify_new_internal_document
    AFTER INSERT ON public.organization_compliance_documents
    FOR EACH ROW
    WHEN (NEW.document_type IN ('internal_policy', 'procedure'))
    EXECUTE FUNCTION public.notify_new_internal_document();

CREATE TRIGGER trigger_notify_compliance_non_conformity
    AFTER UPDATE ON public.compliance_requirements
    FOR EACH ROW
    WHEN (NEW.status = 'non_compliant' AND (OLD.status IS NULL OR OLD.status <> 'non_compliant'))
    EXECUTE FUNCTION public.notify_compliance_issue();

CREATE TRIGGER auto_activate_compliance_on_module_install
    AFTER INSERT ON public.installed_modules
    FOR EACH ROW
    EXECUTE FUNCTION public.activate_compliance_on_module_install();
