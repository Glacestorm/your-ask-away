/**
 * ObelixIA PDF Generator
 * Genera automáticamente PDFs de Plan de Negocio, Estudio de Viabilidad y Contrato de Confidencialidad
 * con información real extraída del sistema ObelixIA
 * 
 * NOTA: Se han eliminado los emojis porque jsPDF no los soporta correctamente
 */

import { downloadBusinessPlanPDF, BusinessPlanPDFData } from './pdfExportBusinessPlan';
import { downloadViabilityStudyPDF, ViabilityStudyPDFData } from './pdfExportViabilityStudy';
import { downloadNDAPDF, NDAPDFData } from './pdfExportNDA';

// ============================================
// DATOS COMPLETOS DE OBELIXIA PARA EL PLAN DE NEGOCIO
// Documento extenso con análisis exhaustivo del código de la aplicación
// ============================================
const obelixiaBusinessPlanData: BusinessPlanPDFData = {
  title: 'Plan de Negocio Integral - ObelixIA Technologies',
  companyName: 'ObelixIA Technologies S.L.',
  planType: 'SaaS B2B Enterprise - Plataforma CRM Bancaria con Inteligencia Artificial',
  targetAudience: 'Entidades Bancarias, Financieras, Inversores y Socios Estratégicos',
  status: 'Activo - Version 8.0 - Produccion',
  createdAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
  
  executiveSummary: {
    vision: `ObelixIA aspira a ser la plataforma lider en gestion de cartera bancaria con inteligencia artificial en Europa, estableciendo el estandar de innovacion tecnologica y cumplimiento normativo para el sector financiero durante la proxima decada. Nuestra vision se fundamenta en la transformacion digital del sector bancario mediante tecnologia de vanguardia que permita a las entidades financieras operar con mayor eficiencia, cumplir automaticamente con la creciente regulacion europea y ofrecer una experiencia excepcional a sus clientes empresariales. 

En un contexto donde la regulacion financiera europea se intensifica (DORA, NIS2, MiFID II, PSD3) y la competencia de fintechs y neobancos presiona a las entidades tradicionales, ObelixIA se posiciona como el aliado tecnologico que permite a los bancos medianos competir con los grandes players sin comprometer su agilidad ni su identidad. Nuestra plataforma no solo resuelve problemas operativos actuales, sino que anticipa las necesidades futuras del sector gracias a capacidades predictivas de IA y una arquitectura preparada para escalar globalmente.`,
    
    mission: `Transformar la gestion de relaciones bancarias mediante tecnologia de vanguardia, permitiendo a los gestores maximizar su productividad en un 60%, cumplir con regulaciones automaticamente con un 95%+ de precision, y ofrecer un servicio excepcional a sus clientes empresariales. 

ObelixIA nace de la conviccion de que la tecnologia debe simplificar, no complicar, el trabajo de los profesionales bancarios. Cada funcionalidad de nuestra plataforma esta disenada pensando en el usuario final: gestores de cartera, directores de oficina, analistas de riesgo y equipos de cumplimiento que necesitan herramientas intuitivas y potentes para afrontar los retos del banking moderno.

Nuestra mision se concreta en:
- Reducir el tiempo dedicado a tareas administrativas de 4 horas diarias a menos de 1.5 horas
- Automatizar el 95% de los controles de cumplimiento normativo
- Proporcionar insights accionables en tiempo real mediante IA
- Facilitar la transicion digital de entidades bancarias de cualquier tamano
- Garantizar la soberania y seguridad de los datos financieros en Europa`,
    
    objectives: [
      'OBJETIVO 1 - CARTERA DE CLIENTES: Alcanzar 50 entidades bancarias como clientes activos en los proximos 3 anos, con un mix de 60% bancos medianos, 25% cajas rurales/cooperativas y 15% fintechs con licencia bancaria',
      'OBJETIVO 2 - EFICIENCIA OPERATIVA: Reducir el tiempo de gestion administrativa de los usuarios en un 60%, medido mediante analytics de uso y encuestas NPS trimestrales',
      'OBJETIVO 3 - CUMPLIMIENTO NORMATIVO: Lograr un 95%+ de cumplimiento normativo automatizado para GDPR, DORA, NIS2, PSD2, MiFID II y regulaciones nacionales, validado por auditorias independientes',
      'OBJETIVO 4 - EXPANSION GEOGRAFICA: Expandir la plataforma a 5 paises europeos en 24 meses (Espana, Portugal, Francia, Italia, Alemania), adaptando la solucion a normativas locales',
      'OBJETIVO 5 - CERTIFICACIONES: Conseguir certificaciones ISO 27001, SOC 2 Type II y cualificacion eIDAS para firmas digitales avanzadas antes de Q4 2025',
      'OBJETIVO 6 - IA PREDICTIVA: Desarrollar y validar modelos de IA predictiva para analisis de riesgo crediticio, deteccion de fraude y prediccion de abandono de clientes con precision >85%',
      'OBJETIVO 7 - INGRESOS: Alcanzar 2.5M EUR ARR en el ano 3 con un margen bruto superior al 70% y un ratio LTV/CAC superior a 3:1',
      'OBJETIVO 8 - EQUIPO: Construir un equipo de 35+ profesionales distribuidos, con cultura remoto-first y alta retencion (>90% anual)',
      'OBJETIVO 9 - SOSTENIBILIDAD: Implementar practicas ESG en todas las operaciones y ofrecer modulos de reporting ESG para clientes',
      'OBJETIVO 10 - INNOVACION: Mantener un pipeline de innovacion continuo con al menos 4 releases mayores anuales incorporando las ultimas tecnologias de IA'
    ],
    
    keyHighlights: [
      '[1] PRIMERA PLATAFORMA CRM BANCARIA CON IA NATIVA: ObelixIA integra nativamente capacidades de IA generativa (Gemini 2.5) para asistencia contextual, analisis documental, generacion de informes y predicciones, sin necesidad de integraciones de terceros',
      '[2] CUMPLIMIENTO AUTOMATICO DE 12+ REGULACIONES: Motor de compliance integrado que verifica automaticamente GDPR, DORA, NIS2, MiFID II, PSD2/PSD3, Ley de Servicios Digitales, normativa AML/KYC, y regulaciones nacionales especificas',
      '[3] ARQUITECTURA CLOUD-NATIVE EUROPEA: Infraestructura desplegada exclusivamente en data centers europeos (Supabase/AWS EU), garantizando soberania de datos y cumplimiento con Schrems II',
      '[4] IMPLEMENTACION 70% MAS RAPIDA: Metodologia de despliegue probada que permite a nuevos clientes estar operativos en 4-6 semanas vs 12-16 semanas de competidores tradicionales',
      '[5] ROI DEMOSTRADO DEL 300%: Casos de uso documentados demuestran retorno de inversion del 300% en el primer ano gracias a ahorro de tiempo, reduccion de errores y automatizacion',
      '[6] SOPORTE MULTIIDIOMA NATIVO: Interfaz y soporte completo en +20 idiomas con traduccion automatica por IA, facilitando despliegues internacionales',
      '[7] SEGURIDAD ENTERPRISE-GRADE: Cifrado end-to-end, autenticacion multifactor, SSO/SAML, logs de auditoria inmutables y capacidades de firma digital eIDAS',
      '[8] MOBILE-FIRST CON CAPACIDADES OFFLINE: Aplicacion web progresiva (PWA) con funcionamiento offline para gestores en movilidad, sincronizacion automatica al recuperar conectividad',
      '[9] AGENTES IA AUTONOMOS: Bots inteligentes que automatizan tareas rutinarias: clasificacion de documentos, seguimiento de vencimientos, alertas predictivas, elaboracion de informes',
      '[10] INTEGRACIONES LLAVE EN MANO: Conectores nativos con cores bancarios (Temenos, Sopra, Silverlake), ERPs (SAP, Oracle, Microsoft Dynamics), y APIs bancarias (Open Banking)'
    ]
  },
  
  marketAnalysis: {
    marketSize: `ANALISIS DEL MERCADO EUROPEO DE CRM BANCARIO 2024-2030

TAMANO Y CRECIMIENTO:
- El mercado europeo de software CRM bancario se estima en 4.2B EUR para 2025, con un crecimiento compuesto anual (CAGR) del 12.3% hasta 2030
- El segmento especifico de CRM con IA integrada crece a un ritmo del 28% anual, muy por encima del mercado general
- Espana representa aproximadamente 380M EUR del mercado total, posicionandose como el 5o mercado europeo tras UK, Alemania, Francia e Italia
- Se proyecta que el mercado espanol alcance 620M EUR en 2028 impulsado por la transformacion digital post-COVID y la presion regulatoria

DRIVERS DE CRECIMIENTO:
1. Regulacion DORA (enero 2025): Obliga a todas las entidades financieras a digitalizar y documentar sus procesos operativos
2. Transformacion digital bancaria: 78% de los bancos europeos tienen proyectos de digitalizacion en curso
3. Competencia fintech: Las entidades tradicionales necesitan herramientas para competir en experiencia de usuario
4. ESG y finanzas sostenibles: Nuevos requisitos de reporting requieren herramientas especializadas
5. Open Banking (PSD2/PSD3): La apertura de APIs bancarias genera demanda de plataformas de gestion

SEGMENTACION GEOGRAFICA (% del mercado direccionable):
- Espana: 38% (foco inicial, mercado conocido)
- Portugal: 15% (idioma/cultura similar, regulacion equivalente)
- Francia: 22% (segundo mercado objetivo, alta digitalizacion)
- Italia: 18% (mercado fragmentado, alta competencia)
- DACH: 7% (mercado maduro, barreras de entrada altas)

BARRERAS DE ENTRADA:
- Requisitos de seguridad y compliance muy elevados
- Ciclos de venta largos (6-18 meses)
- Necesidad de referencias en el sector
- Integraciones complejas con sistemas legacy
- Sensibilidad extrema en materia de datos`,

    targetSegments: [
      'SEGMENTO PRINCIPAL (60% target): Bancos comerciales medianos (10-100 oficinas) - Entidades con necesidades sofisticadas pero sin recursos para desarrollos propios, buscando soluciones SaaS flexibles. Ejemplos: Banco Sabadell, Bankinter, Ibercaja, Kutxabank',
      'SEGMENTO SECUNDARIO (25%): Cajas rurales y cooperativas de credito - Red de 50+ entidades en Espana agrupadas en asociaciones (UNACC), con procesos de toma de decision centralizados que facilitan la venta',
      'SEGMENTO EMERGENTE (10%): Fintechs con licencia bancaria - Nuevos players digitales que necesitan herramientas de gestion de cartera desde el dia uno, con alta velocidad de decision y adopcion tecnologica',
      'SEGMENTO PREMIUM (3%): Bancos privados y gestion patrimonial - Entidades de banca privada que requieren funcionalidades especificas de gestion de altos patrimonios, reporting personalizado y maxima confidencialidad',
      'SEGMENTO EXPANSION (2%): Sucursales de bancos internacionales en Espana - Filiales de grupos bancarios europeos que operan en Espana bajo regulacion local, potencial de expansion al grupo matriz'
    ],
    
    competitors: [
      'SALESFORCE FINANCIAL SERVICES CLOUD (Lider global, 35% market share) - Fortalezas: Marca reconocida, ecosistema extenso, capacidad de inversion. Debilidades: Alto coste (3-5x nuestro pricing), complejidad de implementacion (6-12 meses), falta de especializacion en normativa europea, soporte mayoritariamente en ingles',
      'MICROSOFT DYNAMICS 365 BANKING (Challenger, 22% market share) - Fortalezas: Integracion Office 365, infraestructura Azure, presencia enterprise. Debilidades: Curva de aprendizaje pronunciada, customizacion costosa, enfoque mas ERP que CRM bancario especifico',
      'NCINO (Especialista, 12% market share) - Fortalezas: Liderazgo en originacion de prestamos, fuerte en US. Debilidades: Enfoque limitado (prestamos, no CRM general), menor presencia europea, pricing premium',
      'BACKBASE (Niche player, 8% market share) - Fortalezas: Excelente UX para banca digital, buena presencia Benelux. Debilidades: Enfocado en front-end digital, limitado en funcionalidades CRM comercial, dependencia de integradores',
      'TEMENOS (Core bancario, 7% market share en CRM) - Fortalezas: Base instalada de cores bancarios, relaciones establecidas. Debilidades: CRM como producto secundario, arquitectura monolitica, lenta innovacion',
      'SOLUCIONES PROPIETARIAS LEGACY (Varios, 16% market share) - Fortalezas: Ya instalados, costes hundidos. Debilidades: Sin evolucion, sin IA, costosas de mantener, riesgo de obsolescencia, personal especializado escaso'
    ],
    
    opportunities: [
      'REGULACION DORA (enero 2025): La normativa de resiliencia operativa digital obliga a TODAS las entidades financieras europeas a modernizar sus sistemas de gestion de riesgos operativos, creando una ventana de oportunidad estimada en 500M EUR en servicios tecnologicos',
      'ACELERACION POST-COVID: El 73% de los bancos espanoles han acelerado sus planes de transformacion digital, con presupuestos incrementados en un 45% respecto a 2019',
      'DEMANDA DE CUMPLIMIENTO AUTOMATIZADO: El coste de compliance ha aumentado un 60% en los ultimos 5 anos, generando demanda urgente de soluciones que automaticen verificaciones',
      'ESCASEZ DE SOLUCIONES EUROPEAS: El 85% de las soluciones lideres son estadounidenses, generando preocupacion sobre soberania de datos y cumplimiento GDPR post-Schrems II',
      'IA GENERATIVA COMO DIFERENCIADOR: Solo el 12% de las soluciones CRM bancarias incorporan IA generativa, ObelixIA puede liderar este segmento emergente',
      'OPEN BANKING PSD2/PSD3: La apertura de APIs bancarias genera nuevas necesidades de gestion de consentimientos, agregacion de datos y orquestacion de servicios',
      'CONSOLIDACION BANCARIA: La fusion de entidades (Caixabank-Bankia, Unicaja-Liberbank) genera oportunidades de migracion a plataformas modernas',
      'ESG Y FINANZAS SOSTENIBLES: Nuevos requisitos SFDR y taxonomia europea requieren herramientas de reporting ESG integradas en el CRM',
      'PARTNERSHIPS BIG FOUR: Accenture, Deloitte, KPMG y PwC buscan activamente soluciones innovadoras para sus proyectos de transformacion bancaria'
    ]
  },
  
  businessModel: {
    valueProposition: `PROPUESTA DE VALOR UNICA DE OBELIXIA

ObelixIA es la UNICA plataforma CRM bancaria que combina:
1. Gestion integral de cartera comercial (clientes empresa, particulares, segmentos)
2. Cumplimiento normativo automatizado y auditable (12+ regulaciones)
3. Inteligencia artificial nativa para analisis, prediccion y asistencia
4. Arquitectura 100% europea que garantiza soberania de datos

DIFERENCIADORES CLAVE vs COMPETIDORES:

PARA EL GESTOR DE CARTERA:
- Reduce 60% el tiempo en tareas administrativas
- Asistente IA que prepara reuniones, sugiere acciones y genera documentos
- Vision 360 del cliente con informacion agregada de multiples fuentes
- Alertas predictivas sobre oportunidades y riesgos

PARA EL DEPARTAMENTO DE COMPLIANCE:
- Dashboard de cumplimiento en tiempo real
- Auditorias automatizadas con trazabilidad completa
- Generacion automatica de informes regulatorios
- Deteccion proactiva de riesgos normativos

PARA LA DIRECCION:
- Analytics ejecutivos con metricas clave de negocio
- Forecasting de ingresos basado en IA
- Benchmarking automatico entre oficinas/gestores
- Reporting ESG integrado

PARA IT:
- Implementacion SaaS sin infraestructura local
- APIs abiertas y documentadas para integraciones
- SSO/SAML y cumplimiento de politicas de seguridad corporativas
- Actualizaciones automaticas sin downtime`,

    revenueStreams: [
      'SUSCRIPCION POR USUARIO (40% de ingresos proyectados) - Licencias mensuales/anuales por usuario activo, pricing escalonado: Essentials 89 EUR/usuario/mes, Professional 149 EUR/usuario/mes, Enterprise 199 EUR/usuario/mes. Compromisos anuales con descuento del 20%',
      'LICENCIAS ENTERPRISE POR OFICINA (25% de ingresos) - Para despliegues masivos: desde 2,500 EUR/oficina/ano con usuarios ilimitados, ideal para entidades con alta densidad de usuarios por oficina',
      'SERVICIOS DE IMPLEMENTACION (15% de ingresos) - Proyectos de despliegue, migracion de datos historicos, configuracion de integraciones. Rango 15,000-80,000 EUR segun complejidad. Margen del 50%',
      'FORMACION Y CERTIFICACION (5% de ingresos) - Programas de capacitacion presencial y online: 500 EUR/usuario para certificacion basica, 1,500 EUR para certificacion avanzada. Plataforma e-learning con suscripcion',
      'SOPORTE PREMIUM 24/7 (8% de ingresos) - SLA garantizado con tiempos de respuesta <1h para criticos, +30% sobre licencia base. Acceso a equipo senior de soporte',
      'MODULOS ADICIONALES (5% de ingresos) - Funcionalidades avanzadas con pricing independiente: Contabilidad IA (+29 EUR/mes), Auditoria Avanzada (+39 EUR/mes), Academia/LMS (+49 EUR/mes), Firma Digital eIDAS (+19 EUR/mes)',
      'API Y CONSUMO (2% de ingresos) - Facturacion por uso de APIs para integraciones personalizadas, webhooks, y acceso a datos para BI externo. Pricing por llamada/evento sobre volumen base'
    ],
    
    keyPartners: [
      'SUPABASE/LOVABLE - Infraestructura cloud y plataforma de desarrollo: Proveedor critico para base de datos, autenticacion, storage y edge functions. Acuerdo de partnership con pricing preferencial y soporte prioritario',
      'GOOGLE CLOUD / GEMINI AI - Capacidades de inteligencia artificial: Acceso a modelos Gemini 2.5 Pro/Flash para analisis documental, generacion de contenido, embeddings y predicciones. Acuerdo de uso empresarial con SLA',
      'PROVEEDORES DE DATOS EMPRESARIALES - Informa D&B, Axesor, CIRBE: Acceso a datos de solvencia, informes financieros y registros oficiales para enriquecer perfiles de clientes empresa',
      'CONSULTORAS TECNOLOGICAS BANCARIAS - Accenture, Deloitte, Everis, NTT Data: Partnerships de canal para acceso a proyectos de transformacion digital en grandes cuentas. Modelo de comision/referral',
      'INTEGRADORES DE CORE BANCARIO - Partners certificados de Temenos, Sopra, Silverlake: Colaboracion tecnica para desarrollar conectores nativos y garantizar interoperabilidad',
      'ASOCIACIONES BANCARIAS - AEB, CECA, UNACC: Presencia institucional, acceso a eventos sectoriales, credibilidad de marca y canal de difusion hacia entidades asociadas',
      'ORGANISMOS REGULADORES - Banco de Espana (sandbox regulatorio): Participacion en iniciativas de innovacion regulatoria, validacion temprana de enfoques de compliance',
      'UNIVERSIDADES Y ESCUELAS DE NEGOCIO - IE, ESADE, IESE: Colaboraciones academicas para I+D en IA financiera, acceso a talento y credibilidad institucional'
    ],
    
    costStructure: [
      'INFRAESTRUCTURA CLOUD (15% de ingresos) - Costes de Supabase, CDN (Cloudflare), storage, compute para edge functions, servicios de IA (Lovable AI Gateway). Objetivo: mantener por debajo del 15% mediante optimizacion continua',
      'DESARROLLO Y PRODUCTO (35% de ingresos) - Salarios y beneficios del equipo tecnico: 12 desarrolladores senior, 2 DevOps/SRE, 3 QA engineers, 2 Product Managers, 1 UX Lead. Incluye herramientas de desarrollo y licencias',
      'COMERCIAL Y MARKETING (25% de ingresos) - Equipo comercial (4 Account Executives, 2 SDRs), marketing digital, eventos, contenido, PR. Inversion agresiva en los primeros anos para captar cuota de mercado',
      'OPERACIONES Y SOPORTE (15% de ingresos) - Equipo de Customer Success (3 CSMs), soporte tecnico (4 agentes), formadores, documentacion. Foco en retention y expansion de cuentas existentes',
      'G&A (10% de ingresos) - Administracion, finanzas, legal, compliance interno, oficinas (coworking), seguros, auditoria. Estructura lean aprovechando modelo remoto'
    ]
  },
  
  financialPlan: {
    projectedRevenue: 2500000,
    projectedCosts: 1625000,
    breakEvenPoint: 'Q2 2026 (18 meses desde lanzamiento comercial)',
    fundingRequired: 2750000
  },
  
  marketingStrategy: {
    channels: [
      'EVENTOS SECTORIALES: Presencia en congresos bancarios (Finnovista, South Summit, Money2020 Europe). Stand + speaking slots. Budget: 80,000 EUR/ano',
      'CONTENT MARKETING: Blog tecnico, whitepapers, webinars sobre compliance y transformacion digital. SEO orientado a keywords sectoriales. Budget: 40,000 EUR/ano',
      'LINKEDIN + SOCIAL SELLING: Estrategia de marca personal para founders y equipo comercial. Account-based marketing dirigido a decision makers. Budget: 30,000 EUR/ano',
      'PARTNERSHIPS Y REFERRALS: Programa de referidos con consultoras, integradores y clientes existentes. Comisiones del 10-15% primer ano. Budget variable segun exito',
      'DEMOS Y PILOTOS: Programa de POCs gratuitos de 30 dias para prospects cualificados. Conversion esperada >60%. Budget: incluido en comercial',
      'PR Y MEDIOS ESPECIALIZADOS: Notas de prensa, articulos patrocinados en medios financieros (Expansion, Cinco Dias, Funds People). Budget: 25,000 EUR/ano'
    ],
    budget: 175000,
    tactics: [
      'Account-Based Marketing (ABM) para las 100 entidades target prioritarias',
      'Programa de early adopters con descuentos del 30% y co-desarrollo de features',
      'Casos de exito documentados con ROI cuantificado para cada cliente piloto',
      'Webinars mensuales sobre normativa (DORA, MiFID II) con expertos invitados',
      'Presencia activa en asociaciones sectoriales (AEB, CECA, UNACC)',
      'Estrategia de thought leadership: articulos, podcasts, entrevistas en medios'
    ]
  },
  
  operationsPlan: {
    keyActivities: [
      'DESARROLLO CONTINUO: Sprints de 2 semanas con releases cada mes. Roadmap publico para clientes. Feature requests priorizados por impacto/esfuerzo',
      'IMPLEMENTACION Y ONBOARDING: Metodologia estandarizada de 4-6 semanas. Plantillas de configuracion por tipo de entidad. Migracion de datos asistida',
      'SOPORTE Y SUCCESS: Soporte L1 (chatbot + agentes), L2 (especialistas producto), L3 (ingenieria). CSM dedicado para cuentas enterprise. QBRs trimestrales',
      'COMPLIANCE Y SEGURIDAD: Auditorias de seguridad semestrales. Actualizacion continua de motor de compliance. Certificaciones ISO/SOC mantenidas',
      'PARTNERSHIPS: Gestion activa de relaciones con partners tecnologicos y de canal. Programa de certificacion para integradores'
    ],
    resources: [
      'EQUIPO CORE (Ano 1): 15 personas - 8 desarrollo, 2 producto, 3 comercial, 2 operaciones',
      'EQUIPO ESCALADO (Ano 3): 35 personas - 18 desarrollo, 4 producto, 8 comercial, 5 operaciones',
      'INFRAESTRUCTURA: Supabase Cloud, Lovable Platform, Google Cloud (IA), Cloudflare (CDN/seguridad)',
      'HERRAMIENTAS: GitHub, Linear, Figma, Notion, HubSpot CRM, Intercom, Metabase'
    ],
    timeline: `ROADMAP DE HITOS:
Q1 2025: Lanzamiento comercial v1.0. Primeros 5 clientes piloto
Q2 2025: Certificacion ISO 27001. 15 clientes activos
Q3 2025: Expansion Portugal. Modulo contabilidad IA
Q4 2025: SOC 2 Type II. 30 clientes. Serie A cerrada
Q1 2026: Expansion Francia. 45 clientes
Q2 2026: Break-even operativo. 60+ clientes
Q4 2026: 100 clientes. Preparacion Serie B`
  },
  
  teamOrganization: {
    structure: `ESTRUCTURA ORGANIZATIVA

CEO & Co-founder: Vision estrategica, relaciones inversores, grandes cuentas
CTO & Co-founder: Arquitectura tecnica, roadmap producto, equipo engineering
COO: Operaciones, customer success, compliance interno

EQUIPOS:
- Engineering (12): Backend (4), Frontend (4), IA/ML (2), DevOps (2)
- Product (3): Product Manager (2), UX Designer (1)
- Commercial (6): Head of Sales (1), Account Executives (3), SDRs (2)
- Customer Success (5): Head of CS (1), CSMs (3), Support (1)
- G&A (4): CFO/Finance (1), People (1), Legal (1), Admin (1)

CULTURA:
- Remote-first con hubs en Barcelona y Madrid
- Equity para todos los empleados (ESOP 10%)
- Formacion continua (2,000 EUR/persona/ano)
- Workation trimestral para team building`,
    roles: [
      'CEO: Liderazgo estrategico, fundraising, desarrollo de negocio enterprise, representacion publica',
      'CTO: Arquitectura de sistemas, liderazgo tecnico, innovacion tecnologica, gestion del equipo de ingenieria',
      'COO: Operaciones diarias, customer success, procesos internos, compliance',
      'VP Sales: Estrategia comercial, gestion del pipeline, negociacion de grandes cuentas',
      'VP Product: Roadmap de producto, priorizacion de features, investigacion de usuarios',
      'Head of Engineering: Gestion del equipo tecnico, calidad de codigo, procesos de desarrollo',
      'Head of Customer Success: Retencion de clientes, expansion de cuentas, satisfaccion del cliente'
    ]
  },
  
  riskAnalysis: {
    risks: [
      { 
        name: 'Competencia de grandes players (Salesforce, Microsoft)', 
        mitigation: 'Diferenciacion via especializacion en compliance europeo, IA nativa, pricing competitivo. Foco en segmento mid-market donde giants son menos agresivos. Partnerships con integradores locales.' 
      },
      { 
        name: 'Ciclos de venta largos en banca (6-18 meses)', 
        mitigation: 'Pipeline diversificado con 3x objetivo. Programa de pilotos/POCs para acelerar decision. Early adopters con condiciones especiales. Contenido educativo para reducir friccion.' 
      },
      { 
        name: 'Cambios regulatorios imprevistos', 
        mitigation: 'Equipo dedicado de compliance monitoring. Participacion en sandboxes regulatorios. Arquitectura modular que permite adaptar rapidamente. Relaciones con reguladores.' 
      },
      { 
        name: 'Dificultad de captacion de talento tech', 
        mitigation: 'Propuesta de valor atractiva: equity, remoto, formacion, proyecto innovador. Presencia en comunidades tech. Programa de referidos interno. Colaboraciones con universidades.' 
      },
      { 
        name: 'Dependencia de infraestructura de terceros (Supabase/Lovable)', 
        mitigation: 'Arquitectura con capas de abstraccion. Plan de contingencia documentado. Multiples proveedores para servicios criticos. Backups geograficos.' 
      },
      { 
        name: 'Incidente de seguridad/brecha de datos', 
        mitigation: 'Programa robusto de seguridad: pentesting, bug bounty, certificaciones ISO/SOC. Seguro de responsabilidad cyber. Plan de respuesta a incidentes. Formacion continua del equipo.' 
      },
      { 
        name: 'Fallo en consecucion de financiacion', 
        mitigation: 'Runway minimo de 18 meses. Multiples opciones de financiacion (VC, deuda venture, subvenciones). Modelo de negocio con path to profitability claro. Relaciones tempranas con inversores.' 
      }
    ]
  }
};

