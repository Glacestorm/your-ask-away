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

async function getContextData(supabase: any, contextType: string, userQuery: string): Promise<string> {
  let contextData = '';
  
  try {
    if (contextType === 'clients') {
      // Search companies based on query
      const { data: companies } = await supabase
        .from('companies')
        .select('name, sector, address, phone, email, cnae, facturacion_anual, client_type')
        .textSearch('name', userQuery.split(' ').slice(0, 3).join(' & '), { type: 'websearch' })
        .limit(5);
      
      if (companies && companies.length > 0) {
        contextData = `\n\nDATOS DE CLIENTES ENCONTRADOS:\n${JSON.stringify(companies, null, 2)}`;
      }
    } else if (contextType === 'products') {
      const { data: products } = await supabase
        .from('products')
        .select('name, description, category, active')
        .eq('active', true)
        .limit(20);
      
      if (products && products.length > 0) {
        contextData = `\n\nPRODUCTOS BANCARIOS DISPONIBLES:\n${JSON.stringify(products, null, 2)}`;
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

    // Get context-specific data from database
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const contextData = lastUserMessage ? await getContextData(supabase, contextType, lastUserMessage.content) : '';

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

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
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

    console.log(`[Internal Assistant] Response generated. Sensitive: ${flagForReview}`);

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        isSensitive: flagForReview,
        requiresReview: flagForReview,
        sources: extractSources(assistantMessage),
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

FORMATO DE RESPUESTA:
- Sé conciso y directo
- Usa viñetas cuando sea apropiado
- Cita normativas específicas cuando aplique
- Indica siempre si la información requiere verificación adicional
- Responde en el mismo idioma que la pregunta del usuario`;

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
