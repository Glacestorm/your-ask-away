
-- Primero agregar España que falta
INSERT INTO erp_accounting_countries (country_code, country_name, accounting_standard, fiscal_year_start_month, currency_code, decimal_separator, date_format, is_active)
VALUES ('ES', 'España', 'PGC', 1, 'EUR', ',', 'DD/MM/YYYY', true)
ON CONFLICT (country_code) DO NOTHING;

-- =============================================
-- FASE 1: Datos de Normativas Contables por País
-- =============================================

-- Normativas de España (PGC)
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('ES', 'accounting_standard', 'Plan General de Contabilidad (PGC)', 'Marco contable obligatorio para empresas españolas', 
'# Plan General de Contabilidad (PGC)

## Estructura
1. **Marco Conceptual**: Principios contables, criterios de valoración
2. **Normas de Registro y Valoración**: 23 normas específicas
3. **Cuentas Anuales**: Balance, Cuenta de PyG, ECPN, EFE, Memoria
4. **Cuadro de Cuentas**: Grupos 1-9
5. **Definiciones y Relaciones Contables

## Principios Contables
- Empresa en funcionamiento
- Devengo
- Uniformidad
- Prudencia
- No compensación
- Importancia relativa

## Obligaciones de Depósito
- Plazo: 1 mes desde aprobación de cuentas
- Registro Mercantil correspondiente', 
'2008-01-01', 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-19884', ARRAY['PGC', 'contabilidad', 'España'], true),

('ES', 'tax', 'Impuesto sobre Sociedades', 'Normativa del IS en España', 
'# Impuesto sobre Sociedades

## Tipo General
- **25%** tipo general
- **23%** para entidades de nueva creación (primeros 2 años)
- **15%** empresas de reducida dimensión

## Pagos Fraccionados
- Abril, Octubre, Diciembre
- Modelo 202

## Declaración Anual
- Modelo 200
- Plazo: 25 días naturales siguientes a los 6 meses posteriores al cierre', 
'2024-01-01', 'https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328', ARRAY['IS', 'impuestos', 'España'], true),

('ES', 'vat', 'IVA - Impuesto sobre el Valor Añadido', 'Normativa del IVA en España', 
'# IVA en España

## Tipos Impositivos
- **21%** Tipo general
- **10%** Tipo reducido (alimentos, transporte, hostelería)
- **4%** Tipo superreducido (pan, leche, libros, medicamentos)
- **0%** Exento (sanidad, educación, seguros)

## Declaraciones
- **Modelo 303**: Autoliquidación trimestral/mensual
- **Modelo 390**: Resumen anual
- **Modelo 349**: Operaciones intracomunitarias

## Libros Registro
- Libro de facturas emitidas
- Libro de facturas recibidas
- Libro de bienes de inversión', 
'2024-01-01', 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740', ARRAY['IVA', 'impuestos', 'España'], true);

-- Normativas de Francia (PCG)
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('FR', 'accounting_standard', 'Plan Comptable Général (PCG)', 'Marco contable francés', 
'# Plan Comptable Général (PCG)

## Structure
1. Classe 1: Comptes de capitaux
2. Classe 2: Comptes immobilisations
3. Classe 3: Comptes de stocks
4. Classe 4: Comptes de tiers
5. Classe 5: Comptes financiers
6. Classe 6: Comptes de charges
7. Classe 7: Comptes de produits

## Principes Comptables
- Continuité exploitation
- Indépendance des exercices
- Coût historique
- Prudence
- Permanence des méthodes', 
'2019-01-01', 'https://www.anc.gouv.fr/normes-francaises/plan-comptable-general', ARRAY['PCG', 'comptabilité', 'France'], true),

('FR', 'tax', 'Impôt sur les Sociétés (IS)', 'Fiscalité des entreprises en France', 
'# Impôt sur les Sociétés

## Taux
- **25%** taux normal (2024)
- **15%** taux réduit PME (bénéfices < 42.500€)

## Acomptes
- 4 acomptes trimestriels
- 15 mars, 15 juin, 15 septembre, 15 décembre

## Déclaration
- Formulaire 2065
- Délai: 3 mois après clôture', 
'2024-01-01', 'https://www.impots.gouv.fr', ARRAY['IS', 'impôts', 'France'], true);

-- Normativas de Alemania (HGB/SKR)
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('DE', 'accounting_standard', 'Handelsgesetzbuch (HGB) und SKR', 'Marco contable alemán', 
'# Sistema Contable Alemán

## Standardkontenrahmen (SKR)
- **SKR 03**: Orientado a procesos (Industrie)
- **SKR 04**: Orientado a balance (Bilanz)

## Estructura SKR 03
- Klasse 0: Anlagevermögen
- Klasse 1: Umlaufvermögen
- Klasse 2: Eigenkapital, Rückstellungen
- Klasse 3: Verbindlichkeiten
- Klasse 4: Betriebliche Erträge
- Klasse 5-7: Betriebliche Aufwendungen

## GoB (Grundsätze ordnungsmäßiger Buchführung)
- Klarheit und Übersichtlichkeit
- Vollständigkeit
- Richtigkeit
- Zeitgerechte Buchung', 
'2024-01-01', 'https://www.gesetze-im-internet.de/hgb/', ARRAY['HGB', 'SKR', 'Buchhaltung', 'Deutschland'], true);

-- Normativas de Portugal (SNC)
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('PT', 'accounting_standard', 'Sistema de Normalização Contabilística (SNC)', 'Marco contable portugués', 
'# Sistema de Normalização Contabilística (SNC)

## Estrutura
1. Classe 1: Meios financeiros líquidos
2. Classe 2: Contas a receber e a pagar
3. Classe 3: Inventários e ativos biológicos
4. Classe 4: Investimentos
5. Classe 5: Capital, reservas e resultados
6. Classe 6: Gastos
7. Classe 7: Rendimentos
8. Classe 8: Resultados

## NCRF (Normas Contabilísticas)
- 28 normas baseadas em IFRS
- Adaptadas à realidade portuguesa', 
'2016-01-01', 'http://www.cnc.min-financas.pt', ARRAY['SNC', 'contabilidade', 'Portugal'], true);

-- Normativas de Italia
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('IT', 'accounting_standard', 'Piano dei Conti Italiano', 'Marco contable italiano', 
'# Piano dei Conti Italiano

## Struttura
- Classe A: Crediti verso soci
- Classe B: Immobilizzazioni
- Classe C: Attivo circolante
- Classe D: Ratei e risconti
- Passivo: Patrimonio, Fondi, TFR, Debiti
- Conto Economico: A) Valore produzione, B) Costi

## Principi Contabili OIC
- 34 principi contabili nazionali
- Emanati dall Organismo Italiano di Contabilità', 
'2024-01-01', 'https://www.fondazioneoic.eu', ARRAY['OIC', 'contabilità', 'Italia'], true);

