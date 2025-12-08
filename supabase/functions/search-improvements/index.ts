import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImprovementSuggestion {
  category: string;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  effort: string;
  impact: string;
  source: string;
  relatedTechnologies: string[];
  implementationSteps: string[];
}

interface TechnologyTrend {
  name: string;
  relevance: string;
  adoptionRate: string;
  recommendation: string;
  integrationPotential: string;
}

interface ImprovementsAnalysis {
  generationDate: string;
  improvements: ImprovementSuggestion[];
  technologyTrends: TechnologyTrend[];
  securityUpdates: string[];
  performanceOptimizations: string[];
  uxEnhancements: string[];
  aiIntegrations: string[];
  complianceUpdates: string[];
  summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentModules, currentTechnologies, industryFocus } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en desarrollo de software y arquitectura de sistemas, especializado en aplicaciones bancarias y fintech. Tu conocimiento está actualizado a diciembre 2024.

Tu tarea es proporcionar sugerencias de mejoras actualizadas basándote en:
- Las últimas tendencias en desarrollo web (React 19, Vite 6, TypeScript 5.5+)
- Novedades en frameworks UI (Tailwind CSS 4, shadcn/ui, Radix)
- Mejores prácticas de seguridad bancaria (OWASP 2024, DORA, PSD3)
- Optimizaciones de rendimiento (Core Web Vitals, streaming SSR)
- IA/ML para banca (LLMs, embeddings, RAG)
- Compliance europeo (GDPR, NIS2, eIDAS 2.0)
- APIs y estándares abiertos (Open Banking, PSD2/PSD3)
- DevOps y CI/CD modernos

IMPORTANTE: Responde SOLO con JSON válido sin markdown ni comentarios.`;

    const userPrompt = `Analiza esta aplicación CRM bancaria y sugiere mejoras:

MÓDULOS ACTUALES: ${JSON.stringify(currentModules || [])}
TECNOLOGÍAS: ${JSON.stringify(currentTechnologies || ['React', 'TypeScript', 'Supabase', 'Tailwind CSS', 'MapLibre GL'])}
FOCO: ${industryFocus || 'Banca comercial y gestión de cartera empresarial'}

Genera un análisis JSON con:
1. improvements: Array de mejoras sugeridas con:
   - category: (ux|performance|security|ai|compliance|integrations|devops)
   - title, description, priority (alta/media/baja), effort, impact
   - source: fuente o estándar que lo respalda
   - relatedTechnologies, implementationSteps

2. technologyTrends: Tendencias tecnológicas relevantes para adoptar

3. securityUpdates: Actualizaciones de seguridad recomendadas

4. performanceOptimizations: Optimizaciones de rendimiento específicas

5. uxEnhancements: Mejoras de experiencia de usuario

6. aiIntegrations: Posibles integraciones con IA

7. complianceUpdates: Actualizaciones de normativas

8. summary: Resumen ejecutivo de 2-3 párrafos

