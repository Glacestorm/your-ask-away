import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExecuteRequest {
  nbaId: string;
  userId: string;
  executionData?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { nbaId, userId, executionData } = await req.json() as ExecuteRequest;

    if (!nbaId || !userId) {
      return new Response(JSON.stringify({ error: "nbaId and userId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the NBA with action type
    const { data: nba, error: nbaError } = await supabase
      .from('nba_queue')
      .select(`
        *,
        action_type:nba_action_types(*)
      `)
      .eq('id', nbaId)
      .single();

    if (nbaError || !nba) {
      return new Response(JSON.stringify({ error: "NBA not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionType = nba.action_type as any;
    let executionResult: Record<string, unknown> = {};
    let mrrImpact = 0;
    let success = true;

    // Execute based on action type
    switch (actionType.action_code) {
      case 'CALL_HOT_LEAD':
      case 'RETENTION_CALL':
        // Log the call intent - actual call tracking would be external
        executionResult = {
          action: 'call_initiated',
          entity_type: nba.entity_type,
          entity_id: nba.entity_id,
          timestamp: new Date().toISOString(),
          ...executionData,
        };
        mrrImpact = nba.estimated_value || actionType.estimated_mrr_impact || 0;
        
        // Create a follow-up task
        await supabase.from('ai_task_queue').insert({
          target_gestor_id: userId,
          task_type: 'follow_up',
          task_title: `Seguimiento de llamada - ${nba.context_data?.company_name || 'Cliente'}`,
          task_description: `Registrar resultado de la llamada iniciada desde NBA`,
          target_entity_type: nba.entity_type,
          target_entity_id: nba.entity_id,
          priority: 7,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ai_reasoning: nba.ai_reasoning,
        });
        break;

      case 'SCHEDULE_VISIT':
        // Create a visit or redirect to visit creation
        if (executionData?.visitDate) {
          const { data: newVisit, error: visitError } = await supabase
            .from('visits')
            .insert({
              company_id: nba.entity_id,
              gestor_id: userId,
              date: executionData.visitDate,
              type: 'commercial',
              result: 'pending',
              notes: nba.ai_reasoning,
            })
            .select()
            .single();

          if (visitError) {
            success = false;
            executionResult = { error: visitError.message };
          } else {
            executionResult = {
              action: 'visit_created',
              visit_id: newVisit.id,
              ...executionData,
            };
            mrrImpact = nba.estimated_value || actionType.estimated_mrr_impact || 0;
          }
        } else {
          executionResult = {
            action: 'redirect',
            path: `/visitas/nueva?company=${nba.entity_id}`,
          };
        }
        break;

      case 'SEND_PROPOSAL':
        // Create proposal record or redirect
        executionResult = {
          action: 'redirect',
          path: `/oportunidades/${nba.entity_id}/propuesta`,
          entity_type: nba.entity_type,
          entity_id: nba.entity_id,
        };
        mrrImpact = nba.estimated_value || actionType.estimated_mrr_impact || 0;
        break;

      case 'CROSS_SELL_PRODUCT':
        // Show cross-sell analysis
        const { data: recommendations } = await supabase.functions.invoke('product-recommendations', {
          body: { companyId: nba.entity_id },
        });

        executionResult = {
          action: 'show_recommendations',
          recommendations: recommendations?.recommendations || [],
          entity_id: nba.entity_id,
        };
        mrrImpact = nba.estimated_value || actionType.estimated_mrr_impact || 0;
        break;

      case 'SPECIAL_OFFER':
        // Create special offer workflow
        executionResult = {
          action: 'redirect',
          path: `/clientes/${nba.entity_id}/ofertas?tipo=retencion`,
          context: nba.context_data,
        };
        mrrImpact = nba.estimated_value || actionType.estimated_mrr_impact || 0;
        break;

      case 'UPDATE_KYC':
        // Trigger KYC update workflow
        executionResult = {
          action: 'redirect',
          path: `/compliance/kyc/${nba.entity_id}`,
          entity_id: nba.entity_id,
        };
        break;

      case 'REVIEW_TRANSACTION':
        // Open transaction review
        executionResult = {
          action: 'redirect',
          path: `/compliance/transacciones/${nba.entity_id}`,
          entity_id: nba.entity_id,
        };
        break;

      case 'SATISFACTION_SURVEY':
        // Send satisfaction survey (automatic)
        // In a real scenario, this would trigger an email
        executionResult = {
          action: 'survey_sent',
          entity_id: nba.entity_id,
          timestamp: new Date().toISOString(),
        };
        break;

      case 'DELEGATE_TASK':
        // Create delegated task
        if (executionData?.assignee) {
          await supabase.from('ai_task_queue').insert({
            target_gestor_id: executionData.assignee,
            task_type: 'delegated',
            task_title: executionData.taskTitle || 'Tarea delegada',
            task_description: executionData.taskDescription || nba.ai_reasoning,
            target_entity_type: nba.entity_type,
            target_entity_id: nba.entity_id,
            priority: 5,
            due_date: executionData.dueDate,
          });
          executionResult = {
            action: 'task_delegated',
            assignee: executionData.assignee,
          };
        } else {
          executionResult = {
            action: 'needs_assignee',
            message: 'Se requiere seleccionar un destinatario',
          };
          success = false;
        }
        break;

      case 'AUTOMATE_FOLLOW_UP':
        // Set up automated follow-up
        executionResult = {
          action: 'automation_created',
          entity_id: nba.entity_id,
          frequency: executionData?.frequency || 'weekly',
        };
        break;

      default:
        executionResult = {
          action: 'unknown',
          actionCode: actionType.action_code,
          message: 'Tipo de acción no implementado',
        };
        success = false;
    }

    // Update NBA status
    if (success) {
      await supabase
        .from('nba_queue')
        .update({
          status: 'completed',
          executed_at: new Date().toISOString(),
          executed_by: userId,
          execution_result: executionResult,
          mrr_impact_actual: mrrImpact,
        })
        .eq('id', nbaId);

      // Log to copilot action log
      await supabase.from('copilot_action_log').insert({
        user_id: userId,
        action_type: actionType.action_code,
        action_source: 'nba',
        entity_type: nba.entity_type,
        entity_id: nba.entity_id,
        action_data: { nbaId, executionResult },
        ai_reasoning: nba.ai_reasoning,
        outcome: 'completed',
        outcome_value: mrrImpact,
      });
    } else {
      // Revert to pending if execution failed
      await supabase
        .from('nba_queue')
        .update({ status: 'pending' })
        .eq('id', nbaId);
    }

    return new Response(JSON.stringify({
      success,
      result: executionResult,
      mrrImpact,
      actionCode: actionType.action_code,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Execute NBA action error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