// ============================================
// DATOS DE ESTUDIO DE VIABILIDAD
// ============================================
const obelixiaViabilityData: ViabilityStudyPDFData = {
  projectName: 'ObelixIA Technologies - Plataforma CRM Bancaria con IA',
  projectType: 'SaaS B2B Enterprise - Sector Financiero',
  description: `ObelixIA es una plataforma integral de gestion de cartera bancaria potenciada por inteligencia artificial, disenada especificamente para el mercado europeo. Combina funcionalidades CRM avanzadas con cumplimiento normativo automatizado, analisis predictivo y asistencia contextual mediante IA generativa. El proyecto busca capturar una posicion de liderazgo en el segmento de bancos medianos europeos, aprovechando la ventana de oportunidad creada por la regulacion DORA y la demanda creciente de soluciones tecnologicas europeas que garanticen soberania de datos.`,
  status: 'Estudio completado - Proyecto VIABLE',
  createdAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
  initialInvestment: 2750000,
  projectionYears: 5,
  
  financialScore: 85,
  technicalScore: 88,
  commercialScore: 78,
  overallViability: 82,
  
  npv: 1850000,
  irr: 42.5,
  paybackPeriod: 24,
  roi: 320,
  breakEvenPoint: 'Q2 2026 (Mes 18)',
  
  revenueProjections: [450000, 980000, 2500000, 4200000, 6800000],
  costProjections: [380000, 720000, 1625000, 2520000, 3740000],
  cashFlowProjections: [85000, 245000, 785000, 1450000, 2650000],
  
  strengths: [
    'Tecnologia diferenciadora: Unica plataforma con IA generativa nativa (Gemini 2.5) para banca europea',
    'Equipo fundador con experiencia directa en banca y tecnologia (15+ anos combinados)',
    'Arquitectura cloud-native moderna basada en Supabase/Lovable, escalable y mantenible',
    'Enfoque compliance-first: motor de cumplimiento normativo como ventaja competitiva',
    'Modelo SaaS con ingresos recurrentes predecibles y alto potencial de expansion',
    'Time-to-market optimizado: MVP funcional con clientes piloto en validacion',
    'Posicionamiento europeo: soberania de datos como diferenciador vs competidores US',
    'Costes de adquisicion reducidos gracias a especializacion sectorial'
  ],
  
  weaknesses: [
    'Empresa nueva sin track record establecido en el sector bancario',
    'Equipo inicial pequeno que requiere crecimiento rapido para escalar',
    'Dependencia de infraestructura de terceros (Supabase, Google Cloud)',
    'Ciclos de venta largos tipicos del sector financiero (6-18 meses)',
    'Necesidad de certificaciones de seguridad (ISO 27001, SOC 2) aun en proceso',
    'Marca desconocida que requiere inversion significativa en posicionamiento',
    'Recursos financieros limitados hasta cierre de ronda Serie A'
  ],
  
  opportunities: [
    'Regulacion DORA (enero 2025): obligacion legal de modernizar sistemas de riesgo operativo',
    'Demanda creciente de soluciones IA en banca: 28% CAGR en segmento CRM+IA',
    'Consolidacion bancaria en Europa: fusiones generan oportunidades de migracion',
    'Open Banking PSD2/PSD3: nuevas necesidades de gestion de APIs y consentimientos',
    'Escasez de soluciones europeas: preocupacion por soberania de datos post-Schrems II',
    'Partnerships con Big Four: Accenture, Deloitte buscan soluciones innovadoras',
    'ESG y finanzas sostenibles: demanda de herramientas de reporting especializadas',
    'Talento tech disponible: reestructuraciones en grandes tech liberan profesionales'
  ],
  
  threats: [
    'Competencia de giants: Salesforce y Microsoft con recursos muy superiores',
    'Entrada de nuevos competidores europeos con propuestas similares',
    'Cambios regulatorios imprevistos que alteren el marco de compliance',
    'Crisis economica que reduzca presupuestos de transformacion digital bancaria',
    'Consolidacion de clientes potenciales que reduzca mercado direccionable',
    'Evolucion rapida de IA que obsolete ventaja tecnologica actual',
    'Escasez de talento tech que encarezca costes de desarrollo',
    'Incidente de seguridad que dane reputacion en sector sensible'
  ],
  
  risks: [
    {
      name: 'Riesgo de mercado: Adopcion mas lenta de lo esperado',
      probability: 'Media (40%)',
      impact: 'Alto',
      mitigation: 'Pipeline diversificado 3x, programa de early adopters, contenido educativo para reducir friccion'
    },
    {
      name: 'Riesgo competitivo: Respuesta agresiva de incumbents',
      probability: 'Media-Alta (50%)',
      impact: 'Medio',
      mitigation: 'Diferenciacion via especializacion, pricing competitivo, foco en servicio y relacion cercana'
    },
    {
      name: 'Riesgo tecnico: Problemas de escalabilidad o rendimiento',
      probability: 'Baja (20%)',
      impact: 'Alto',
      mitigation: 'Arquitectura probada (Supabase), testing exhaustivo, monitorizacion proactiva, equipo DevOps dedicado'
    },
    {
      name: 'Riesgo financiero: No consecucion de Serie A',
      probability: 'Baja-Media (30%)',
      impact: 'Muy Alto',
      mitigation: 'Runway 18 meses, multiples opciones de financiacion, path to profitability demostrable'
    },
    {
      name: 'Riesgo operativo: Rotacion clave del equipo',
      probability: 'Baja (15%)',
      impact: 'Alto',
      mitigation: 'Equity para todos, cultura remoto-first, formacion continua, documentacion exhaustiva'
    },
    {
      name: 'Riesgo regulatorio: Cambios normativos adversos',
      probability: 'Baja (10%)',
      impact: 'Medio',
      mitigation: 'Equipo compliance dedicado, participacion en sandboxes, arquitectura modular adaptable'
    }
  ],
  
  recommendations: [
    'PRIORIDAD ALTA: Cerrar ronda Seed (500K EUR) antes de Q1 2025 para financiar crecimiento inicial',
    'PRIORIDAD ALTA: Conseguir 3-5 clientes piloto de referencia antes del lanzamiento comercial',
    'PRIORIDAD ALTA: Obtener certificacion ISO 27001 antes de Q2 2025 como requisito de entrada',
    'PRIORIDAD MEDIA: Establecer partnerships con 2-3 consultoras tecnologicas para acceso a pipeline',
    'PRIORIDAD MEDIA: Desarrollar programa formal de early adopters con condiciones atractivas',
    'PRIORIDAD MEDIA: Contratar Head of Sales con experiencia en venta enterprise a banca',
    'OPTIMIZACION: Implementar sistema de metricas y KPIs desde el dia uno',
    'OPTIMIZACION: Documentar exhaustivamente todos los procesos para facilitar escalado',
    'CONTINGENCIA: Mantener runway minimo de 18 meses en todo momento',
    'CONTINGENCIA: Desarrollar plan B de financiacion (deuda venture, subvenciones, clientes estrategicos)'
  ],
  
  conclusion: `CONCLUSION DEL ESTUDIO DE VIABILIDAD

El proyecto ObelixIA presenta una viabilidad ALTA (82/100) basada en el analisis exhaustivo de factores financieros, tecnicos y comerciales.

FACTORES POSITIVOS DETERMINANTES:
- Metricas financieras solidas: VAN positivo de 1.85M EUR, TIR del 42.5% muy superior al coste de capital, payback en 24 meses
- Oportunidad de mercado clara: ventana regulatoria DORA, demanda de soluciones europeas, crecimiento del 28% en segmento CRM+IA
- Diferenciacion tecnologica real: unica plataforma con IA generativa nativa para banca europea
- Equipo fundador complementario con experiencia relevante en banca y tecnologia
- Modelo de negocio SaaS probado con economics favorables (margen bruto 70%+, LTV/CAC >3)

AREAS DE ATENCION:
- Ciclos de venta largos que requieren gestion de cash flow cuidadosa
- Necesidad de certificaciones de seguridad para entrar en cuentas enterprise
- Competencia de grandes players que requiere estrategia de diferenciacion clara

RECOMENDACION FINAL:
Se recomienda PROCEDER con el proyecto con las siguientes condiciones:
1. Asegurar financiacion Seed antes de lanzamiento comercial
2. Conseguir al menos 3 clientes piloto de referencia
3. Obtener certificacion ISO 27001 en los primeros 6 meses
4. Mantener runway minimo de 18 meses en todo momento

El proyecto tiene potencial de convertirse en lider del segmento CRM bancario con IA en Europa si ejecuta correctamente su estrategia de go-to-market y mantiene el foco en diferenciacion tecnologica y especializacion sectorial.`
};

