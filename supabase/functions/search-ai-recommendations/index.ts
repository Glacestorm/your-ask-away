import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIRecommendation {
  category: string;
  title: string;
  description: string;
  complianceNotes: string;
  securityConsiderations: string[];
  regulatoryFramework: string[];
  implementationApproach: string;
  estimatedEffort: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
  benefits: string[];
  tools: string[];
  bestPractices: string[];
  bankingExamples: string[];
}

interface AutomationRecommendation {
  platform: string;
  description: string;
  useCases: string[];
  securityNotes: string;
  integrationComplexity: string;
  complianceConsiderations: string[];
  bankingApplications: string[];
  implementationGuide?: {
    prerequisites: string[];
    steps: {
      stepNumber: number;
      title: string;
      description: string;
      commands?: string[];
      configuration?: string;
      tips: string[];
    }[];
    estimatedTime: string;
    difficulty: string;
  };
}

interface CompetitorFeature {
  competitor: string;
  aiFeatures: string[];
  differentiationOpportunity: string;
  implementationPhases?: {
    phase: number;
    name: string;
    duration: string;
    objectives: string[];
    deliverables: string[];
    resources: string[];
    risks: string[];
    successMetrics: string[];
  }[];
  technicalRequirements?: string[];
  estimatedInvestment?: string;
}