Prioriza mejoras específicas para banca andorrana/española con valor de negocio claro.`;

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
        max_tokens: 8000,
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
    
    let analysis: ImprovementsAnalysis;
    try {
      analysis = JSON.parse(content);
      analysis.generationDate = new Date().toISOString();
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      analysis = getDefaultImprovements();
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("search-improvements error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDefaultImprovements(): ImprovementsAnalysis {
  return {
    generationDate: new Date().toISOString(),
    improvements: [
      {
        category: "ai",
        title: "Implementar RAG para documentos financieros",
        description: "Añadir sistema de Retrieval-Augmented Generation para analizar y responder preguntas sobre documentos financieros de empresas.",
        priority: "alta",
        effort: "2-3 semanas",
        impact: "Reduce tiempo de análisis en 50%",
        source: "Tendencias FinTech 2024 - McKinsey",
        relatedTechnologies: ["LangChain", "OpenAI Embeddings", "Supabase pgvector"],
        implementationSteps: [
          "Habilitar extensión pgvector en Supabase",
          "Crear embeddings de documentos existentes",
          "Implementar búsqueda semántica",
          "Añadir interfaz de chat contextual"
        ]
      },
      {
        category: "security",
        title: "Implementar autenticación passwordless",
        description: "Añadir WebAuthn/Passkeys para autenticación sin contraseña, mejorando seguridad y UX.",
        priority: "alta",
        effort: "1-2 semanas",
        impact: "Elimina 80% de ataques de phishing",
        source: "FIDO Alliance / WebAuthn Level 2",
        relatedTechnologies: ["WebAuthn", "Supabase Auth", "Passkeys"],
        implementationSteps: [
          "Configurar Supabase Auth con WebAuthn",
          "Crear flujo de registro de passkeys",
          "Implementar fallback a OTP",
          "Testing multi-dispositivo"
        ]
      },
      {
        category: "performance",
        title: "Implementar React Server Components parciales",
        description: "Usar streaming SSR para componentes pesados como dashboards y reportes.",
        priority: "media",
        effort: "2-4 semanas",
        impact: "Mejora LCP en 40%",
        source: "React 19 / Next.js 14 best practices",
        relatedTechnologies: ["React 19", "Suspense", "use() hook"],
        implementationSteps: [
          "Identificar componentes candidatos",
          "Refactorizar con Suspense boundaries",
          "Implementar skeleton loaders",
          "Optimizar bundle splitting"
        ]
      },
      {
        category: "compliance",
        title: "Preparación para DORA (2025)",
        description: "Implementar controles de resiliencia operativa digital según regulación UE.",
        priority: "alta",
        effort: "4-6 semanas",
        impact: "Cumplimiento obligatorio enero 2025",
        source: "Digital Operational Resilience Act (EU 2022/2554)",
        relatedTechnologies: ["Monitoreo", "Backup", "Incident Response"],
        implementationSteps: [
          "Mapear activos TIC críticos",
          "Implementar gestión de incidentes",
          "Documentar planes de continuidad",
          "Configurar reporting a autoridades"
        ]
      },
      {
        category: "integrations",
        title: "Open Banking API (PSD2/PSD3)",
        description: "Exponer APIs estándar para integración con terceros según normativa europea.",
        priority: "media",
        effort: "4-8 semanas",
        impact: "Habilita ecosistema de partners",
        source: "PSD3 Directive (propuesta 2023)",
        relatedTechnologies: ["OpenAPI 3.1", "OAuth 2.0", "JSON:API"],
        implementationSteps: [
          "Diseñar schema OpenAPI",
          "Implementar OAuth 2.0 server",
          "Crear sandbox para desarrolladores",
          "Documentar con Swagger UI"
        ]
      },
      {
        category: "ux",
        title: "Modo offline con sincronización",
        description: "Permitir trabajo sin conexión para gestores comerciales en visitas.",
        priority: "alta",
        effort: "3-4 semanas",
        impact: "Productividad +30% en campo",
        source: "PWA Best Practices 2024",
        relatedTechnologies: ["Service Worker", "IndexedDB", "Background Sync"],
        implementationSteps: [
          "Implementar Service Worker",
          "Caché de datos críticos en IndexedDB",
          "Cola de operaciones offline",
          "Sincronización inteligente al reconectar"
        ]
      }
    ],
    technologyTrends: [
      {
        name: "React 19 con Server Components",
        relevance: "Mejora rendimiento y DX significativamente",
        adoptionRate: "Adopción creciente en enterprise",
        recommendation: "Evaluar migración gradual",
        integrationPotential: "Alto - compatible con Vite"
      },
      {
        name: "Supabase Edge Functions con Deno 2",
        relevance: "Mejor rendimiento y compatibilidad npm",
        adoptionRate: "Disponible en producción",
        recommendation: "Actualizar funciones existentes",
        integrationPotential: "Inmediato - sin breaking changes"
      },
      {
        name: "Tailwind CSS 4 con Oxide engine",
        relevance: "Build 10x más rápido",
        adoptionRate: "Beta disponible",
        recommendation: "Esperar release estable Q1 2025",
        integrationPotential: "Alto - migración automática"
      },
      {
        name: "AI Agents para automatización",
        relevance: "Automatizar tareas repetitivas bancarias",
        adoptionRate: "Emergente en fintech",
        recommendation: "Piloto en análisis crediticio",
        integrationPotential: "Medio - requiere evaluación"
      }
    ],
    securityUpdates: [
      "Actualizar a TLS 1.3 exclusivo (deprecar 1.2)",
      "Implementar CSP Level 3 con nonces",
      "Añadir HSTS preloading",
      "Configurar Trusted Types para prevención XSS",
      "Implementar SRI para scripts externos",
      "Evaluar migración a Ed25519 para JWT"
    ],
    performanceOptimizations: [
      "Implementar Partytown para third-party scripts",
      "Usar View Transitions API para navegación",
      "Optimizar imágenes con AVIF/WebP",
      "Implementar Speculation Rules API para prefetch",
      "Reducir JavaScript con tree-shaking agresivo",
      "Usar HTTP/3 cuando disponible"
    ],
    uxEnhancements: [
      "Añadir comandos de voz para navegación (Web Speech API)",
      "Implementar gestos táctiles avanzados en mapas",
      "Mejorar accesibilidad WCAG 2.2 AA",
      "Añadir tema high-contrast para baja visión",
      "Implementar atajos de teclado globales",
      "Añadir feedback háptico en móvil"
    ],
    aiIntegrations: [
      "Asistente conversacional para análisis financiero",
      "Scoring crediticio automático con explicabilidad",
      "Detección de anomalías en transacciones",
      "Recomendaciones de productos personalizadas",
      "Resumen automático de fichas de visita",
      "Predicción de churn de clientes"
    ],
    complianceUpdates: [
      "DORA: Resiliencia operativa digital obligatoria enero 2025",
      "NIS2: Amplía sectores regulados incluyendo banca",
      "eIDAS 2.0: Wallet de identidad digital europeo",
      "AI Act: Clasificación de sistemas IA de alto riesgo",
      "PSD3: Propuesta actualización servicios de pago",
      "GDPR actualizaciones: Transferencias internacionales post-Schrems II"
    ],
    summary: "La aplicación tiene una base sólida pero puede beneficiarse significativamente de mejoras en tres áreas clave: (1) Inteligencia Artificial para automatizar análisis y mejorar productividad de gestores, (2) Seguridad avanzada con autenticación passwordless y preparación DORA, y (3) Rendimiento con tecnologías modernas como React 19 y optimizaciones de Core Web Vitals.\n\nLas prioridades inmediatas deberían ser la preparación para DORA (obligatorio enero 2025), implementación de modo offline para gestores comerciales, y la integración de IA para análisis de documentos financieros. Estas mejoras proporcionarán el mayor ROI y diferenciación competitiva en el mercado bancario andorrano y español.\n\nA medio plazo, se recomienda evaluar Open Banking APIs para habilitar ecosistema de partners y considerar migración gradual a React 19 para beneficiarse de Server Components cuando madure el ecosistema."
  };
}