-- Normativas de Reino Unido
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('GB', 'accounting_standard', 'UK GAAP (FRS 102)', 'Marco contable británico', 
'# UK GAAP - FRS 102

## Financial Reporting Standards
- FRS 100: Application of Financial Reporting Requirements
- FRS 101: Reduced Disclosure Framework
- FRS 102: The Financial Reporting Standard (main standard)
- FRS 103: Insurance Contracts
- FRS 104: Interim Financial Reporting
- FRS 105: Micro-entities

## Key Sections FRS 102
- Section 1-3: Scope and concepts
- Section 4-8: Financial statements
- Section 9-15: Assets
- Section 16-22: Liabilities and equity', 
'2024-01-01', 'https://www.frc.org.uk', ARRAY['FRS102', 'UKGAAP', 'accounting', 'UK'], true);

-- Normativas de Estados Unidos
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('US', 'accounting_standard', 'US GAAP (ASC)', 'Marco contable estadounidense', 
'# US GAAP - Accounting Standards Codification

## ASC Topics
- ASC 200-299: Presentation
- ASC 300-399: Assets
- ASC 400-499: Liabilities
- ASC 500-599: Equity
- ASC 600-699: Revenue
- ASC 700-799: Expenses
- ASC 800-899: Broad Transactions
- ASC 900-999: Industry-Specific

## SEC Requirements (Public Companies)
- Form 10-K (Annual Report)
- Form 10-Q (Quarterly Report)
- Form 8-K (Current Report)', 
'2024-01-01', 'https://asc.fasb.org', ARRAY['USGAAP', 'ASC', 'FASB', 'accounting', 'USA'], true);

-- Normativas de México
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('MX', 'accounting_standard', 'Normas de Información Financiera (NIF)', 'Marco contable mexicano', 
'# Normas de Información Financiera (NIF)

## Estructura
- Serie A: Marco Conceptual
- Serie B: Normas aplicables a estados financieros
- Serie C: Normas aplicables a conceptos específicos
- Serie D: Normas aplicables a problemas de determinación
- Serie E: Normas aplicables a actividades especializadas

## Catálogo de Cuentas SAT
- Código Agrupador del SAT
- Obligatorio para contabilidad electrónica

## CFDI (Facturación Electrónica)
- Comprobante Fiscal Digital por Internet
- Timbrado obligatorio por PAC autorizado', 
'2024-01-01', 'https://www.cinif.org.mx', ARRAY['NIF', 'CINIF', 'contabilidad', 'México'], true);