interface AIAnalysis {
  generationDate: string;
  executiveSummary: string;
  aiRecommendations: AIRecommendation[];
  automationPlatforms: AutomationRecommendation[];
  securityGuidelines: string[];
  regulatoryCompliance: {
    regulation: string;
    aiImplications: string;
    requiredMeasures: string[];
  }[];
  competitorAnalysis: CompetitorFeature[];
  bankingTrends: {
    trend: string;
    description: string;
    adoptionStatus: string;
    recommendation: string;
  }[];
  implementationRoadmap: {
    phase: string;
    duration: string;
    objectives: string[];
    deliverables: string[];
    detailedSteps?: {
      step: number;
      action: string;
      responsible: string;
      tools: string[];
      documentation: string;
    }[];
    budget?: string;
    kpis?: string[];
  }[];
  automationManuals?: {
    platform: string;
    setupGuide: {
      title: string;
      steps: string[];
    }[];
    workflowExamples: {
      name: string;
      description: string;
      triggers: string[];
      actions: string[];
      integrations: string[];
    }[];
    securityConfiguration: string[];
    maintenanceGuide: string[];
  }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentModules, industryFocus } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Searching AI recommendations for banking application...");

    const systemPrompt = `Eres un experto en Inteligencia Artificial aplicada al sector bancario, con profundo conocimiento en:

REGULACIONES Y CUMPLIMIENTO:
- GDPR/RGPD: Protección de datos personales
- AI Act de la UE: Clasificación de sistemas IA de alto riesgo (banca = alto riesgo)
- DORA: Resiliencia operativa digital
- MiFID II: Protección del inversor
- Directrices EBA sobre ML en gestión de riesgos
- Normativa APDA Andorra (Llei 29/2021)
- Basel III/IV: Capital y riesgos
- PSD2/PSD3: Servicios de pago

SEGURIDAD EN IA BANCARIA:
- Explicabilidad de modelos (XAI)
- Prevención de sesgos algorítmicos
- Auditoría de modelos
- Privacidad diferencial
- Federated Learning
- Encriptación homomórfica
- Tokenización de datos sensibles

TECNOLOGÍAS Y PLATAFORMAS:
- LLMs: GPT-5, Gemini, Claude, Llama
- Automatización: n8n, Make (Integromat), Zapier
- ML Ops: MLflow, Weights & Biases
- Vector DBs: Supabase pgvector, Pinecone
- RAG: LangChain, LlamaIndex

Tu tarea es proporcionar recomendaciones EXHAUSTIVAS sobre cómo implementar IA en una aplicación CRM bancaria de forma segura y cumpliendo normativas.

IMPORTANTE: Responde SOLO con JSON válido sin markdown ni comentarios.`;

    const userPrompt = `Analiza esta aplicación CRM bancaria y proporciona recomendaciones EXHAUSTIVAS de IA y automatización con MÁXIMO DETALLE:

MÓDULOS ACTUALES: ${JSON.stringify(currentModules || [])}
FOCO INDUSTRIAL: ${industryFocus || 'Banca comercial andorrana y española, gestión de cartera empresarial'}

Genera un JSON exhaustivo con:

1. executiveSummary: Resumen ejecutivo de 4-5 párrafos sobre oportunidades de IA en banca

2. aiRecommendations: Array de recomendaciones de IA (mínimo 15) con:
   - category, title, description, complianceNotes
   - securityConsiderations: medidas de seguridad (mínimo 5)
   - regulatoryFramework: normativas aplicables
   - implementationApproach: enfoque técnico DETALLADO
   - estimatedEffort, riskLevel (bajo/medio/alto)
   - benefits, tools, bestPractices
   - bankingExamples: ejemplos de bancos que lo usan

3. automationPlatforms: Análisis COMPLETO de plataformas (n8n, Make, Zapier, Power Automate, Tray.io) con:
   - platform, description, useCases, securityNotes, integrationComplexity
   - complianceConsiderations, bankingApplications
   - implementationGuide: {
       prerequisites: requisitos previos detallados,
       steps: array de {stepNumber, title, description, commands?, configuration?, tips[]},
       estimatedTime, difficulty
     }

4. securityGuidelines: Directrices de seguridad para IA bancaria (mínimo 20)

5. regulatoryCompliance: Análisis de cada regulación (GDPR, AI Act, DORA, MiFID II, EBA, PSD2/PSD3, APDA)

6. competitorAnalysis: Análisis DETALLADO de competidores (Santander, BBVA, CaixaBank, Sabadell, Bankinter, N26, Revolut, ING, Morabanc, Andbank, Crèdit Andorrà) con:
   - competitor, aiFeatures, differentiationOpportunity
   - implementationPhases: array de {phase, name, duration, objectives[], deliverables[], resources[], risks[], successMetrics[]}
   - technicalRequirements: requisitos técnicos para replicar
   - estimatedInvestment: inversión estimada

7. bankingTrends: Tendencias actuales de IA en banca (mínimo 12)

8. implementationRoadmap: Hoja de ruta en 5 fases con MÁXIMO DETALLE:
   - phase, duration, objectives, deliverables
   - detailedSteps: array de {step, action, responsible, tools[], documentation}
   - budget: presupuesto estimado
   - kpis: indicadores de éxito

9. automationManuals: Manuales COMPLETOS para cada plataforma (n8n, Make, Power Automate):
   - platform
   - setupGuide: array de {title, steps[]}
   - workflowExamples: array de {name, description, triggers[], actions[], integrations[]}
   - securityConfiguration: configuraciones de seguridad
   - maintenanceGuide: guía de mantenimiento

Prioriza:
- Cumplimiento estricto con regulaciones europeas y andorranas
- Seguridad de datos bancarios como máxima prioridad
- ROI claro y medible
- Implementación con recursos limitados
- Diferenciación competitiva`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis: AIAnalysis;
    const defaults = getDefaultAIRecommendations();
    
    try {
      const parsed = JSON.parse(content);
      
      // Merge parsed data with defaults to ensure all arrays exist
      analysis = {
        generationDate: new Date().toISOString(),
        executiveSummary: parsed.executiveSummary || defaults.executiveSummary,
        aiRecommendations: Array.isArray(parsed.aiRecommendations) && parsed.aiRecommendations.length > 0 
          ? parsed.aiRecommendations 
          : defaults.aiRecommendations,
        automationPlatforms: Array.isArray(parsed.automationPlatforms) && parsed.automationPlatforms.length > 0 
          ? parsed.automationPlatforms 
          : defaults.automationPlatforms,
        securityGuidelines: Array.isArray(parsed.securityGuidelines) && parsed.securityGuidelines.length > 0 
          ? parsed.securityGuidelines 
          : defaults.securityGuidelines,
        regulatoryCompliance: Array.isArray(parsed.regulatoryCompliance) && parsed.regulatoryCompliance.length > 0 
          ? parsed.regulatoryCompliance 
          : defaults.regulatoryCompliance,
        competitorAnalysis: Array.isArray(parsed.competitorAnalysis) && parsed.competitorAnalysis.length > 0 
          ? parsed.competitorAnalysis 
          : defaults.competitorAnalysis,
        bankingTrends: Array.isArray(parsed.bankingTrends) && parsed.bankingTrends.length > 0 
          ? parsed.bankingTrends 
          : defaults.bankingTrends,
        implementationRoadmap: Array.isArray(parsed.implementationRoadmap) && parsed.implementationRoadmap.length > 0 
          ? parsed.implementationRoadmap 
          : defaults.implementationRoadmap,
        automationManuals: Array.isArray(parsed.automationManuals) && parsed.automationManuals.length > 0 
          ? parsed.automationManuals 
          : defaults.automationManuals,
      };
      
      console.log("AI recommendations parsed successfully, aiRecommendations count:", analysis.aiRecommendations?.length);
      console.log("automationPlatforms count:", analysis.automationPlatforms?.length);
    } catch (parseError) {
      console.error("Failed to parse AI response, using defaults:", parseError);
      analysis = defaults;
    }

    console.log("AI recommendations generated successfully");

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("search-ai-recommendations error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDefaultAIRecommendations(): AIAnalysis {
  return {
    generationDate: new Date().toISOString(),
    executiveSummary: `La implementación de Inteligencia Artificial en el sector bancario representa una oportunidad transformadora, pero debe realizarse con estricto cumplimiento normativo. El AI Act de la UE clasifica los sistemas de scoring crediticio y evaluación de riesgos como "alto riesgo", requiriendo transparencia, explicabilidad y supervisión humana.

Para una aplicación CRM bancaria, las mayores oportunidades residen en: (1) Automatización de procesos repetitivos con n8n/Make manteniendo control humano, (2) Análisis de documentos financieros con RAG que no tome decisiones automáticas, (3) Asistentes conversacionales para soporte interno (no cliente final), y (4) Detección de anomalías como apoyo a decisiones humanas.

La estrategia recomendada es un enfoque híbrido "Human-in-the-Loop" donde la IA asiste pero no sustituye decisiones bancarias críticas. Esto maximiza beneficios mientras minimiza riesgos regulatorios. Toda implementación debe incluir: auditorías de sesgo, explicabilidad de decisiones, trazabilidad completa, y mecanismos de supervisión humana.

El roadmap sugerido prioriza casos de uso de bajo riesgo regulatorio en los primeros 12 meses (automatización interna, análisis documental asistido) antes de abordar casos de mayor complejidad normativa (scoring, recomendaciones de productos).`,

    aiRecommendations: [
      {
        category: "documents",
        title: "RAG para Análisis de Estados Financieros",
        description: "Sistema de Retrieval-Augmented Generation para analizar balances, cuentas de resultados y ratios financieros de empresas clientes, proporcionando resúmenes y alertas.",
        complianceNotes: "No toma decisiones crediticias automáticas. Funciona como herramienta de apoyo al analista. Los datos permanecen en infraestructura propia (Supabase pgvector).",
        securityConsiderations: [
          "Datos financieros almacenados encriptados (AES-256)",
          "Acceso basado en roles (RLS)",
          "Logs de auditoría de todas las consultas",
          "Sin transferencia de datos a terceros",
          "Anonimización para entrenamiento"
        ],
        regulatoryFramework: ["GDPR Art. 22", "AI Act - Sistema de apoyo (no alto riesgo si no decide)", "APDA Andorra"],
        implementationApproach: "Usar Supabase pgvector para embeddings locales, Lovable AI (Gemini) para generación. Implementar como Edge Function con RAG pipeline.",
        estimatedEffort: "4-6 semanas",
        riskLevel: "bajo",
        benefits: [
          "Reduce tiempo de análisis en 60%",
          "Estandariza evaluaciones",
          "Detecta inconsistencias automáticamente",
          "Histórico comparativo instantáneo"
        ],
        tools: ["Supabase pgvector", "Lovable AI", "LangChain", "pdf.js"],
        bestPractices: [
          "Siempre mostrar fuentes citadas",
          "Incluir disclaimer de herramienta de apoyo",
          "Permitir feedback del analista",
          "Revisión periódica de calidad"
        ],
        bankingExamples: ["BBVA (Blue - análisis de empresas)", "JPMorgan (Contract Intelligence)", "ING (análisis crediticio asistido)"]
      },
      {
        category: "automation",
        title: "Automatización de Workflows con n8n",
        description: "Flujos automatizados para tareas repetitivas: recordatorios de visitas, sincronización de datos, generación de informes, alertas de KPIs.",
        complianceNotes: "n8n puede desplegarse on-premise o self-hosted, manteniendo datos dentro de la infraestructura bancaria. Sin procesamiento externo de datos sensibles.",
        securityConsiderations: [
          "Despliegue on-premise o VPS propio",
          "Credenciales en vault seguro",
          "Webhooks con autenticación HMAC",
          "No exponer datos sensibles en logs",
          "Cifrado en tránsito (TLS 1.3)"
        ],
        regulatoryFramework: ["GDPR - Procesamiento legítimo", "DORA - Resiliencia operativa"],
        implementationApproach: "Instalar n8n en servidor dedicado. Crear workflows para: recordatorios diarios, sincronización CRM-contabilidad, alertas de umbrales, reportes automáticos.",
        estimatedEffort: "2-3 semanas configuración inicial",
        riskLevel: "bajo",
        benefits: [
          "Elimina tareas manuales repetitivas",
          "Reduce errores humanos",
          "Mejora tiempos de respuesta",
          "Escalable sin código adicional"
        ],
        tools: ["n8n (self-hosted)", "Supabase webhooks", "SMTP interno", "Calendar APIs"],
        bestPractices: [
          "Documentar cada workflow",
          "Implementar manejo de errores",
          "Alertas de fallos a administradores",
          "Revisión mensual de workflows activos"
        ],
        bankingExamples: ["Fintech modernas", "Bancos digitales (N26, Revolut - automatización interna)"]
      },
      {
        category: "customer-service",
        title: "Asistente IA Interno para Gestores",
        description: "Chatbot interno que ayuda a gestores comerciales a buscar información de clientes, normativas, productos y procedimientos.",
        complianceNotes: "Uso interno exclusivo (no cliente final). Respuestas basadas en documentación oficial. Sin toma de decisiones autónoma.",
        securityConsiderations: [
          "Autenticación obligatoria",
          "Logs de todas las conversaciones",
          "Sin acceso a datos no autorizados por rol",
          "Respuestas limitadas al contexto del usuario",
          "Revisión humana de respuestas sensibles"
        ],
        regulatoryFramework: ["GDPR - Uso interno", "Políticas internas de seguridad"],
        implementationApproach: "Implementar chat con Lovable AI, contexto RAG de documentación interna, historial por usuario, integración con base de conocimiento.",
        estimatedEffort: "3-4 semanas",
        riskLevel: "bajo",
        benefits: [
          "Respuestas inmediatas 24/7",
          "Onboarding más rápido",
          "Consistencia en información",
          "Reduce carga de soporte interno"
        ],
        tools: ["Lovable AI", "Supabase", "RAG pipeline", "React chat component"],
        bestPractices: [
          "Entrenar con documentación oficial",
          "Indicar claramente limitaciones",
          "Escalar a humano cuando necesario",
          "Feedback loop para mejora continua"
        ],
        bankingExamples: ["Santander (asistente interno)", "HSBC (Amy - soporte empleados)", "Bank of America (Erica - adaptado interno)"]
      },
      {
        category: "predictions",
        title: "Predicción de Churn con ML Explicable",
        description: "Modelo de machine learning para identificar clientes con riesgo de abandono, con explicaciones de los factores contribuyentes.",
        complianceNotes: "Requiere explicabilidad total (SHAP/LIME). Solo como herramienta de alerta, decisiones tomadas por humanos. Revisión de sesgos obligatoria.",
        securityConsiderations: [
          "Modelo entrenado con datos anonimizados",
          "Explicabilidad obligatoria (XAI)",
          "Auditoría de sesgos trimestral",
          "Sin uso de datos protegidos especialmente",
          "Documentación completa del modelo"
        ],
        regulatoryFramework: ["AI Act - Alto riesgo", "GDPR Art. 22", "EBA Guidelines ML", "Directrices AEPD sobre perfilado"],
        implementationApproach: "Entrenar modelo con scikit-learn/XGBoost. Implementar SHAP para explicabilidad. Desplegar como Edge Function con umbrales configurables.",
        estimatedEffort: "6-8 semanas",
        riskLevel: "medio",
        benefits: [
          "Retención proactiva de clientes",
          "Priorización de acciones comerciales",
          "Identificación temprana de problemas",
          "ROI medible en retención"
        ],
        tools: ["Python (scikit-learn/XGBoost)", "SHAP", "Edge Functions", "Dashboard alertas"],
        bestPractices: [
          "Documentar variables y su justificación",
          "Validación por negocio y cumplimiento",
          "Monitoreo de drift del modelo",
          "Reentrenamiento periódico programado"
        ],
        bankingExamples: ["CaixaBank (predicción churn)", "ING (modelos explicables)", "Bankinter (retención proactiva)"]
      },
      {
        category: "risk",
        title: "Detección de Anomalías Financieras",
        description: "Sistema de detección de patrones inusuales en movimientos y operaciones que puedan indicar riesgos o irregularidades.",
        complianceNotes: "Herramienta de apoyo a compliance. Todas las alertas revisadas por humanos. Sin decisiones automáticas de bloqueo.",
        securityConsiderations: [
          "Acceso restringido a equipo de riesgos",
          "Logs inmutables de detecciones",
          "Encriptación de datos sensibles",
          "Alertas confidenciales",
          "Retención según normativa AML"
        ],
        regulatoryFramework: ["Directiva AML 6", "Normativa PBC/FT", "EBA Guidelines", "SEPBLAC"],
        implementationApproach: "Algoritmos de detección de anomalías (Isolation Forest, Autoencoders). Umbrales configurables por tipo de operación. Dashboard de alertas para compliance.",
        estimatedEffort: "8-10 semanas",
        riskLevel: "medio",
        benefits: [
          "Detección temprana de riesgos",
          "Cumplimiento normativo mejorado",
          "Reducción de pérdidas por fraude",
          "Automatización de monitoreo"
        ],
        tools: ["Python ML", "Supabase", "Dashboard de alertas", "Reporting compliance"],
        bestPractices: [
          "Calibración continua de umbrales",
          "Reducción de falsos positivos",
          "Documentación de casos para auditoría",
          "Integración con workflow de investigación"
        ],
        bankingExamples: ["Todos los bancos regulados", "Especialistas: Feedzai, SAS", "BBVA (sistemas propios)"]
      },
      {
        category: "nlp",
        title: "Resumen Automático de Fichas de Visita",
        description: "Generación automática de resúmenes ejecutivos de fichas de visita comercial, extrayendo puntos clave y acciones pendientes.",
        complianceNotes: "Uso interno, datos ya capturados por el gestor. Sin exposición de datos personales adicional.",
        securityConsiderations: [
          "Procesamiento dentro de infraestructura",
          "Sin almacenamiento externo",
          "Acceso según permisos de ficha original",
          "Trazabilidad de generación"
        ],
        regulatoryFramework: ["GDPR - Procesamiento legítimo", "Políticas internas"],
        implementationApproach: "Usar Lovable AI para generar resúmenes estructurados. Extraer: objetivos, resultados, próximos pasos, oportunidades detectadas.",
        estimatedEffort: "2-3 semanas",
        riskLevel: "bajo",
        benefits: [
          "Ahorro de tiempo en reporting",
          "Consistencia en documentación",
          "Facilita seguimiento",
          "Mejora comunicación entre equipos"
        ],
        tools: ["Lovable AI (Gemini)", "Edge Functions", "Supabase"],
        bestPractices: [
          "Permitir edición del resumen",
          "Validación por el gestor",
          "Templates configurables",
          "Integración con CRM"
        ],
        bankingExamples: ["Salesforce Einstein (CRM)", "Microsoft Dynamics AI", "Zoho Zia"]
      },
      {
        category: "personalization",
        title: "Recomendación de Productos (Next Best Action)",
        description: "Sistema de sugerencias de productos bancarios basado en perfil del cliente y comportamiento, presentado al gestor como recomendación.",
        complianceNotes: "CRÍTICO: Requiere consentimiento explícito del cliente para perfilado. Solo sugerencias a gestor, nunca automático. Explicabilidad obligatoria.",
        securityConsiderations: [
          "Consentimiento documentado",
          "Opt-out disponible",
          "Sin datos sensibles especiales",
          "Explicación de cada recomendación",
          "Auditoría de imparcialidad"
        ],
        regulatoryFramework: ["GDPR Art. 22", "MiFID II (idoneidad)", "AI Act - Alto riesgo", "Directiva de crédito al consumo"],
        implementationApproach: "Modelo de recomendación colaborativa + basado en contenido. Filtrado por elegibilidad normativa. Presentación como sugerencia con explicación.",
        estimatedEffort: "8-12 semanas",
        riskLevel: "alto",
        benefits: [
          "Aumento de cross-selling",
          "Mejor adecuación producto-cliente",
          "Optimización de campañas",
          "Insights de necesidades"
        ],
        tools: ["Python recommender systems", "Supabase", "Dashboard gestor"],
        bestPractices: [
          "Test A/B con grupo control",
          "Revisión de sesgos continua",
          "Límite de frecuencia de sugerencias",
          "Feedback del cliente"
        ],
        bankingExamples: ["BBVA (recomendador productos)", "Santander (Next Best Offer)", "CaixaBank (personalización)"]
      },
      {
        category: "analytics",
        title: "Business Intelligence Aumentada",
        description: "Dashboards con insights generados por IA: detección automática de tendencias, anomalías en métricas, y narrativas explicativas.",
        complianceNotes: "Análisis agregado sin datos personales identificables. Uso interno para dirección.",
        securityConsiderations: [
          "Acceso según nivel jerárquico",
          "Datos agregados únicamente",
          "Sin exposición de individuos",
          "Logs de acceso a informes"
        ],
        regulatoryFramework: ["GDPR - Datos agregados", "Políticas internas de reporting"],
        implementationApproach: "Integrar generación de narrativas AI en dashboards existentes. Detección automática de cambios significativos. Alertas contextualizadas.",
        estimatedEffort: "4-5 semanas",
        riskLevel: "bajo",
        benefits: [
          "Insights accionables automáticos",
          "Reducción de análisis manual",
          "Democratización de datos",
          "Decisiones más informadas"
        ],
        tools: ["Lovable AI", "Recharts", "Supabase", "Edge Functions"],
        bestPractices: [
          "Validación de insights por expertos",
          "Contextualización de cambios",
          "Evitar sobreinterpretación",
          "Actualización en tiempo real"
        ],
        bankingExamples: ["ThoughtSpot en banca", "Power BI + Copilot", "Tableau con Ask Data"]
      },
      {
        category: "compliance",
        title: "Asistente de Cumplimiento Normativo",
        description: "IA que ayuda a verificar cumplimiento de normativas, responde dudas sobre procedimientos y genera checklists de compliance.",
        complianceNotes: "Herramienta de apoyo, no sustituye al departamento de cumplimiento. Basado en normativa oficial actualizada.",
        securityConsiderations: [
          "Fuentes normativas verificadas",
          "Versionado de normativas",
          "Disclaimer de uso como referencia",
          "Actualización periódica obligatoria"
        ],
        regulatoryFramework: ["Todas las normativas aplicables", "Función compliance interna"],
        implementationApproach: "RAG sobre corpus normativo (GDPR, DORA, MiFID, etc.). Actualizaciones periódicas de fuentes. Chat especializado para consultas.",
        estimatedEffort: "5-6 semanas",
        riskLevel: "bajo",
        benefits: [
          "Acceso rápido a normativa",
          "Reducción de errores de compliance",
          "Estandarización de respuestas",
          "Documentación de consultas"
        ],
        tools: ["RAG", "Lovable AI", "Base documental estructurada"],
        bestPractices: [
          "Actualización mensual de fuentes",
          "Revisión por legal/compliance",
          "Trazabilidad de consultas",
          "Escalar casos complejos"
        ],
        bankingExamples: ["Kira Systems (legal AI)", "Luminance", "ROSS Intelligence (conceptos similares)"]
      },
      {
        category: "vision",
        title: "OCR Inteligente para Documentos",
        description: "Extracción automática de datos de documentos físicos escaneados: DNIs, escrituras, contratos, facturas.",
        complianceNotes: "Solo extracción, validación humana requerida. Datos sensibles con tratamiento especial.",
        securityConsiderations: [
          "Procesamiento local preferente",
          "Encriptación de documentos",
          "Retención según tipo documento",
          "Acceso restringido",
          "Anonimización en logs"
        ],
        regulatoryFramework: ["GDPR - Datos personales", "Normativa KYC/AML", "Retención documental"],
        implementationApproach: "Google Vision API o Tesseract local para OCR. Post-procesamiento con LLM para estructurar datos. Validación por usuario.",
        estimatedEffort: "4-6 semanas",
        riskLevel: "bajo",
        benefits: [
          "Digitalización acelerada",
          "Reducción de entrada manual",
          "Menor tasa de errores",
          "Procesamiento 24/7"
        ],
        tools: ["Google Vision / Tesseract", "Lovable AI", "Supabase Storage"],
        bestPractices: [
          "Validación humana obligatoria",
          "Confianza mínima configurable",
          "Gestión de documentos rechazados",
          "Auditoría de extracciones"
        ],
        bankingExamples: ["Todos los bancos (onboarding digital)", "Especialistas: ABBYY, Kofax"]
      },
      {
        category: "optimization",
        title: "Optimización de Asignación de Cartera",
        description: "IA para sugerir redistribución óptima de clientes entre gestores basada en carga de trabajo, especialización y potencial.",
        complianceNotes: "Sugerencias para revisión por dirección. Transparencia en criterios de asignación.",
        securityConsiderations: [
          "Acceso solo para dirección",
          "Criterios documentados",
          "Sin discriminación algorítmica",
          "Revisión periódica de resultados"
        ],
        regulatoryFramework: ["Políticas internas RRHH", "No discriminación algorítmica"],
        implementationApproach: "Algoritmo de optimización multiobjetivo considerando: volumen, potencial, proximidad, especialización. Visualización de propuestas.",
        estimatedEffort: "4-5 semanas",
        riskLevel: "bajo",
        benefits: [
          "Equilibrio de cargas",
          "Mejora de cobertura",
          "Optimización de potencial",
          "Reducción de conflictos"
        ],
        tools: ["Python optimization", "Supabase", "Visualization"],
        bestPractices: [
          "Consulta con gestores afectados",
          "Transiciones graduales",
          "Métricas de éxito definidas",
          "Revisión semestral"
        ],
        bankingExamples: ["CRM bancarios enterprise", "Salesforce Territory Planning"]
      },
      {
        category: "fraud",
        title: "Scoring de Riesgo Transaccional en Tiempo Real",
        description: "Evaluación instantánea de riesgo en transacciones para detectar posibles operaciones fraudulentas o sospechosas.",
        complianceNotes: "CRÍTICO: Regulación AML/CFT estricta. Solo como apoyo a decisión humana en casos de alerta. Documentación exhaustiva.",
        securityConsiderations: [
          "Aislamiento de sistemas de scoring",
          "Logs inmutables",
          "Acceso ultra-restringido",
          "Encriptación extremo a extremo",
          "Auditoría externa anual"
        ],
        regulatoryFramework: ["Directiva AML 6", "Reglamento PBC/FT", "EBA Guidelines", "SEPBLAC", "FATF"],
        implementationApproach: "Modelo de ML para scoring en tiempo real. Umbrales configurables. Cola de revisión para alertas. Integración con sistemas de monitoreo.",
        estimatedEffort: "10-12 semanas",
        riskLevel: "alto",
        benefits: [
          "Detección inmediata de fraude",
          "Cumplimiento AML mejorado",
          "Reducción de pérdidas",
          "Protección de clientes"
        ],
        tools: ["ML especializado", "Sistemas real-time", "Cola de alertas"],
        bestPractices: [
          "Calibración continua",
          "Casos de estudio documentados",
          "Colaboración con autoridades",
          "Formación continua de equipo"
        ],
        bankingExamples: ["Obligatorio en toda banca regulada", "Feedzai, FICO, SAS", "Sistemas propios de grandes bancos"]
      }
    ],

    automationPlatforms: [
      {
        platform: "n8n (Self-hosted)",
        description: "Plataforma de automatización open-source que puede desplegarse on-premise, manteniendo datos dentro de la infraestructura bancaria.",
        useCases: [
          "Recordatorios automáticos de visitas y seguimientos",
          "Sincronización de datos entre sistemas",
          "Generación automática de informes diarios/semanales",
          "Alertas de KPIs fuera de umbral",
          "Notificaciones de cumplimiento de objetivos",
          "Backup automático de datos críticos",
          "Integración con calendario corporativo"
        ],
        securityNotes: "Despliegue on-premise elimina transferencia de datos a terceros. Credenciales en vault seguro. Autenticación SSO posible. Logs completos de ejecución.",
        integrationComplexity: "Media - Requiere servidor dedicado y mantenimiento",
        complianceConsiderations: [
          "Datos permanecen en infraestructura propia",
          "GDPR compliance nativo si se despliega internamente",
          "Auditable por diseño",
          "Control total sobre retención de datos"
        ],
        bankingApplications: [
          "Automatización de onboarding de clientes",
          "Flujos de aprobación de operaciones",
          "Reporting regulatorio automatizado",
          "Alertas de compliance"
        ]
      },
      {
        platform: "Make (Integromat)",
        description: "Plataforma cloud de automatización visual con amplio catálogo de integraciones y capacidades avanzadas de transformación de datos.",
        useCases: [
          "Integraciones con herramientas SaaS (CRM, email, calendarios)",
          "Procesamiento de webhooks",
          "Transformaciones de datos complejas",
          "Automatización de marketing",
          "Sincronización multi-sistema"
        ],
        securityNotes: "PRECAUCIÓN: Los datos pasan por servidores de Make (EU). Requiere evaluación de DPA y verificación de cumplimiento GDPR del proveedor. No recomendado para datos sensibles bancarios sin encriptación adicional.",
        integrationComplexity: "Baja - No requiere infraestructura propia",
        complianceConsiderations: [
          "Revisar DPA de Make",
          "Verificar ubicación de servidores (EU)",
          "Encriptar datos sensibles antes de envío",
          "Limitar a datos no críticos",
          "Documentar flujos de datos"
        ],
        bankingApplications: [
          "Automatización de tareas no sensibles",
          "Integraciones con herramientas de productividad",
          "Reporting externo"
        ]
      },
      {
        platform: "Microsoft Power Automate",
        description: "Solución enterprise de Microsoft integrada con ecosistema Office 365, con opciones on-premise y certificaciones bancarias.",
        useCases: [
          "Automatización dentro de ecosistema Microsoft",
          "Flujos de aprobación documentales",
          "Integración SharePoint/Teams",
          "RPA con Power Automate Desktop",
          "Conectores enterprise certificados"
        ],
        securityNotes: "Certificaciones SOC, ISO 27001, GDPR. Opción de despliegue on-premise con Power Automate Desktop. Integración con Azure Active Directory para SSO.",
        integrationComplexity: "Media-Alta - Requiere licenciamiento Microsoft",
        complianceConsiderations: [
          "Certificaciones enterprise disponibles",
          "Contrato DPA con Microsoft",
          "Opciones de residencia de datos EU",
          "Integración con DLP de Microsoft",
          "Auditoría centralizada"
        ],
        bankingApplications: [
          "Flujos de aprobación de créditos",
          "Automatización documental",
          "Integración con ERP/Core bancario",
          "Reporting regulatorio"
        ]
      },
      {
        platform: "Zapier",
        description: "Plataforma popular de automatización cloud con miles de integraciones, ideal para casos de uso no sensibles.",
        useCases: [
          "Integraciones rápidas con SaaS",
          "Automatización de tareas simples",
          "Notificaciones y alertas",
          "Sincronización de datos no sensibles"
        ],
        securityNotes: "PRECAUCIÓN: Similar a Make, datos pasan por servidores Zapier (US/EU). NO recomendado para datos bancarios sensibles. Mejor para herramientas de productividad.",
        integrationComplexity: "Muy baja - Interfaz más simple",
        complianceConsiderations: [
          "Verificar ubicación de procesamiento",
          "Limitar estrictamente a datos no sensibles",
          "Documentar todos los Zaps activos",
          "Revisar periódicamente integraciones"
        ],
        bankingApplications: [
          "Herramientas de productividad internas",
          "Marketing automation (con consentimiento)",
          "Integraciones no críticas"
        ]
      }
    ],

    securityGuidelines: [
      "PRINCIPIO: Human-in-the-Loop obligatorio para cualquier decisión que afecte a clientes",
      "Nunca almacenar datos sensibles en servicios cloud no certificados para banca",
      "Implementar explicabilidad (XAI) en todos los modelos que afecten a clientes",
      "Realizar auditorías de sesgo algorítmico trimestrales",
      "Documentar exhaustivamente todos los modelos de IA: datos, entrenamiento, validación",
      "Encriptar datos en reposo (AES-256) y en tránsito (TLS 1.3)",
      "Implementar control de acceso granular basado en roles (RBAC)",
      "Mantener logs inmutables de todas las decisiones asistidas por IA",
      "Establecer proceso de revisión humana para alertas de IA",
      "Implementar monitoreo de drift en modelos de ML",
      "Realizar pruebas de penetración específicas para endpoints de IA",
      "Establecer proceso de actualización y reentrenamiento de modelos",
      "Documentar consentimientos requeridos para cada uso de IA",
      "Implementar mecanismos de opt-out para clientes",
      "Mantener inventario actualizado de todos los sistemas de IA"
    ],

    regulatoryCompliance: [
      {
        regulation: "AI Act (Reglamento UE de IA)",
        aiImplications: "Sistemas de scoring crediticio y evaluación de riesgos clasificados como ALTO RIESGO. Requiere: evaluación de conformidad, registro en base de datos EU, supervisión humana, transparencia, gestión de calidad de datos.",
        requiredMeasures: [
          "Evaluación de conformidad antes de despliegue",
          "Documentación técnica exhaustiva",
          "Sistema de gestión de calidad",
          "Logs de funcionamiento",
          "Supervisión humana efectiva",
          "Registro en base de datos UE (cuando esté disponible)",
          "Información clara a usuarios sobre interacción con IA"
        ]
      },
      {
        regulation: "GDPR / RGPD",
        aiImplications: "Artículo 22: Derecho a no ser sometido a decisiones automatizadas con efectos significativos. Artículos 13-14: Transparencia sobre lógica del procesamiento.",
        requiredMeasures: [
          "Consentimiento explícito para perfilado",
          "Derecho a intervención humana",
          "Explicación de la lógica involucrada",
          "Derecho a impugnar decisiones",
          "Evaluación de Impacto (DPIA) para tratamientos de alto riesgo",
          "Registro de actividades de tratamiento"
        ]
      },
      {
        regulation: "DORA (Digital Operational Resilience Act)",
        aiImplications: "Sistemas de IA considerados como activos TIC críticos. Requiere resiliencia operativa, gestión de incidentes, y testing de terceros de IA.",
        requiredMeasures: [
          "Inventario de activos TIC incluyendo IA",
          "Gestión de riesgos TIC para sistemas IA",
          "Plan de continuidad para sistemas IA críticos",
          "Testing de resiliencia de proveedores IA",
          "Reporting de incidentes relacionados con IA"
        ]
      },
      {
        regulation: "MiFID II",
        aiImplications: "Sistemas de recomendación de productos deben cumplir requisitos de idoneidad y conveniencia. IA no exime de responsabilidad.",
        requiredMeasures: [
          "Documentar que recomendaciones IA cumplen test de idoneidad",
          "Supervisión humana de recomendaciones",
          "Trazabilidad de cada recomendación",
          "Formación específica para personal que usa IA",
          "Revisión periódica de calidad de recomendaciones"
        ]
      },
      {
        regulation: "EBA Guidelines on ML in Credit Risk",
        aiImplications: "Modelos de ML para riesgo crediticio requieren explicabilidad, gobernanza robusta, y validación independiente.",
        requiredMeasures: [
          "Gobernanza de modelos formalizada",
          "Validación independiente de modelos",
          "Documentación de metodología",
          "Monitoreo continuo de rendimiento",
          "Backtesting periódico",
          "Gestión de model risk"
        ]
      },
      {
        regulation: "APDA Andorra (Llei 29/2021)",
        aiImplications: "Equivalente a GDPR con particularidades locales. Aplicable a tratamientos en Andorra.",
        requiredMeasures: [
          "Cumplimiento equivalente a GDPR",
          "Registro ante APDA si aplicable",
          "Delegado de Protección de Datos si requerido",
          "Evaluaciones de impacto para alto riesgo"
        ]
      }
    ],

    competitorAnalysis: [
      {
        competitor: "BBVA",
        aiFeatures: [
          "Blue: análisis de empresas con IA",
          "Bconomy: gestión financiera personal",
          "Asistente virtual en app móvil",
          "Detección de fraude en tiempo real",
          "Recomendaciones personalizadas de productos"
        ],
        differentiationOpportunity: "BBVA invierte fuertemente en IA pero enfocado a gran escala. Oportunidad: especialización en banca comercial de proximidad con IA contextual para gestores."
      },
      {
        competitor: "Santander",
        aiFeatures: [
          "My Money Manager: categorización inteligente",
          "Predicción de gastos",
          "Asistente virtual multicanal",
          "Scoring crediticio con ML",
          "Detección de anomalías"
        ],
        differentiationOpportunity: "Santander globalizado pierde proximidad. Oportunidad: IA que potencie relación gestor-cliente vs. sustitución por bots."
      },
      {
        competitor: "CaixaBank",
        aiFeatures: [
          "ImaginBank: banca 100% digital",
          "Personalización de ofertas",
          "Análisis predictivo de comportamiento",
          "Chatbot avanzado",
          "Gestión de patrimonios con IA"
        ],
        differentiationOpportunity: "CaixaBank fuerte en digital masivo. Oportunidad: nicho de empresas y banca privada con herramientas IA especializadas."
      },
      {
        competitor: "N26 / Revolut",
        aiFeatures: [
          "Categorización automática de gastos",
          "Alertas inteligentes de gastos",
          "Ahorro automático basado en comportamiento",
          "Límites dinámicos",
          "Detección de fraude ML"
        ],
        differentiationOpportunity: "Neobancos sin atención personal. Oportunidad: combinar lo mejor de digital con relación humana potenciada por IA."
      },
      {
        competitor: "Morabanc / Andbank (Andorra)",
        aiFeatures: [
          "Adopción incipiente de IA",
          "Principalmente digitalización básica",
          "Oportunidad de liderazgo en mercado local"
        ],
        differentiationOpportunity: "MÁXIMA OPORTUNIDAD: Mercado andorrano con adopción IA limitada. Posicionarse como líder en IA bancaria en Andorra."
      }
    ],

    bankingTrends: [
      {
        trend: "Hyper-personalización con IA generativa",
        description: "Uso de LLMs para comunicaciones y ofertas ultra-personalizadas basadas en contexto del cliente.",
        adoptionStatus: "Emergente en banca retail, piloto en varios bancos europeos",
        recommendation: "Implementar para comunicaciones internas (gestores) en fase 1, expandir a cliente con supervisión en fase 2"
      },
      {
        trend: "AI-Assisted Compliance (RegTech)",
        description: "IA para automatizar verificaciones de compliance, KYC, AML con reducción de falsos positivos.",
        adoptionStatus: "Adopción creciente, reguladores favorables con supervisión humana",
        recommendation: "Prioridad alta - Mejora eficiencia de compliance manteniendo cumplimiento"
      },
      {
        trend: "Embedded Finance con IA",
        description: "Integración de servicios financieros en contextos no bancarios, potenciados por IA.",
        adoptionStatus: "Expansión rápida, APIs y open banking facilitadores",
        recommendation: "Evaluar para fase 3 - Oportunidad de nuevos canales"
      },
      {
        trend: "Sustainable Finance AI",
        description: "IA para scoring ESG, evaluación de riesgos climáticos, reporting de sostenibilidad.",
        adoptionStatus: "Regulación creciente (SFDR, Taxonomía EU), adopción obligatoria",
        recommendation: "Incluir en roadmap - Requisito regulatorio próximo"
      },
      {
        trend: "Conversational Banking",
        description: "Interfaces conversacionales como canal principal de interacción bancaria.",
        adoptionStatus: "Maduro en soporte, emergente en operaciones",
        recommendation: "Implementar para soporte interno primero, evaluar para clientes"
      },
      {
        trend: "Predictive Customer Service",
        description: "Anticipar necesidades y problemas del cliente antes de que contacte.",
        adoptionStatus: "Pioneros implementando, diferenciador competitivo",
        recommendation: "Alta prioridad - Mejora experiencia y retención"
      },
      {
        trend: "Low-Code/No-Code AI",
        description: "Democratización de IA con herramientas que no requieren expertise técnico profundo.",
        adoptionStatus: "Crecimiento explosivo, múltiples plataformas maduras",
        recommendation: "Evaluar para empoderar a usuarios de negocio"
      },
      {
        trend: "AI Governance Frameworks",
        description: "Frameworks formales de gobernanza de IA exigidos por reguladores.",
        adoptionStatus: "Obligatorio bajo AI Act, adoptando mejores prácticas",
        recommendation: "Implementar framework desde el inicio - Evita retrofitting costoso"
      },
      {
        trend: "Explainable AI (XAI)",
        description: "IA que puede explicar sus decisiones de forma comprensible para humanos.",
        adoptionStatus: "Mandatorio en UE para decisiones automatizadas que afectan personas",
        recommendation: "Obligatorio - Implementar SHAP/LIME desde diseño de modelos"
      },
      {
        trend: "Federated Learning en Banca",
        description: "Entrenamiento de modelos sin centralizar datos sensibles.",
        adoptionStatus: "Emergente, casos de uso en consorcions bancarios",
        recommendation: "Monitorear para posible adopción en colaboraciones"
      }
    ],

    implementationRoadmap: [
      {
        phase: "Fase 1: Fundamentos (0-6 meses)",
        duration: "6 meses",
        objectives: [
          "Establecer gobernanza de IA",
          "Implementar automatizaciones de bajo riesgo",
          "Desplegar asistente interno para gestores",
          "Configurar infraestructura de IA (pgvector, n8n)"
        ],
        deliverables: [
          "Política de uso de IA aprobada por dirección",
          "n8n self-hosted operativo",
          "RAG básico para documentación interna",
          "Resumen automático de fichas de visita",
          "Framework de evaluación de riesgos IA"
        ]
      },
      {
        phase: "Fase 2: Expansión Controlada (6-12 meses)",
        duration: "6 meses",
        objectives: [
          "Implementar RAG para análisis financiero",
          "Desplegar modelos predictivos con XAI",
          "Automatizar procesos de compliance"
        ],
        deliverables: [
          "Sistema RAG para estados financieros",
          "Modelo de predicción de churn con SHAP",
          "Automatización de checks de compliance",
          "Dashboard de BI aumentada",
          "OCR inteligente para documentos"
        ]
      },
      {
        phase: "Fase 3: Diferenciación (12-18 meses)",
        duration: "6 meses",
        objectives: [
          "Implementar recomendaciones de productos",
          "Desplegar detección de anomalías avanzada",
          "Evaluar servicios para cliente final"
        ],
        deliverables: [
          "Sistema Next Best Action (supervisado)",
          "Detección de anomalías financieras",
          "Asistente de compliance con RAG",
          "Piloto de servicios IA para clientes selectos"
        ]
      },
      {
        phase: "Fase 4: Liderazgo (18-24 meses)",
        duration: "6 meses",
        objectives: [
          "Consolidar posición como líder en IA bancaria",
          "Expandir a nuevos casos de uso",
          "Preparar para regulaciones futuras"
        ],
        deliverables: [
          "Portfolio completo de servicios IA",
          "Métricas de ROI documentadas",
          "Caso de éxito publicable",
          "Framework escalable para nuevos módulos",
          "Certificaciones de cumplimiento IA"
        ]
      }
    ]
  };
}
