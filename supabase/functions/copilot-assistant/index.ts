import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, userId, role, context, suggestion, actionId, quickActionId } = await req.json() as CopilotRequest;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get copilot config for role
    const { data: copilotConfig } = await supabase
      .from('copilot_role_configs')
      .select('*')
      .eq('role', role || 'gestor')
      .eq('is_active', true)
      .single();

    if (action === 'generate_suggestions') {
      const suggestions = await generateSuggestions(supabase, userId, role || 'gestor', copilotConfig, context);
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'execute_action') {
      const result = await executeAction(supabase, userId, suggestion, actionId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'quick_action') {
      const result = await handleQuickAction(supabase, userId, role || 'gestor', quickActionId || '');
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Copilot assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateSuggestions(
  supabase: any,
  userId: string,
  role: string,
  copilotConfig: any,
  context?: Record<string, unknown>
) {
  const suggestions: any[] = [];

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (role === 'gestor') {
    // Get gestor-specific data
    const { data: pendingVisits } = await supabase
      .from('visits')
      .select('*, company:companies(name, facturacion_anual)')
      .eq('gestor_id', userId)
      .eq('result', 'pending')
      .limit(10);

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
      hotOpportunities.forEach((opp: any, index: number) => {
        suggestions.push({
          id: `hot-opp-${opp.id}`,
          type: 'action',
          title: `Cerrar oportunidad: ${opp.title}`,
          description: `${opp.company?.name} tiene ${opp.probability}% de probabilidad. Valor estimado: €${opp.estimated_value?.toLocaleString()}`,
          priority: 'high',
          actionType: 'SEND_PROPOSAL',
          entityType: 'opportunity',
          entityId: opp.id,
          estimatedValue: opp.estimated_value,
          confidence: opp.probability / 100,
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
      churnRiskCustomers.forEach((customer: any) => {
        if (customer.company?.gestor_id === userId) {
          suggestions.push({
            id: `churn-${customer.company_id}`,
            type: 'alert',
            title: `Riesgo de churn: ${customer.company?.name}`,
            description: `Probabilidad de churn: ${(customer.churn_probability * 100).toFixed(0)}%. Última visita: ${customer.last_visit_date || 'Sin visitas recientes'}`,
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
      companiesWithFewProducts.slice(0, 2).forEach((company: any) => {
        suggestions.push({
          id: `crosssell-${company.id}`,
          type: 'recommendation',
          title: `Cross-sell: ${company.name}`,
          description: `Cliente con facturación €${company.facturacion_anual?.toLocaleString()}. Potencial para productos adicionales.`,
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
      .lt('current_value', supabase.raw('target_value * 0.5'))
      .eq('period_type', 'monthly')
      .limit(5);

    if (gestoresUndeperforming?.length) {
      gestoresUndeperforming.forEach((quota: any) => {
        suggestions.push({
          id: `coaching-${quota.gestor_id}`,
          type: 'insight',
          title: `Coaching necesario: ${quota.gestor?.full_name}`,
          description: `Progreso: ${((quota.current_value / quota.target_value) * 100).toFixed(0)}% del objetivo. Necesita apoyo.`,
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
      revenueSignals.forEach((signal: any) => {
        suggestions.push({
          id: `signal-${signal.id}`,
          type: signal.signal_type === 'risk' ? 'alert' : 'insight',
          title: signal.title,
          description: signal.description,
          priority: signal.priority >= 8 ? 'high' : 'medium',
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
      openAlerts.forEach((alert: any) => {
        suggestions.push({
          id: `alert-${alert.id}`,
          type: 'alert',
          title: alert.title,
          description: alert.description || `Control: ${alert.control?.control_name}`,
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
  suggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });

  return suggestions.slice(0, 10);
}

async function executeAction(supabase: any, userId: string, suggestion: any, actionId?: string) {
  // Based on action type, execute the appropriate action
  const actionCode = suggestion?.actions?.find((a: any) => a.id === actionId)?.actionCode;

  if (!actionCode) {
    return { success: false, message: 'No action code found' };
  }

  // Log the execution
  console.log(`Executing action ${actionCode} for user ${userId} on entity ${suggestion.entityType}/${suggestion.entityId}`);

  // Here we would integrate with actual business logic
  // For now, we return success and let the frontend handle specific actions

  return {
    success: true,
    actionCode,
    entityType: suggestion.entityType,
    entityId: suggestion.entityId,
    message: `Acción ${actionCode} iniciada correctamente`,
  };
}

async function handleQuickAction(supabase: any, userId: string, role: string, quickActionId: string) {
  const quickActionHandlers: Record<string, () => Promise<any>> = {
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
        .lt('current_value', supabase.raw('target_value * 0.5'))
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
      
      const securityAlerts = data?.filter((a: any) => a.control?.control_category === 'security');
      
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