-- Normativas de Andorra
INSERT INTO erp_accounting_regulations (country_code, regulation_type, title, description, content_markdown, effective_date, source_url, tags, is_active) VALUES
('AD', 'accounting_standard', 'Pla General de Comptabilitat Andorra', 'Marco contable andorrano', 
'# Pla General de Comptabilitat Andorra

## Estructura
Basat en el PGC espanyol amb adaptacions locals

## Grups de Comptes
1. Grup 1: Finançament bàsic
2. Grup 2: Immobilitzat
3. Grup 3: Existències
4. Grup 4: Creditors i deutors
5. Grup 5: Comptes financers
6. Grup 6: Compres i despeses
7. Grup 7: Vendes i ingressos

## Obligacions
- Comptes anuals: Balanç, Compte de resultats, Memòria
- Dipòsit al Registre de Societats', 
'2020-01-01', 'https://www.govern.ad', ARRAY['PGC', 'comptabilitat', 'Andorra'], true),

('AD', 'tax', 'Impost sobre Societats (IS) Andorra', 'Fiscalitat empresarial a Andorra', 
'# Impost sobre Societats Andorra

## Tipus Impositiu
- 10% tipus general (un dels més baixos Europa)
- 2% règim especial de gestió i tinença internacional

## Pagaments a Compte
- 2 pagaments a compte anuals

## Declaració
- Model 800
- Termini: 6 mesos des del tancament de lexercici

## Avantatges Fiscals
- No hi ha retencions sobre dividends
- Acords de doble imposició', 
'2024-01-01', 'https://www.impostos.ad', ARRAY['IS', 'impostos', 'Andorra'], true);

-- =============================================
-- FASE 2: Triggers y Funciones de Negocio
-- =============================================

-- Función para validar cuadre de asientos
CREATE OR REPLACE FUNCTION erp_validate_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debit NUMERIC;
    v_total_credit NUMERIC;
    v_entry_id UUID;
BEGIN
    -- Determinar entry_id según operación
    IF TG_OP = 'DELETE' THEN
        v_entry_id := OLD.entry_id;
    ELSE
        v_entry_id := NEW.entry_id;
    END IF;
    
    -- Calcular totales
    SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
    INTO v_total_debit, v_total_credit
    FROM erp_journal_entry_lines
    WHERE entry_id = v_entry_id;
    
    -- Actualizar totales en el asiento
    UPDATE erp_journal_entries 
    SET total_debit = v_total_debit, 
        total_credit = v_total_credit,
        updated_at = NOW()
    WHERE id = v_entry_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar cuadre al insertar/actualizar líneas
DROP TRIGGER IF EXISTS trg_validate_entry_balance ON erp_journal_entry_lines;
CREATE TRIGGER trg_validate_entry_balance
    AFTER INSERT OR UPDATE OR DELETE ON erp_journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION erp_validate_journal_entry_balance();

-- Función para bloquear posting en periodos cerrados
CREATE OR REPLACE FUNCTION erp_check_period_open()
RETURNS TRIGGER AS $$
DECLARE
    v_period_closed BOOLEAN;
BEGIN
    -- Si no hay period_id, permitir
    IF NEW.period_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Verificar si el periodo está cerrado
    SELECT is_closed INTO v_period_closed
    FROM erp_periods
    WHERE id = NEW.period_id;
    
    IF v_period_closed = true THEN
        RAISE EXCEPTION 'No se pueden crear/modificar asientos en un periodo cerrado';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para bloquear en periodos cerrados
DROP TRIGGER IF EXISTS trg_check_period_open ON erp_journal_entries;
CREATE TRIGGER trg_check_period_open
    BEFORE INSERT OR UPDATE ON erp_journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION erp_check_period_open();

-- Función para generar número secuencial de asiento
CREATE OR REPLACE FUNCTION erp_generate_entry_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number INTEGER;
    v_journal_code TEXT;
    v_year TEXT;
BEGIN
    -- Si ya tiene número, no generar
    IF NEW.entry_number IS NOT NULL AND NEW.entry_number != '' THEN
        RETURN NEW;
    END IF;
    
    -- Obtener código del diario
    SELECT code INTO v_journal_code
    FROM erp_journals
    WHERE id = NEW.journal_id;
    
    IF v_journal_code IS NULL THEN
        v_journal_code := 'GEN';
    END IF;
    
    -- Obtener año
    v_year := EXTRACT(YEAR FROM COALESCE(NEW.entry_date, CURRENT_DATE))::TEXT;
    
    -- Obtener siguiente número para este diario y año
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ ('^' || v_journal_code || '/' || v_year || '/[0-9]+$')
            THEN CAST(SPLIT_PART(entry_number, '/', 3) AS INTEGER)
            ELSE 0 
        END
    ), 0) + 1
    INTO v_next_number
    FROM erp_journal_entries
    WHERE journal_id = NEW.journal_id
    AND EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM COALESCE(NEW.entry_date, CURRENT_DATE));
    
    -- Generar número: DIARIO/AÑO/SECUENCIA
    NEW.entry_number := v_journal_code || '/' || v_year || '/' || LPAD(v_next_number::TEXT, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-numerar asientos
DROP TRIGGER IF EXISTS trg_generate_entry_number ON erp_journal_entries;
CREATE TRIGGER trg_generate_entry_number
    BEFORE INSERT ON erp_journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION erp_generate_entry_number();
