import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  handleOptionsRequest, 
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize,
  validateAuthentication
} from '../_shared/owasp-security.ts';
import { getClientIP, generateRequestId } from '../_shared/edge-function-template.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[credit-scoring] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting (strict for sensitive financial operation) ===
    const rateCheck = checkRateLimit({
      maxRequests: 20,
      windowMs: 60000,
      identifier: `credit-scoring:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[credit-scoring] Rate limit exceeded: ${clientIp}`);
      return createSecureResponse({ 
        success: false,
        error: 'rate_limit_exceeded', 
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter: Math.ceil(rateCheck.resetIn / 1000)
      }, 429);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // === Authentication (required for financial operations) ===
    const authResult = await validateAuthentication(
      req.headers.get('Authorization'),
      supabase
    );

    if (!authResult.valid) {
      console.warn(`[credit-scoring] Auth failed: ${authResult.error}`);
      return createSecureResponse(
        { success: false, error: 'unauthorized', message: authResult.error || 'No autorizado' },
        401
      );
    }

    // === Parse & Validate Body ===
    let body: { companyId: string };
    try {
      body = await req.json();
    } catch {
      return createSecureResponse({ 
        success: false, 
        error: 'invalid_json', 
        message: 'El cuerpo no es JSON válido' 
      }, 400);
    }

    const payloadCheck = validatePayloadSize(body);
    if (!payloadCheck.valid) {
      return createSecureResponse({ 
        success: false, 
        error: 'payload_too_large', 
        message: payloadCheck.error 
      }, 413);
    }

    const { companyId } = body;
    
    if (!companyId || typeof companyId !== 'string') {
      return createSecureResponse({ 
        success: false, 
        error: 'validation_error', 
        message: 'companyId es requerido' 
      }, 400);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return createSecureResponse({ 
        success: false, 
        error: 'validation_error', 
        message: 'companyId debe ser un UUID válido' 
      }, 400);
    }

    console.log(`[credit-scoring] Calculating score for company ${companyId}`);

    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*, company_bank_affiliations(*), company_products(*)")
      .eq("id", companyId)
      .single();

    if (companyError) {
      console.error(`[credit-scoring] Company not found: ${companyError.message}`);
      return createSecureResponse({ 
        success: false, 
        error: 'not_found', 
        message: 'Empresa no encontrada' 
      }, 404);
    }

    // Fetch financial data
    const { data: financials } = await supabase
      .from("company_financial_statements")
      .select("*, balance_sheets(*), income_statements(*)")
      .eq("company_id", companyId)
      .order("fiscal_year", { ascending: false })
      .limit(3);

    // Fetch visit history
    const { data: visits } = await supabase
      .from("visits")
      .select("*")
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .limit(10);

    // Use AI to calculate credit score
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Ets un expert en anàlisi creditícia bancària. Calcula un scoring creditici (0-1000) basat en les dades financeres i comportamentals proporcionades.

CRITERIS D'AVALUACIÓ:
1. Solvència (30%): Ratio endeutament, cobertura interessos, liquiditat
2. Rendibilitat (25%): ROE, ROA, marges operatius
3. Estabilitat (20%): Antiguitat, volatilitat ingressos, sector
4. Relació bancària (15%): Productes contractats, vinculació, visites
5. Factors qualitatius (10%): Gestió, mercat, competència

ESCALA DE RATING:
- AAA (900-1000): Risc molt baix
- AA (800-899): Risc baix
- A (700-799): Risc moderat-baix
- BBB (600-699): Risc moderat
- BB (500-599): Risc moderat-alt
- B (400-499): Risc alt
- CCC (300-399): Risc molt alt
- CC (200-299): Risc extrem
- C (100-199): Default probable
- D (0-99): Default

Respon NOMÉS amb JSON vàlid seguint l'estructura especificada.`;

    const userPrompt = `Calcula el scoring creditici per a aquesta empresa:

DADES EMPRESA:
${JSON.stringify(company, null, 2)}

DADES FINANCERES (últims 3 anys):
${JSON.stringify(financials || [], null, 2)}

HISTORIAL VISITES:
${JSON.stringify(visits || [], null, 2)}

Retorna JSON amb:
{
  "score": número 0-1000,
  "rating": "AAA"|"AA"|"A"|"BBB"|"BB"|"B"|"CCC"|"CC"|"C"|"D",
  "riskLevel": "very_low"|"low"|"moderate"|"high"|"very_high",
  "probability_of_default": número 0-1,
  "factors": [
    {
      "name": "nom factor",
      "impact": "positive"|"negative"|"neutral",
      "weight": 0-1,
      "value": valor actual,
      "benchmark": valor referència sector,
      "description": "explicació impacte"
    }
  ],
  "recommendations": ["recomanacions per millorar"],
  "explainability": {
    "methodology": "descripció metodologia",
    "key_drivers": ["factors clau que determinen el score"],
    "model_confidence": 0-1,
    "data_quality_score": 0-1,
    "regulatory_compliance": ["IFRS9", "Basel III", etc]
  }
}`;

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
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`[credit-scoring] AI rate limit exceeded`);
        return createSecureResponse({ 
          success: false,
          error: 'rate_limit_exceeded', 
          message: 'Demasiadas solicitudes a IA. Intenta más tarde.' 
        }, 429);
      }
      if (response.status === 402) {
        return createSecureResponse({ 
          success: false,
          error: 'payment_required', 
          message: 'Créditos de IA insuficientes.' 
        }, 402);
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Clean JSON
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error(`[credit-scoring] Failed to parse AI response:`, content.substring(0, 200));
      throw new Error("Invalid AI response format");
    }

    // Log for audit
    await supabase.from("audit_logs").insert({
      action: "credit_scoring",
      table_name: "companies",
      record_id: companyId,
      user_id: authResult.userId,
      new_data: { score: result.score, rating: result.rating },
      category: "ai_analysis",
      severity: "info"
    });

    const duration = Date.now() - startTime;
    console.log(`[credit-scoring] Success for ${companyId} - Score: ${result.score} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      ...result,
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[credit-scoring] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : "Error desconocido",
      requestId
    }, 500);
  }
});