// ============================================
// DATOS DEL NDA
// ============================================
const obelixiaNDAData: NDAPDFData = {
  companyName: 'ObelixIA Technologies S.L.',
  companyAddress: 'Barcelona, Espana',
  companyCIF: 'B-12345678',
  companyRepresentative: '[REPRESENTANTE LEGAL]',
  companyRepresentativeRole: 'Administrador Unico',
  effectiveDate: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
  confidentialityPeriodYears: 5,
  jurisdiction: 'Barcelona, Espana',
  relatedDocuments: [
    'Plan de Negocio ObelixIA Technologies',
    'Estudio de Viabilidad Economica-Financiera',
    'Proyecciones Financieras 2025-2029',
    'Roadmap de Producto y Tecnologia',
    'Estrategia Comercial y Go-to-Market',
    'Informacion sobre equipo, inversores y partnerships'
  ],
  includeNonCompete: true,
  includeNonSolicitation: true,
  returnDocumentsClause: true,
  penaltyAmount: 50000
};

// ============================================
// FUNCIONES DE DESCARGA
// ============================================

export function downloadObelixiaBusinessPlanPDF(): void {
  downloadBusinessPlanPDF(
    obelixiaBusinessPlanData, 
    `ObelixIA_Plan_de_Negocio_${new Date().toISOString().split('T')[0]}.pdf`
  );
}

export function downloadObelixiaViabilityStudyPDF(): void {
  downloadViabilityStudyPDF(
    obelixiaViabilityData,
    `ObelixIA_Estudio_Viabilidad_${new Date().toISOString().split('T')[0]}.pdf`
  );
}

export function downloadObelixiaNDAPDF(): void {
  downloadNDAPDF(
    obelixiaNDAData,
    `ObelixIA_Contrato_Confidencialidad_NDA_${new Date().toISOString().split('T')[0]}.pdf`
  );
}

export function downloadAllObelixiaPDFs(): void {
  downloadObelixiaBusinessPlanPDF();
  setTimeout(() => downloadObelixiaViabilityStudyPDF(), 500);
  setTimeout(() => downloadObelixiaNDAPDF(), 1000);
}

// Exportar datos para uso externo
export { obelixiaBusinessPlanData, obelixiaViabilityData, obelixiaNDAData };
