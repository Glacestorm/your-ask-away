import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  conversationId?: string;
  userId: string;
  userRole: string;
  contextType: string;
  userOffice?: string;
}

const SENSITIVE_KEYWORDS = [
  'contraseña', 'password', 'pin', 'clave secreta',
  'número de cuenta', 'account number', 'iban',
  'fraude', 'fraud', 'blanqueo', 'money laundering',
  'saldo', 'balance', 'transferencia', 'transfer'
];

function detectSensitiveContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// ObelixIA Help Knowledge Base - Full system documentation
const OBELIXIA_HELP_KNOWLEDGE = `
## SOBRE OBELIXIA

ObelixIA es un CRM Bancario Inteligente diseñado específicamente para la gestión de carteras de clientes empresariales en entidades financieras. Combina tecnologías de vanguardia con cumplimiento normativo europeo.

### ARQUITECTURA DE SOFTWARE
- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS + Shadcn/UI
- **Estado**: TanStack Query (Caché inteligente)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **IA**: Lovable AI Gateway (Gemini 2.5 Flash/Pro)
- **Mapas**: MapLibre GL + OpenStreetMap + Supercluster

### SEGURIDAD IMPLEMENTADA
- Autenticación WebAuthn/FIDO2 (Passkeys)
- MFA obligatorio para administradores
- Cifrado AES-256-GCM para datos sensibles
- RLS (Row-Level Security) en base de datos
- Audit logging completo
- Biometría comportamental (PSD3)
- Detección AML/Fraude contextual

### MÓDULOS PRINCIPALES

1. **Mapa GIS Empresarial** (100% compliant)
   - Clustering dinámico para 20,000+ empresas
   - Capas: OSM, Satélite, 3D
   - Coloración por estado, vinculación, P&L, visitas
   - Planificación de rutas optimizadas

2. **Gestión de Empresas** (100% compliant)
   - Datos de empresa (CIF, CNAE, dirección)
   - Contactos múltiples, documentos, fotos
   - Afiliaciones bancarias y TPVs

3. **Fichas de Visita** (100% compliant - MiFID II, PSD2)
   - 12 secciones: diagnóstico, necesidades, propuesta valor
   - Firma digital y resumen IA automático

4. **Pipeline Oportunidades** (100% compliant)
   - Tablero Kanban drag-and-drop
   - Estados: Lead, Cualificado, Propuesta, Negociación

5. **Módulo Contable** (100% compliant - IFRS 9, Basel III)
   - Balance, cuenta resultados, flujos efectivo
   - Importación PDF con OCR inteligente
   - Chat RAG financiero con IA

6. **Objetivos y Metas** (100% compliant)
   - Seguimiento en tiempo real
   - Alertas de objetivos en riesgo

7. **Análisis RFM + ML** (100% compliant - AI Act)
   - Segmentos: Champions, Loyal, At Risk, Lost
   - Predicción de churn y CLV

8. **DORA/NIS2 Compliance** (100% compliant)
   - Gestión de incidentes, tests resiliencia
   - Simulaciones de estrés automatizadas

9. **Asistente IA Interno** (100% compliant - AI Act, GDPR)
   - Consultas por texto y voz
   - Base de conocimiento actualizable

10. **Sistema de Notificaciones** (100% compliant)
    - 8 canales predefinidos
    - Webhooks para integraciones

### ESTADO DE CUMPLIMIENTO NORMATIVO
- ISO 27001: 95% (108/114 controles)
- GDPR/RGPD: 100%
- DORA: 100%
- NIS2: 100%
- PSD2/PSD3: 100%
- eIDAS 2.0: 90%
- OWASP Top 10: 100%
- Basel III/IV: 100%
- MiFID II: 100%
- APDA Andorra: 100%
- AI Act (EU): 92%

### MENÚS POR ROL

**Director Comercial**: Dashboard Unificado, Métricas por Gestor/Oficina, Objetivos Globales, Pipeline, Análisis RFM/ML, Administración Completa

**Director de Oficina**: Dashboard Oficina, Métricas de Gestores, Objetivos por Gestor, Calendario Oficina, Auditoría de Gestores

**Responsable Comercial**: Dashboard Comercial, Seguimiento Equipos, Objetivos Comerciales, Pipeline, Análisis RFM, Administración

**Gestor**: Mi Dashboard, Mis Empresas, Mapa Cartera, Fichas de Visita, Mis Objetivos, Calendario Personal

**Auditor**: Dashboard Auditoría, Logs de Auditoría, Fichas de Visita (solo lectura), Informes KPI, Normativa

### PREGUNTAS FRECUENTES

**¿Cómo veo mis empresas?** - Accede al Mapa desde el menú lateral o desde la tarjeta "Mapa" en tu dashboard.

**¿Cómo registro una visita?** - Desde dashboard pulsa "Crear Ficha" o Visitas > Nueva Ficha. Completa las 12 secciones.

**¿Puedo trabajar offline?** - Sí, ObelixIA tiene capacidad offline. Los cambios se sincronizan al reconectar.

**¿Qué significan los colores del mapa?** - Dependen del modo: Estado (verde=activo), Vinculación (gradiente %), P&L (verde=beneficios), Visitas (frecuencia).

**¿Cómo importo datos contables?** - En Contabilidad, selecciona empresa y ejercicio. Usa "Importar PDF" para extracción automática por IA.

**¿Quién puede ver mis datos?** - Gestores solo ven sus empresas. Directores ven su oficina o global según rol. Auditores tienen solo lectura.

**¿Cómo funciona el análisis RFM?** - Clasifica clientes por Recencia, Frecuencia y valor Monetario en grupos como Champions, Loyal, At Risk.

**¿Cómo se garantiza la seguridad?** - Cifrado AES-256, WebAuthn/Passkeys, MFA obligatorio, RLS, audit logging, cumplimiento GDPR/DORA/ISO27001.
`;

