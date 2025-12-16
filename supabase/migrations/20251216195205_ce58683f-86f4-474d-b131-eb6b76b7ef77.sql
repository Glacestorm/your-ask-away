
-- FASE 5 y 7: Crear triggers faltantes

-- Trigger para notificar nuevas normativas oficiales
DROP TRIGGER IF EXISTS trigger_notify_new_official_regulation ON organization_compliance_documents;
CREATE TRIGGER trigger_notify_new_official_regulation
    AFTER INSERT ON organization_compliance_documents
    FOR EACH ROW
    WHEN (NEW.document_type = 'official_regulation')
    EXECUTE FUNCTION notify_new_official_regulation();

-- Trigger para notificar nuevos documentos internos
DROP TRIGGER IF EXISTS trigger_notify_new_internal_document ON organization_compliance_documents;
CREATE TRIGGER trigger_notify_new_internal_document
    AFTER INSERT ON organization_compliance_documents
    FOR EACH ROW
    WHEN (NEW.document_type = 'internal_policy' OR NEW.document_type = 'procedure')
    EXECUTE FUNCTION notify_new_internal_document();

-- Trigger para notificar no conformidades
DROP TRIGGER IF EXISTS trigger_notify_compliance_non_conformity ON compliance_requirements;
CREATE TRIGGER trigger_notify_compliance_non_conformity
    AFTER UPDATE ON compliance_requirements
    FOR EACH ROW
    WHEN (NEW.status = 'non_compliant' AND OLD.status IS DISTINCT FROM 'non_compliant')
    EXECUTE FUNCTION notify_compliance_non_conformity_fn();

-- FASE 7: Trigger para activación automática de compliance en módulos
DROP TRIGGER IF EXISTS auto_activate_compliance_on_module_install ON installed_modules;
CREATE TRIGGER auto_activate_compliance_on_module_install
    AFTER INSERT ON installed_modules
    FOR EACH ROW
    EXECUTE FUNCTION activate_compliance_on_module_install();
