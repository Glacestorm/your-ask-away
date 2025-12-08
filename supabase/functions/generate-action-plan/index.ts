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
  sanitizeInput
} from "../_shared/owasp-security.ts";

interface MetricAnalysis {
  metric: string;
  personal: number;
  office: number;
  team: number;
  gap_office: number;
  gap_team: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

// API4:2023 - Rate limiting for AI operations
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000 // 10 per hour
};

// API8:2023 - Input validation
function validateMetricAnalysis(data: any): { valid: boolean; error?: string } {
  if (!data || !Array.isArray(data)) {
    return { valid: false, error: 'metricAnalyses must be an array' };
  }
  
  if (data.length === 0 || data.length > 20) {
    return { valid: false, error: 'metricAnalyses must contain 1-20 items' };
  }
  
  for (const item of data) {
    if (typeof item.metric !== 'string' || item.metric.length > 50) {
      return { valid: false, error: 'Invalid metric name' };
    }
    if (typeof item.personal !== 'number' || item.personal < 0 || item.personal > 1000) {
      return { valid: false, error: 'Invalid personal value' };
    }
    if (typeof item.office !== 'number' || item.office < 0 || item.office > 1000) {
      return { valid: false, error: 'Invalid office value' };
    }
    if (typeof item.team !== 'number' || item.team < 0 || item.team > 1000) {
      return { valid: false, error: 'Invalid team value' };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  // API8:2023 - Handle CORS preflight with secure headers
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

  try {
    // API2:2023 - Authentication validation
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("authorization") || '' } } }
    );

    const authResult = await validateAuthentication(
      req.headers.get("authorization"),
      supabase
    );
    
    if (!authResult.valid) {
      logSecurityEvent({
        type: 'auth_failure',
        severity: 'high',
        ip: clientIp,
        endpoint: '/generate-action-plan',
        details: authResult.error || 'Authentication failed',
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse({ error: "Unauthorized" }, 401);
    }

    const userId = authResult.userId!;

    // API5:2023 - Function level authorization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    const roles = userRoles?.map(r => r.role) || [];
    const authz = checkFunctionAuthorization(roles, ['write']);
    
    if (!authz.authorized) {
      logSecurityEvent({
        type: 'bola_violation',
        severity: 'high',
        userId,
        ip: clientIp,
        endpoint: '/generate-action-plan',
        details: `Missing permissions: ${authz.missingPermissions.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse({ error: "Forbidden" }, 403);
    }

    // API4:2023 - Rate limiting
    const rateLimit = checkRateLimit({
      identifier: `${userId}:action-plan`,
      maxRequests: RATE_LIMIT_CONFIG.maxRequests,
      windowMs: RATE_LIMIT_CONFIG.windowMs
    });
    
    if (!rateLimit.allowed) {
      logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        userId,
        ip: clientIp,
        endpoint: '/generate-action-plan',
        details: 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse(
        { error: "Rate limit exceeded. Please try again later." },
        429,
        { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() }
      );
    }

    // API6:2023 - Business flow protection
    const flowProtection = protectBusinessFlow(userId, {
      flowName: 'action_plan_generation',
      maxAttempts: 5,
      cooldownMs: 300000 // 5 minutes
    });
    
    if (!flowProtection.allowed) {
      return createSecureResponse(
        { error: flowProtection.reason, waitTimeMs: flowProtection.waitTimeMs },
        429
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return createSecureResponse({ error: "Invalid JSON body" }, 400);
    }

    // API4:2023 - Payload size validation
    const payloadValidation = validatePayloadSize(requestBody);
    if (!payloadValidation.valid) {
      return createSecureResponse({ error: payloadValidation.error }, 400);
    }

    const { metricAnalyses, language = 'es' } = requestBody;

    // API8:2023 - Input validation
    const inputValidation = validateMetricAnalysis(metricAnalyses);
    if (!inputValidation.valid) {
      return createSecureResponse({ error: inputValidation.error }, 400);
    }

    // Validate language
    const allowedLanguages = ['es', 'en', 'ca', 'fr'];
    const sanitizedLanguage = allowedLanguages.includes(language) ? language : 'es';

    // Find metrics that need improvement
    const metricsNeedingImprovement = metricAnalyses.filter((m: MetricAnalysis) => 
      m.gap_office < 0 || m.gap_team < 0
    );

    if (metricsNeedingImprovement.length === 0) {
      return createSecureResponse({ 
        error: "No metrics need improvement", 
        message: "All metrics are performing above average" 
      }, 400);
    }

    // Sort by priority (worst performing first)
    metricsNeedingImprovement.sort((a: MetricAnalysis, b: MetricAnalysis) => {
      const avgGapA = (a.gap_office + a.gap_team) / 2;
      const avgGapB = (b.gap_office + b.gap_team) / 2;
      return avgGapA - avgGapB;
    });

    const topPriorityMetric = metricsNeedingImprovement[0];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return createSecureResponse({ error: "AI service not configured" }, 500);
    }

    const systemPrompt = `You are an expert business performance coach specializing in sales and client relationship management. 
Create a detailed, actionable improvement plan for a sales manager (gestor) who needs to improve their performance in a specific metric.

The plan should:
- Be realistic and achievable within 30 days
- Include 4-6 specific action steps
- Each step should have a clear timeline
- Focus on practical, concrete actions
- Consider the specific context of banking/financial services
- Be motivating and encouraging

Return a JSON object with this exact structure:
{
  "title": "Short, motivating title for the plan (max 60 characters)",
  "description": "Brief description (max 200 characters)",
  "steps": [
    {
      "step_number": 1,
      "title": "Clear action step title (max 80 characters)",
      "description": "Detailed description (max 300 characters)",
      "days_from_now": 7
    }
  ]
}`;

    const metricLabels: Record<string, Record<string, string>> = {
      es: {
        visits: "Visitas Totales",
        successful_visits: "Visitas Exitosas",
        companies: "Empresas Asignadas",
        products_offered: "Productos Ofrecidos",
        average_vinculacion: "Vinculación Promedio"
      },
      en: {
        visits: "Total Visits",
        successful_visits: "Successful Visits",
        companies: "Assigned Companies",
        products_offered: "Products Offered",
        average_vinculacion: "Average Linkage"
      }
    };

    const metricLabel = metricLabels[sanitizedLanguage]?.[topPriorityMetric.metric] || topPriorityMetric.metric;

    const userPrompt = `Create a 30-day improvement plan for a sales manager who needs to improve their performance in: ${sanitizeInput(metricLabel)}

Current Performance:
- Personal average: ${topPriorityMetric.personal.toFixed(1)}%
- Office average: ${topPriorityMetric.office.toFixed(1)}%
- Team average: ${topPriorityMetric.team.toFixed(1)}%
- Gap vs office: ${topPriorityMetric.gap_office.toFixed(1)}%
- Gap vs team: ${topPriorityMetric.gap_team.toFixed(1)}%

Respond in ${sanitizedLanguage === 'es' ? 'Spanish' : sanitizedLanguage === 'ca' ? 'Catalan' : sanitizedLanguage === 'fr' ? 'French' : 'English'}.`;

    console.log(`[ACTION-PLAN] Generating for user ${userId}, metric: ${topPriorityMetric.metric}`);
    
    // API10:2023 - Safe external API call
    const aiResponse = await safeExternalAPICall(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          max_tokens: 2000
        }),
      },
      30000
    );

    if (!aiResponse.success) {
      console.error("AI API error:", aiResponse.error);
      return createSecureResponse({ error: "AI service error" }, 500);
    }

    let generatedPlan;
    try {
      generatedPlan = JSON.parse(aiResponse.data.choices[0].message.content);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return createSecureResponse({ error: "Failed to parse AI response" }, 500);
    }

    // Validate AI response structure
    if (!generatedPlan.title || !generatedPlan.steps || !Array.isArray(generatedPlan.steps)) {
      return createSecureResponse({ error: "Invalid AI response structure" }, 500);
    }

    // Calculate target date (30 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    // Insert action plan
    const { data: planData, error: planError } = await supabase
      .from("action_plans")
      .insert({
        user_id: userId,
        title: sanitizeInput(generatedPlan.title).substring(0, 60),
        description: sanitizeInput(generatedPlan.description || '').substring(0, 200),
        status: "active",
        target_metric: topPriorityMetric.metric,
        current_value: topPriorityMetric.personal,
        target_value: Math.max(topPriorityMetric.office, topPriorityMetric.team),
        gap_percentage: (topPriorityMetric.gap_office + topPriorityMetric.gap_team) / 2,
        target_date: targetDate.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (planError) {
      console.error("Error creating action plan:", planError);
      return createSecureResponse({ error: "Failed to create action plan" }, 500);
    }

    // Insert action steps with sanitization
    const stepsToInsert = generatedPlan.steps.slice(0, 10).map((step: any, index: number) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (step.days_from_now || (index + 1) * 5));
      
      return {
        plan_id: planData.id,
        step_number: step.step_number || index + 1,
        title: sanitizeInput(step.title || '').substring(0, 80),
        description: sanitizeInput(step.description || '').substring(0, 300),
        due_date: dueDate.toISOString().split('T')[0],
        completed: false,
      };
    });

    const { error: stepsError } = await supabase
      .from("action_plan_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      console.error("Error creating action steps:", stepsError);
      await supabase.from("action_plans").delete().eq("id", planData.id);
      return createSecureResponse({ error: "Failed to create action steps" }, 500);
    }

    console.log(`[ACTION-PLAN] Created successfully: ${planData.id}`);

    return createSecureResponse({ 
      success: true, 
      plan_id: planData.id,
      plan: planData
    }, 200);

  } catch (error) {
    console.error("Error in generate-action-plan:", error);
    // API8:2023 - Don't expose internal error details
    return createSecureResponse({ error: "Internal server error" }, 500);
  }
});
