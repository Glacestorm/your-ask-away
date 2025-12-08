import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// OWASP API Security Top 10 Implementation
import {
  SECURITY_HEADERS,
  handleOptionsRequest,
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize,
  safeExternalAPICall,
  logSecurityEvent,
  validateAuthentication,
  checkFunctionAuthorization,
  protectBusinessFlow,
  sanitizeInput,
  DEFAULT_PAYLOAD_LIMITS
} from "../_shared/owasp-security.ts";

const balanceSheetFields = [
  { field: 'intangible_assets', label: 'Immobilitzat intangible', keywords: ['immobilitzat intangible', 'activos intangibles'] },
  { field: 'tangible_assets', label: 'Immobilitzat material', keywords: ['immobilitzat material', 'inmovilizado material'] },
  { field: 'inventory', label: 'Existències', keywords: ['existències', 'existencias', 'inventory'] },
  { field: 'trade_receivables', label: 'Deutors comercials', keywords: ['deutors comercials', 'clientes'] },
  { field: 'cash_equivalents', label: 'Efectiu i equivalents', keywords: ['efectiu', 'caixa', 'efectivo'] },
  { field: 'share_capital', label: 'Capital social', keywords: ['capital social'] },
  { field: 'legal_reserve', label: 'Reserva legal', keywords: ['reserva legal'] },
  { field: 'retained_earnings', label: 'Resultats d\'exercicis anteriors', keywords: ['resultats exercicis anteriors'] },
  { field: 'current_year_result', label: 'Resultat de l\'exercici', keywords: ['resultat exercici'] },
  { field: 'long_term_debts', label: 'Deutes a llarg termini', keywords: ['deutes llarg termini'] },
  { field: 'short_term_debts', label: 'Deutes a curt termini', keywords: ['deutes curt termini'] },
  { field: 'trade_payables', label: 'Creditors comercials', keywords: ['creditors comercials', 'proveedores'] },
];

const incomeStatementFields = [
  { field: 'net_turnover', label: 'Xifra de negocis', keywords: ['xifra de negocis', 'cifra de negocios', 'ingresos', 'ventas'] },
  { field: 'supplies', label: 'Aprovisionaments', keywords: ['aprovisionaments', 'aprovisionamientos', 'compras'] },
  { field: 'personnel_expenses', label: 'Despeses de personal', keywords: ['despeses personal', 'gastos personal'] },
  { field: 'depreciation', label: 'Amortització', keywords: ['amortització', 'amortización', 'depreciation'] },
  { field: 'financial_income', label: 'Ingressos financers', keywords: ['ingressos financers'] },
  { field: 'financial_expenses', label: 'Despeses financeres', keywords: ['despeses financeres'] },
  { field: 'corporate_tax', label: 'Impost sobre beneficis', keywords: ['impost beneficis', 'impuesto sociedades'] },
];

// API4:2023 - Rate limiting for PDF processing
const RATE_LIMIT_CONFIG = {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000 // 20 per hour
};

// API4:2023 - Custom payload limits for PDF content
const PDF_PAYLOAD_LIMITS = {
  ...DEFAULT_PAYLOAD_LIMITS,
  maxBodySize: 10 * 1024 * 1024, // 10MB for PDFs
  maxStringLength: 100000 // Allow larger strings for base64 content
};

