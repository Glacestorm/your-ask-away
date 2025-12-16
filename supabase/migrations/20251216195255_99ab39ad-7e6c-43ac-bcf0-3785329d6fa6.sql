
-- Crear triggers con nombres correctos de funciones

-- Trigger para notificar nuevas normativas oficiales
CREATE OR REPLACE TRIGGER trigger_notify_new_official_regulation
    AFTER INSERT ON organization_compliance_documents
    FOR EACH ROW
    WHEN (NEW.document_type = 'official_regulation')
    EXECUTE FUNCTION notify_new_official_regulation_fn();

-- Trigger para notificar nuevos documentos internos
CREATE OR REPLACE TRIGGER trigger_notify_new_internal_document
    AFTER INSERT ON organization_compliance_documents
    FOR EACH ROW
    WHEN (NEW.document_type = 'internal_policy' OR NEW.document_type = 'procedure')
    EXECUTE FUNCTION notify_new_internal_document_fn();

-- Trigger para notificar no conformidades
CREATE OR REPLACE TRIGGER trigger_notify_compliance_non_conformity
    AFTER UPDATE ON compliance_requirements
    FOR EACH ROW
    WHEN (NEW.status = 'non_compliant' AND OLD.status IS DISTINCT FROM 'non_compliant')
    EXECUTE FUNCTION notify_compliance_non_conformity_fn();

-- Trigger para activación automática de compliance en módulos
CREATE OR REPLACE TRIGGER auto_activate_compliance_on_module_install
    AFTER INSERT ON installed_modules
    FOR EACH ROW
    EXECUTE FUNCTION activate_compliance_on_module_install();
