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

interface CopilotRequest {
  action: 'generate_suggestions' | 'execute_action' | 'quick_action';
  userId: string;
  role?: string;
  context?: Record<string, unknown>;
  suggestion?: unknown;
  actionId?: string;
  quickActionId?: string;
}

serve(async (req) => {
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[copilot-assistant] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting ===
    const rateCheck = checkRateLimit({
      maxRequests: 100,
      windowMs: 60000,
      identifier: `copilot-assistant:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[copilot-assistant] Rate limit exceeded: ${clientIp}`);
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

    // === Authentication ===
    const authResult = await validateAuthentication(
      req.headers.get('Authorization'),
      supabase
    );

    if (!authResult.valid) {
      console.warn(`[copilot-assistant] Auth failed: ${authResult.error}`);
      return createSecureResponse(
        { success: false, error: 'unauthorized', message: authResult.error || 'No autorizado' },
        401
      );
    }

    // === Parse & Validate Body ===
    let body: CopilotRequest;
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

    const { action, userId, role, context, suggestion, actionId, quickActionId } = body;

    // Use authenticated user ID if not provided
    const effectiveUserId = userId || authResult.userId;

    if (!effectiveUserId) {
      return createSecureResponse({ 
        success: false, 
        error: 'validation_error', 
        message: 'userId es requerido' 
      }, 400);
    }

    console.log(`[copilot-assistant] Action: ${action} for user ${effectiveUserId}`);

    // Get copilot config for role
    const { data: copilotConfig } = await supabase
      .from('copilot_role_configs')
      .select('*')
      .eq('role', role || 'gestor')
      .eq('is_active', true)
      .single();

    let result: unknown;

    if (action === 'generate_suggestions') {
      result = { suggestions: await generateSuggestions(supabase, effectiveUserId, role || 'gestor', copilotConfig, context) };
    } else if (action === 'execute_action') {
      result = await executeAction(supabase, effectiveUserId, suggestion, actionId);
    } else if (action === 'quick_action') {
      result = await handleQuickAction(supabase, effectiveUserId, role || 'gestor', quickActionId || '');
    } else {
      return createSecureResponse({ 
        success: false, 
        error: 'invalid_action', 
        message: 'Acción no válida' 
      }, 400);
    }

    const duration = Date.now() - startTime;
    console.log(`[copilot-assistant] Success: ${action} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      ...result as Record<string, unknown>,
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[copilot-assistant] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error desconocido',
      requestId
    }, 500);
  }
});

async function generateSuggestions(
  supabase: any,
  userId: string,
  role: string,
  copilotConfig: unknown,
  context?: Record<string, unknown>
) {
  const suggestions: unknown[] = [];
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (role === 'gestor') {
    // Get gestor-specific data
    const { data: hotOpportunities } = await supabase
      .from('opportunities')
      .select('*, company:companies(name)')
      .eq('owner_id', userId)
      .gte('probability', 70)
      .in('stage', ['proposal', 'negotiation'])
      .limit(5);

    const { data: churnRiskCustomers } = await supabase
      .from('customer_360_profiles')
      .select('*, company:companies(name, gestor_id)')
      .gte('churn_probability', 0.6)
      .limit(5);

    // Generate suggestions based on data
    if (hotOpportunities?.length) {
      hotOpportunities.forEach((opp: Record<string, unknown>) => {
        const company = opp.company as Record<string, unknown> | null;
        suggestions.push({
          id: `hot-opp-${opp.id}`,
          type: 'action',
          title: `Cerrar oportunidad: ${opp.title}`,
          description: `${company?.name} tiene ${opp.probability}% de probabilidad. Valor estimado: €${(opp.estimated_value as number)?.toLocaleString()}`,
          priority: 'high',
          actionType: 'SEND_PROPOSAL',
          entityType: 'opportunity',
          entityId: opp.id,
          estimatedValue: opp.estimated_value,
          confidence: (opp.probability as number) / 100,
          reasoning: 'Oportunidad con alta probabilidad de cierre. Recomendación: contactar hoy.',
          actions: [
            { id: 'call', label: 'Llamar ahora', type: 'primary', actionCode: 'CALL_HOT_LEAD' },
            { id: 'proposal', label: 'Enviar propuesta', type: 'secondary', actionCode: 'SEND_PROPOSAL' },
            { id: 'dismiss', label: 'Descartar', type: 'dismiss' },
          ],
        });
      });
    }

    if (churnRiskCustomers?.length) {
      churnRiskCustomers.forEach((customer: Record<string, unknown>) => {
        const company = customer.company as Record<string, unknown> | null;
        if (company?.gestor_id === userId) {
          suggestions.push({
            id: `churn-${customer.company_id}`,
            type: 'alert',
            title: `Riesgo de churn: ${company?.name}`,
            description: `Probabilidad de churn: ${((customer.churn_probability as number) * 100).toFixed(0)}%. Última visita: ${customer.last_visit_date || 'Sin visitas recientes'}`,
            priority: 'critical',
            actionType: 'RETENTION_CALL',
            entityType: 'company',
            entityId: customer.company_id,
            estimatedValue: 3000,
            confidence: customer.churn_probability,
            reasoning: 'Cliente con alto riesgo de abandono. Acción inmediata recomendada.',
            actions: [
              { id: 'call', label: 'Llamada de retención', type: 'primary', actionCode: 'RETENTION_CALL' },
              { id: 'offer', label: 'Oferta especial', type: 'secondary', actionCode: 'SPECIAL_OFFER' },
              { id: 'dismiss', label: 'Descartar', type: 'dismiss' },
            ],
          });
        }
      });
    }

    // Cross-sell suggestions
    const { data: companiesWithFewProducts } = await supabase
      .from('companies')
      .select('id, name, facturacion_anual')
      .eq('gestor_id', userId)
      .gte('facturacion_anual', 1000000)
      .limit(5);

    if (companiesWithFewProducts?.length) {
      companiesWithFewProducts.slice(0, 2).forEach((company: Record<string, unknown>) => {
        suggestions.push({
          id: `crosssell-${company.id}`,
          type: 'recommendation',
          title: `Cross-sell: ${company.name}`,
          description: `Cliente con facturación €${(company.facturacion_anual as number)?.toLocaleString()}. Potencial para productos adicionales.`,
          priority: 'medium',
          actionType: 'CROSS_SELL_PRODUCT',
          entityType: 'company',
          entityId: company.id,
          estimatedValue: 800,
          confidence: 0.65,
          reasoning: 'Cliente de alto valor con espacio para más productos.',
          actions: [
            { id: 'analyze', label: 'Ver análisis', type: 'primary', actionCode: 'CROSS_SELL_PRODUCT' },
            { id: 'dismiss', label: 'Descartar', type: 'dismiss' },
          ],
        });
      });
    }

  } else if (role === 'director_oficina') {
    // Director office suggestions
    const { data: gestoresUndeperforming } = await supabase
      .from('sales_quotas')
      .select('*, gestor:profiles(full_name)')
      .lt('current_value', 0.5)
      .eq('period_type', 'monthly')
      .limit(5);

    if (gestoresUndeperforming?.length) {
      gestoresUndeperforming.forEach((quota: Record<string, unknown>) => {
        const gestor = quota.gestor as Record<string, unknown> | null;
        suggestions.push({
          id: `coaching-${quota.gestor_id}`,
          type: 'insight',
          title: `Coaching necesario: ${gestor?.full_name}`,
          description: `Progreso: ${(((quota.current_value as number) / (quota.target_value as number)) * 100).toFixed(0)}% del objetivo. Necesita apoyo.`,
          priority: 'high',
          actionType: 'DELEGATE_TASK',
          entityType: 'profile',
          entityId: quota.gestor_id,
          confidence: 0.8,
          reasoning: 'Gestor por debajo del 50% del objetivo a mitad de período.',
          actions: [
            { id: 'meeting', label: 'Programar reunión', type: 'primary' },
            { id: 'dismiss', label: 'Descartar', type: 'dismiss' },
          ],
        });
      });
    }

  } else if (role === 'director_comercial') {
    // Strategic suggestions for commercial director
    const { data: revenueSignals } = await supabase
      .from('revenue_signals')
      .select('*')
      .eq('is_read', false)
      .order('priority', { ascending: false })
      .limit(5);

    if (revenueSignals?.length) {
      revenueSignals.forEach((signal: Record<string, unknown>) => {
        suggestions.push({
          id: `signal-${signal.id}`,
          type: signal.signal_type === 'risk' ? 'alert' : 'insight',
          title: signal.title,
          description: signal.description,
          priority: (signal.priority as number) >= 8 ? 'high' : 'medium',
          entityType: signal.entity_type,
          entityId: signal.entity_id,
          estimatedValue: signal.estimated_impact,
          confidence: 0.75,
          reasoning: signal.ai_recommendation,
          actions: [
            { id: 'action', label: 'Tomar acción', type: 'primary' },
            { id: 'dismiss', label: 'Descartar', type: 'dismiss' },
          ],
        });
      });
    }

  } else if (role === 'admin') {
    // Compliance and security suggestions
    const { data: openAlerts } = await supabase
      .from('control_alerts')
      .select('*, control:continuous_controls(control_name, control_category)')
      .eq('status', 'open')
      .eq('severity', 'critical')
      .limit(5);

    if (openAlerts?.length) {
      openAlerts.forEach((alert: Record<string, unknown>) => {
        const control = alert.control as Record<string, unknown> | null;
        suggestions.push({
          id: `alert-${alert.id}`,
          type: 'alert',
          title: alert.title,
          description: alert.description || `Control: ${control?.control_name}`,
          priority: 'critical',
          actionType: 'REVIEW_TRANSACTION',
          entityType: 'control_alert',
          entityId: alert.id,
          confidence: 0.9,
          reasoning: 'Alerta crítica requiere atención inmediata.',
          actions: [
            { id: 'review', label: 'Revisar ahora', type: 'primary' },
            { id: 'acknowledge', label: 'Reconocer', type: 'secondary' },
            { id: 'dismiss', label: 'Descartar', type: 'dismiss' },
          ],
        });
      });
    }
  }

  // Sort by priority and confidence
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  suggestions.sort((a: unknown, b: unknown) => {
    const aObj = a as { priority: string; confidence: number };
    const bObj = b as { priority: string; confidence: number };
    const priorityDiff = (priorityOrder[aObj.priority as keyof typeof priorityOrder] ?? 4) - 
                        (priorityOrder[bObj.priority as keyof typeof priorityOrder] ?? 4);
    if (priorityDiff !== 0) return priorityDiff;
    return bObj.confidence - aObj.confidence;
  });

  return suggestions.slice(0, 10);
}

async function executeAction(
  supabase: any, 
  userId: string, 
  suggestion: unknown, 
  actionId?: string
) {
  const suggestionObj = suggestion as { actions?: Array<{ id: string; actionCode?: string }>; entityType?: string; entityId?: string };
  const actionCode = suggestionObj?.actions?.find((a) => a.id === actionId)?.actionCode;

  if (!actionCode) {
    return { success: false, message: 'No action code found' };
  }

  console.log(`Executing action ${actionCode} for user ${userId} on entity ${suggestionObj.entityType}/${suggestionObj.entityId}`);

  return {
    success: true,
    actionCode,
    entityType: suggestionObj.entityType,
    entityId: suggestionObj.entityId,
    message: `Acción ${actionCode} iniciada correctamente`,
  };
}

async function handleQuickAction(
  supabase: any, 
  userId: string, 
  role: string, 
  quickActionId: string
) {
  const quickActionHandlers: Record<string, () => Promise<unknown>> = {
    'next_visit': async () => {
      const { data } = await supabase
        .from('visits')
        .select('*, company:companies(name, address)')
        .eq('gestor_id', userId)
        .eq('result', 'pending')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1)
        .single();
      
      return {
        type: 'redirect',
        path: data ? `/visitas/${data.id}` : '/visitas',
        data,
      };
    },
    'hot_leads': async () => {
      const { data } = await supabase
        .from('opportunities')
        .select('*, company:companies(name)')
        .eq('owner_id', userId)
        .gte('probability', 70)
        .in('stage', ['proposal', 'negotiation'])
        .limit(10);
      
      return {
        type: 'list',
        title: 'Leads Calientes',
        data,
      };
    },
    'pending_proposals': async () => {
      const { data } = await supabase
        .from('opportunities')
        .select('*, company:companies(name)')
        .eq('owner_id', userId)
        .eq('stage', 'proposal')
        .limit(10);
      
      return {
        type: 'list',
        title: 'Propuestas Pendientes',
        data,
      };
    },
    'team_status': async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('oficina')
        .eq('id', userId)
        .single();
      
      const { data: team } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('oficina', profile?.oficina)
        .neq('id', userId);
      
      return {
        type: 'list',
        title: 'Estado del Equipo',
        data: team,
      };
    },
    'at_risk': async () => {
      const { data } = await supabase
        .from('sales_quotas')
        .select('*, gestor:profiles(full_name)')
        .lt('current_value', 0.5)
        .eq('period_type', 'monthly');
      
      return {
        type: 'list',
        title: 'Objetivos en Riesgo',
        data,
      };
    },
    'compliance_status': async () => {
      const { data } = await supabase
        .from('control_alerts')
        .select('*')
        .eq('status', 'open')
        .order('severity', { ascending: false })
        .limit(10);
      
      return {
        type: 'list',
        title: 'Estado de Compliance',
        data,
      };
    },
    'security_alerts': async () => {
      const { data } = await supabase
        .from('control_alerts')
        .select('*, control:continuous_controls(control_category)')
        .eq('status', 'open')
        .order('severity', { ascending: false })
        .limit(10);
      
      const securityAlerts = data?.filter((a: Record<string, unknown>) => {
        const control = a.control as Record<string, unknown> | null;
        return control?.control_category === 'security';
      });
      
      return {
        type: 'list',
        title: 'Alertas de Seguridad',
        data: securityAlerts,
      };
    },
  };

  const handler = quickActionHandlers[quickActionId];
  if (!handler) {
    return { error: 'Quick action not found' };
  }

  return await handler();
}