async function getContextData(supabase: any, contextType: string, userQuery: string, userId?: string): Promise<string> {
  let contextData = '';
  
  // Always include ObelixIA help knowledge for system-related queries
  const helpKeywords = ['obelixia', 'ayuda', 'help', 'módulo', 'función', 'cómo', 'qué es', 'para qué', 'normativa', 'cumplimiento', 'compliance', 'seguridad', 'menú', 'rol'];
  const complianceKeywords = ['normativa', 'compliance', 'documento', 'firma', 'firmar', 'pendiente', 'regulación', 'protocolo', 'procedimiento', 'interno', 'oficial', 'gdpr', 'dora', 'nis2', 'iso', 'mifid', 'psd'];
  const queryLower = userQuery.toLowerCase();
  const isHelpQuery = helpKeywords.some(kw => queryLower.includes(kw));
  const isComplianceQuery = complianceKeywords.some(kw => queryLower.includes(kw));
  
  if (isHelpQuery) {
    contextData += '\n\nCONOCIMIENTO DEL SISTEMA OBELIXIA:\n' + OBELIXIA_HELP_KNOWLEDGE;
  }
  
  try {
    if (contextType === 'clients') {
      const { data: companies } = await supabase
        .from('companies')
        .select('name, sector, address, phone, email, cnae, facturacion_anual, client_type')
        .textSearch('name', userQuery.split(' ').slice(0, 3).join(' & '), { type: 'websearch' })
        .limit(5);
      
      if (companies && companies.length > 0) {
        contextData += `\n\nDATOS DE CLIENTES ENCONTRADOS:\n${JSON.stringify(companies, null, 2)}`;
      }
    } else if (contextType === 'products') {
      const { data: products } = await supabase
        .from('products')
        .select('name, description, category, active')
        .eq('active', true)
        .limit(20);
      
      if (products && products.length > 0) {
        contextData += `\n\nPRODUCTOS BANCARIOS DISPONIBLES:\n${JSON.stringify(products, null, 2)}`;
      }
    }
    
    // FASE 6: Compliance Integration - Query compliance documents
    if (contextType === 'regulations' || isComplianceQuery) {
      // Get user's sector from profile
      let userSector = null;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('sector')
          .eq('id', userId)
          .single();
        userSector = profile?.sector;
      }

      // Query official regulations for user's sector
      const regulationsQuery = supabase
        .from('organization_compliance_documents')
        .select('id, title, description, document_type, sector, regulation_source, effective_date, is_mandatory, status')
        .eq('status', 'active')
        .limit(15);
      
      if (userSector) {
        regulationsQuery.eq('sector', userSector);
      }
      
      const { data: officialDocs } = await regulationsQuery;
      
      if (officialDocs && officialDocs.length > 0) {
        const officialRegs = officialDocs.filter((d: any) => d.document_type === 'official_regulation');
        const internalDocs = officialDocs.filter((d: any) => d.document_type !== 'official_regulation');
        
        if (officialRegs.length > 0) {
          contextData += `\n\nNORMATIVAS OFICIALES DEL SECTOR:\n${officialRegs.map((d: any) => 
            `- ${d.title} (${d.regulation_source || 'BOE/DOUE'})${d.is_mandatory ? ' [OBLIGATORIA]' : ''}: ${d.description || 'Sin descripción'}`
          ).join('\n')}`;
        }
        
        if (internalDocs.length > 0) {
          contextData += `\n\nDOCUMENTOS INTERNOS DE LA ORGANIZACIÓN:\n${internalDocs.map((d: any) => 
            `- ${d.title}: ${d.description || 'Sin descripción'}`
          ).join('\n')}`;
        }
      }

      // Query sector regulations
      const { data: sectorRegs } = await supabase
        .from('sector_regulations')
        .select('regulation_name, regulation_code, sector, description, mandatory, compliance_deadline')
        .eq('is_active', true)
        .limit(10);

      if (sectorRegs && sectorRegs.length > 0) {
        contextData += `\n\nREGULACIONES SECTORIALES:\n${sectorRegs.map((r: any) => 
          `- ${r.regulation_name} (${r.regulation_code}): ${r.description || ''} ${r.mandatory ? '[OBLIGATORIA]' : ''}`
        ).join('\n')}`;
      }

      // Check for pending acknowledgments for the user
      if (userId) {
        const { data: pendingAcks } = await supabase
          .from('organization_compliance_documents')
          .select(`
            id, title, acknowledgment_deadline,
            compliance_acknowledgments!left(id, employee_id)
          `)
          .eq('requires_acknowledgment', true)
          .eq('status', 'active')
          .is('compliance_acknowledgments.employee_id', null);

        // Re-query to get documents not acknowledged by this user
        const { data: allDocsRequiringAck } = await supabase
          .from('organization_compliance_documents')
          .select('id, title, acknowledgment_deadline')
          .eq('requires_acknowledgment', true)
          .eq('status', 'active');

        if (allDocsRequiringAck && allDocsRequiringAck.length > 0) {
          const { data: userAcks } = await supabase
            .from('compliance_acknowledgments')
            .select('document_id')
            .eq('employee_id', userId);

          const acknowledgedIds = new Set((userAcks || []).map((a: any) => a.document_id));
          const pendingDocs = allDocsRequiringAck.filter((d: any) => !acknowledgedIds.has(d.id));

          if (pendingDocs.length > 0) {
            contextData += `\n\n⚠️ DOCUMENTOS PENDIENTES DE FIRMA (${pendingDocs.length}):\n${pendingDocs.map((d: any) => 
              `- ${d.title}${d.acknowledgment_deadline ? ` (Vence: ${new Date(d.acknowledgment_deadline).toLocaleDateString('es-ES')})` : ''}`
            ).join('\n')}`;
            contextData += `\n\n📝 IMPORTANTE: Tienes ${pendingDocs.length} documento(s) pendiente(s) de firma. Puedes acceder a ellos desde el panel de Compliance en Administración.`;
          } else {
            contextData += `\n\n✅ No tienes documentos pendientes de firma.`;
          }
        }
      }

      // Query compliance requirements status
      if (userId) {
        const { data: requirements } = await supabase
          .from('compliance_requirements')
          .select('requirement_title, status, priority, due_date')
          .in('status', ['pending', 'in_progress', 'non_compliant'])
          .limit(10);

        if (requirements && requirements.length > 0) {
          const critical = requirements.filter((r: any) => r.status === 'non_compliant' || r.priority === 'critical');
          if (critical.length > 0) {
            contextData += `\n\n🚨 REQUISITOS CRÍTICOS DE COMPLIANCE:\n${critical.map((r: any) => 
              `- ${r.requirement_title} [${r.status.toUpperCase()}]${r.due_date ? ` - Vence: ${new Date(r.due_date).toLocaleDateString('es-ES')}` : ''}`
            ).join('\n')}`;
          }
        }
      }
    }
    
    // Get knowledge documents for the context type
    const docType = contextType === 'internal_forms' ? 'formularios_internos' : 
                   contextType === 'client_forms' ? 'formularios_clientes' :
                   contextType === 'regulations' ? 'normativas' :
                   contextType === 'procedures' ? 'procedimientos' :
                   contextType === 'products' ? 'productos' : null;
    
    if (docType) {
      const { data: docs } = await supabase
        .from('assistant_knowledge_documents')
        .select('title, description, content')
        .eq('document_type', docType)
        .eq('is_active', true)
        .limit(5);
      
      if (docs && docs.length > 0) {
        contextData += `\n\nDOCUMENTACIÓN RELEVANTE:\n${docs.map((d: any) => `- ${d.title}: ${d.content || d.description || ''}`).join('\n')}`;
      }
    }
  } catch (error) {
    console.error('Error fetching context data:', error);
  }
  
  return contextData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId, userRole, contextType, userOffice } = await req.json() as RequestBody;

    if (!userId || !userRole) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Internal Assistant] User: ${userId}, Role: ${userRole}, Context: ${contextType}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get context-specific data from database (including compliance - FASE 6)
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const contextData = lastUserMessage ? await getContextData(supabase, contextType, lastUserMessage.content, userId) : '';

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(userRole, contextType, userOffice) + contextData;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const isSensitive = lastUserMessage ? detectSensitiveContent(lastUserMessage.content) : false;

    // Call Lovable AI API (Gemini)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        max_tokens: 4000,
        temperature: 0.3, // Lower temperature for more consistent responses
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Internal Assistant] AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const assistantMessage = aiResult.choices?.[0]?.message?.content || 
      'Lo siento, no he podido procesar tu consulta. Por favor, inténtalo de nuevo.';

    // Check if response contains sensitive content
    const responseSensitive = detectSensitiveContent(assistantMessage);
    const flagForReview = isSensitive || responseSensitive;

    // Detect if the AI couldn't answer and should save as suggestion
    const cannotAnswerPatterns = [
      'no tengo información',
      'no puedo encontrar',
      'no está disponible',
      'no tengo acceso',
      'fuera de mi alcance',
      'no implementado',
      'no existe actualmente',
      'no tengo datos',
      'no puedo ayudarte con eso',
      'esa funcionalidad no está',
      'no he encontrado',
      'desconozco',
      'no tengo conocimiento'
    ];

    const lowerResponse = assistantMessage.toLowerCase();
    const couldNotAnswer = cannotAnswerPatterns.some(pattern => lowerResponse.includes(pattern));

    // If couldn't answer, save as potential suggestion
    if (couldNotAnswer && lastUserMessage) {
      try {
        await supabase
          .from('user_suggestions')
          .insert({
            user_id: userId,
            suggestion_text: lastUserMessage.content,
            source: 'ai_detected',
            context: contextType,
            ai_response: assistantMessage.substring(0, 500),
            status: 'pending',
            priority: 'medium',
            category: 'feature'
          });
        console.log('[Internal Assistant] Saved unanswered query as suggestion');
      } catch (suggestionError) {
        console.error('[Internal Assistant] Error saving suggestion:', suggestionError);
      }
    }

    console.log(`[Internal Assistant] Response generated. Sensitive: ${flagForReview}, CouldNotAnswer: ${couldNotAnswer}`);

    // Add proactive suggestion prompt if couldn't fully answer
    let finalMessage = assistantMessage;
    if (couldNotAnswer) {
      finalMessage += '\n\n💡 **¿Te gustaría que esta funcionalidad estuviera disponible?** Tu consulta ha sido guardada automáticamente como sugerencia. Puedes ver todas las sugerencias y votar por las que más te interesen en el menú de Ayuda → Buzón de Sugerencias.';
    }

    return new Response(
      JSON.stringify({
        message: finalMessage,
        isSensitive: flagForReview,
        requiresReview: flagForReview,
        sources: extractSources(assistantMessage),
        savedAsSuggestion: couldNotAnswer,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[Internal Assistant] Error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          error: 'La solicitud ha tardado demasiado. Por favor, intenta con una pregunta más específica.' 
        }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Error interno del asistente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(userRole: string, contextType: string, userOffice?: string): string {
  const basePrompt = `Eres un asistente interno de ObelixIA, un CRM bancario inteligente. Tu rol es ayudar a los gestores comerciales a buscar información sobre:
- Clientes y empresas de su cartera
- Normativas bancarias (Andorra, España, Europa)
- Productos y servicios bancarios
- Procedimientos internos
- CUMPLIMIENTO NORMATIVO: documentos oficiales del sector, documentos internos, firmas pendientes
- INFORMACIÓN SOBRE OBELIXIA: arquitectura, módulos, funcionalidades, cumplimiento normativo, menús por rol, FAQs

CAPACIDAD ESPECIAL - COMPLIANCE Y NORMATIVAS (FASE 6):
Tienes acceso completo a:
- Normativas oficiales del sector del usuario (BOE, DOUE)
- Documentos internos de la organización
- Estado de firmas y reconocimientos pendientes
- Requisitos de compliance y su estado actual
Cuando el usuario pregunte sobre normativas, documentos, firmas pendientes o compliance:
1. Consulta el contexto proporcionado con datos reales de la base de datos
2. Indica claramente qué documentos tiene pendientes de firma
3. Explica los requisitos de cada normativa aplicable
4. Advierte sobre deadlines próximos

CAPACIDAD ESPECIAL - CONOCIMIENTO DEL SISTEMA:
Tienes acceso completo a la documentación de ObelixIA incluyendo:
- Arquitectura de software y hardware
- Todos los módulos y sus funcionalidades
- Estado de cumplimiento de cada normativa (ISO 27001, GDPR, DORA, NIS2, etc.)
- Estructura de menús por rol de usuario
- Preguntas frecuentes y respuestas
Cuando el usuario pregunte sobre ObelixIA, cómo funciona, qué hace, módulos, normativas, etc., usa el conocimiento del sistema proporcionado en el contexto.

REGLAS DE SEGURIDAD Y COMPLIANCE:
1. NUNCA proporciones datos personales sensibles (DNI, números de cuenta completos, contraseñas)
2. NUNCA tomes decisiones autónomas - solo proporciona información y recomendaciones
3. Las respuestas deben basarse ÚNICAMENTE en documentación oficial y políticas internas
4. Si no tienes información verificada, indícalo claramente
5. Mantén un registro de todas las consultas para auditoría
6. Las respuestas sobre operaciones financieras deben incluir advertencias de verificación humana

CONTEXTO DEL USUARIO:
- Rol: ${userRole}
- Oficina: ${userOffice || 'No especificada'}
- Tipo de consulta: ${contextType}

NORMATIVAS APLICABLES:
- GDPR/RGPD: Protección de datos personales
- APDA (Llei 29/2021): Protección de datos de Andorra
- PSD2/PSD3: Servicios de pago
- MiFID II: Mercados financieros
- Basel III/IV: Requisitos de capital
- DORA: Resiliencia operativa digital
- ISO 27001: Sistema de gestión de seguridad
- AI Act: Regulación europea de IA

FORMATO DE RESPUESTA:
- Sé conciso y directo
- Usa viñetas cuando sea apropiado
- Cita normativas específicas cuando aplique
- Indica siempre si la información requiere verificación adicional
- Responde en el mismo idioma que la pregunta del usuario
- Cuando expliques funcionalidades de ObelixIA, sé detallado y preciso
- Si hay documentos pendientes de firma, SIEMPRE menciónalos al inicio de la respuesta`;

  const roleSpecificContext = getRoleContext(userRole);
  
  return basePrompt + '\n\n' + roleSpecificContext;
}

function getRoleContext(role: string): string {
  const contexts: Record<string, string> = {
    'gestor': `ACCESO DE GESTOR:
- Puedes ver información de clientes de tu cartera asignada
- No tienes acceso a datos de otros gestores
- Consultas de productos y procedimientos estándar`,
    
    'director_oficina': `ACCESO DE DIRECTOR DE OFICINA:
- Puedes ver información de todos los gestores de tu oficina
- Acceso a métricas agregadas de la oficina
- Consultas de gestión y supervisión`,
    
    'director_comercial': `ACCESO DE DIRECTOR COMERCIAL:
- Acceso a información global del banco
- Métricas y KPIs de todas las oficinas
- Consultas estratégicas y de cumplimiento`,
    
    'responsable_comercial': `ACCESO DE RESPONSABLE COMERCIAL:
- Acceso completo a información comercial
- Supervisión de todos los equipos
- Consultas de rendimiento y objetivos`,
    
    'superadmin': `ACCESO DE ADMINISTRADOR:
- Acceso completo al sistema
- Configuración y administración
- Consultas técnicas y de seguridad`,
  };

  return contexts[role] || contexts['gestor'];
}

function extractSources(response: string): string[] {
  const sources: string[] = [];
  
  // Extract normative references
  const normativePatterns = [
    /GDPR|RGPD/gi,
    /PSD[23]/gi,
    /MiFID\s*II?/gi,
    /Basel\s*III?I?V?/gi,
    /DORA/gi,
    /APDA/gi,
    /Llei\s+\d+\/\d+/gi,
    /Circular\s+BE\s+\d+\/\d+/gi,
  ];

  for (const pattern of normativePatterns) {
    const matches = response.match(pattern);
    if (matches) {
      sources.push(...matches.map(m => m.toUpperCase()));
    }
  }

  return [...new Set(sources)]; // Remove duplicates
}