// API8:2023 - Input validation
function validatePDFInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  if (!data.pdfContent || typeof data.pdfContent !== 'string') {
    return { valid: false, error: 'PDF content is required' };
  }
  
  // Validate base64 format (basic check)
  if (!/^[A-Za-z0-9+/=]+$/.test(data.pdfContent.substring(0, 1000))) {
    return { valid: false, error: 'Invalid PDF content format' };
  }
  
  if (data.pdfContent.length > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'PDF content too large (max 10MB)' };
  }
  
  if (data.companyName && typeof data.companyName === 'string' && data.companyName.length > 200) {
    return { valid: false, error: 'Company name too long' };
  }
  
  if (data.fiscalYear) {
    const year = parseInt(data.fiscalYear);
    if (isNaN(year) || year < 1900 || year > 2100) {
      return { valid: false, error: 'Invalid fiscal year' };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  // API8:2023 - Handle CORS preflight with secure headers
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Initialize Supabase for auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("authorization") || '' } } }
    );

    // API2:2023 - Authentication validation
    const authResult = await validateAuthentication(
      req.headers.get("authorization"),
      supabase
    );
    
    if (!authResult.valid) {
      logSecurityEvent({
        type: 'auth_failure',
        severity: 'high',
        ip: clientIp,
        endpoint: '/parse-financial-pdf',
        details: authResult.error || 'Authentication failed',
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse({ error: "Unauthorized", mappedFields: [] }, 401);
    }

    const userId = authResult.userId!;

    // API5:2023 - Function level authorization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    const roles = userRoles?.map(r => r.role) || [];
    const authz = checkFunctionAuthorization(roles, ['write', 'import_data']);
    
    if (!authz.authorized) {
      logSecurityEvent({
        type: 'bola_violation',
        severity: 'high',
        userId,
        ip: clientIp,
        endpoint: '/parse-financial-pdf',
        details: `Missing permissions: ${authz.missingPermissions.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse({ error: "Forbidden - Insufficient permissions", mappedFields: [] }, 403);
    }

    // API4:2023 - Rate limiting
    const rateLimit = checkRateLimit({
      identifier: `${userId}:pdf-parse`,
      maxRequests: RATE_LIMIT_CONFIG.maxRequests,
      windowMs: RATE_LIMIT_CONFIG.windowMs
    });
    
    if (!rateLimit.allowed) {
      logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        userId,
        ip: clientIp,
        endpoint: '/parse-financial-pdf',
        details: 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse(
        { error: "Rate limit exceeded. Please try again later.", mappedFields: [] },
        429,
        { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() }
      );
    }

    // API6:2023 - Business flow protection
    const flowProtection = protectBusinessFlow(userId, {
      flowName: 'pdf_parsing',
      maxAttempts: 10,
      cooldownMs: 60000 // 1 minute
    });
    
    if (!flowProtection.allowed) {
      return createSecureResponse(
        { error: flowProtection.reason, mappedFields: [], waitTimeMs: flowProtection.waitTimeMs },
        429
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return createSecureResponse({ error: "Invalid JSON body", mappedFields: [] }, 400);
    }

    // API8:2023 - Input validation
    const inputValidation = validatePDFInput(requestBody);
    if (!inputValidation.valid) {
      return createSecureResponse({ error: inputValidation.error, mappedFields: [] }, 400);
    }

    const { pdfContent, companyName, fiscalYear, statementId } = requestBody;
    
    // Sanitize inputs
    const sanitizedCompanyName = companyName ? sanitizeInput(companyName) : 'Unknown';
    const sanitizedFiscalYear = fiscalYear || new Date().getFullYear();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return createSecureResponse({ error: 'AI service not configured', mappedFields: [] }, 500);
    }

    console.log(`[PDF-PARSE] Processing for user ${userId}, company: ${sanitizedCompanyName}, year: ${sanitizedFiscalYear}`);

    const fieldsList = [
      ...balanceSheetFields.map(f => `- ${f.label} (${f.field})`),
      ...incomeStatementFields.map(f => `- ${f.label} (${f.field})`)
    ].join('\n');

    const systemPrompt = `Ets un expert en comptabilitat segons el Pla General de Comptabilitat d'Andorra (PGC).
La teva tasca és extreure valors numèrics d'un document de comptes anuals en PDF.

Has d'identificar i extreure els següents camps:
${fieldsList}

INSTRUCCIONS:
1. Cerca cada camp en el document
2. Extreu el valor numèric corresponent (sense símbols de moneda)
3. Els valors han de ser en euros
4. Si un camp no es troba, no l'incloguis
5. Retorna NOMÉS un JSON vàlid

FORMAT DE RESPOSTA:
{
  "mappedFields": [
    {
      "field": "nom_del_camp",
      "label": "Etiqueta descriptiva",
      "value": 12345.67,
      "confidence": 0.95
    }
  ]
}`;

    // Limit PDF content to prevent token overflow
    const truncatedPdfContent = pdfContent.substring(0, 50000);
    
    const userPrompt = `Analitza aquest document de comptes anuals de l'empresa "${sanitizedCompanyName}" per a l'exercici ${sanitizedFiscalYear}.

Extreu tots els valors numèrics que puguis identificar dels estats financers.

Document PDF (contingut base64):
${truncatedPdfContent}

Retorna un JSON amb els camps trobats.`;

    // API10:2023 - Safe external API call
    const aiResponse = await safeExternalAPICall(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 4000
        }),
      },
      60000 // 60 second timeout for PDF processing
    );

    if (!aiResponse.success) {
      console.error('AI API error:', aiResponse.error);
      
      if (aiResponse.error === 'Request timeout') {
        return createSecureResponse({ 
          error: 'Processing timeout. Try with a smaller document.', 
          mappedFields: [] 
        }, 504);
      }
      
      return createSecureResponse({ error: 'AI service error', mappedFields: [] }, 500);
    }

    const content = aiResponse.data.choices?.[0]?.message?.content || '';
    
    console.log('[PDF-PARSE] AI Response received, parsing...');

    let extractedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return createSecureResponse({ 
        mappedFields: [],
        message: 'No s\'han pogut extreure dades del document' 
      }, 200);
    }

    // Validate and sanitize extracted fields
    const mappedFields = (extractedData.mappedFields || [])
      .filter((f: { field: string; value: number; confidence: number }) => 
        f.field && 
        typeof f.field === 'string' &&
        f.field.length <= 100 &&
        typeof f.value === 'number' && 
        !isNaN(f.value) &&
        isFinite(f.value) &&
        f.confidence >= 0.5
      )
      .slice(0, 50) // Limit number of fields
      .map((f: { field: string; label?: string; value: number; confidence: number }) => {
        const balanceField = balanceSheetFields.find(bf => bf.field === f.field);
        const incomeField = incomeStatementFields.find(inf => inf.field === f.field);
        
        return {
          field: balanceField ? `balance_${f.field}` : incomeField ? `income_${f.field}` : sanitizeInput(f.field),
          label: sanitizeInput(f.label || balanceField?.label || incomeField?.label || f.field),
          value: Math.round(f.value * 100) / 100, // Round to 2 decimal places
          confidence: Math.min(1, Math.max(0, f.confidence))
        };
      });

    console.log(`[PDF-PARSE] Extracted ${mappedFields.length} fields`);

    return createSecureResponse({ 
      mappedFields,
      message: `S'han extret ${mappedFields.length} camps del document`
    }, 200);

  } catch (error) {
    console.error('Error in parse-financial-pdf:', error);
    // API8:2023 - Don't expose internal error details
    return createSecureResponse({ 
      error: 'Internal server error',
      mappedFields: []
    }, 500);
  }
});
