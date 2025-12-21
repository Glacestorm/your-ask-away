import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClosedLoopAction {
  action: string;
  feedback_loop_id: string;
  notes?: string;
  resolution_notes?: string;
  recovery_score?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, feedback_loop_id, notes, resolution_notes, recovery_score } = await req.json() as ClosedLoopAction;

    if (!feedback_loop_id) {
      return new Response(
        JSON.stringify({ error: 'feedback_loop_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-closed-loop] Processing action: ${action} for loop ${feedback_loop_id}`);

    // Get current feedback loop
    const { data: feedbackLoop, error: fetchError } = await supabase
      .from('feedback_loops')
      .select('*, companies(name, gestor_id)')
      .eq('id', feedback_loop_id)
      .single();

    if (fetchError || !feedbackLoop) {
      return new Response(
        JSON.stringify({ error: 'Feedback loop not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updateData: any = { updated_at: new Date().toISOString() };
    let result: any = { success: true };

    switch (action) {
      case 'start_followup':
        updateData.status = 'in_progress';
        updateData.followup_date = new Date().toISOString();
        if (notes) updateData.followup_notes = notes;
        break;

      case 'mark_contacted':
        updateData.status = 'contacted';
        if (notes) updateData.followup_notes = (feedbackLoop.followup_notes || '') + '\n---\n' + notes;
        break;

      case 'resolve':
        updateData.status = 'resolved';
        updateData.closed_at = new Date().toISOString();
        if (resolution_notes) updateData.resolution_notes = resolution_notes;
        
        // Schedule recovery survey in 30 days
        const recoverySurveyDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        updateData.recovery_survey_scheduled = recoverySurveyDate.toISOString();
        
        result.recovery_survey_scheduled = recoverySurveyDate;
        break;

      case 'mark_recovered':
        updateData.status = 'recovered';
        updateData.is_recovered = true;
        updateData.closed_at = new Date().toISOString();
        if (recovery_score !== undefined) updateData.recovery_score = recovery_score;
        if (resolution_notes) updateData.resolution_notes = resolution_notes;
        
        // Update VoC metrics
        await updateRecoveryMetrics(supabase, feedbackLoop);
        break;

      case 'escalate':
        updateData.status = 'escalated';
        updateData.escalation_level = (feedbackLoop.escalation_level || 0) + 1;
        updateData.escalated_at = new Date().toISOString();
        updateData.escalation_reason = notes;
        
        // Find manager to escalate to
        const managerId = await findManagerForEscalation(supabase, feedbackLoop);
        if (managerId) {
          updateData.escalated_to = managerId;
          
          // Create notification for manager
          await createEscalationNotification(supabase, feedbackLoop, managerId, notes);
        }
        break;

      case 'close_no_action':
        updateData.status = 'closed_no_action';
        updateData.closed_at = new Date().toISOString();
        if (resolution_notes) updateData.resolution_notes = resolution_notes;
        break;

      case 'reassign':
        // This would need a new assignee parameter
        break;

      case 'check_sla':
        // Check and process SLA breaches
        const slaResult = await checkAndProcessSLABreaches(supabase);
        result.sla_breaches = slaResult;
        break;

      case 'send_recovery_surveys':
        // Send scheduled recovery surveys
        const surveyResult = await sendRecoverySurveys(supabase);
        result.surveys_sent = surveyResult;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update feedback loop
    if (Object.keys(updateData).length > 1) {
      const { error: updateError } = await supabase
        .from('feedback_loops')
        .update(updateData)
        .eq('id', feedback_loop_id);

      if (updateError) {
        console.error('[process-closed-loop] Update error:', updateError);
        throw updateError;
      }
    }

    console.log(`[process-closed-loop] Successfully processed action: ${action}`);

    return new Response(
      JSON.stringify({
        ...result,
        feedback_loop_id,
        action,
        new_status: updateData.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[process-closed-loop] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function findManagerForEscalation(supabase: any, feedbackLoop: any): Promise<string | null> {
  // Get current assignee's office
  if (feedbackLoop.assigned_to) {
    const { data: assignee } = await supabase
      .from('profiles')
      .select('oficina')
      .eq('id', feedbackLoop.assigned_to)
      .single();

    if (assignee?.oficina) {
      // Find office director
      const { data: director } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'director_oficina')
        .single();

      if (director) return director.user_id;
    }
  }

  // Fallback to commercial director
  const { data: commercialDirector } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'director_comercial')
    .limit(1)
    .single();

  return commercialDirector?.user_id || null;
}

async function createEscalationNotification(
  supabase: any,
  feedbackLoop: any,
  managerId: string,
  reason: string | undefined
): Promise<void> {
  const companyName = feedbackLoop.companies?.name || 'Cliente';
  
  await supabase.from('notifications').insert({
    user_id: managerId,
    title: 'Escalación de Feedback Loop',
    message: `El caso de ${companyName} (NPS: ${feedbackLoop.original_score}) ha sido escalado. ${reason || ''}`,
    severity: feedbackLoop.priority === 'critical' ? 'critical' : 'warning',
    category: 'feedback_escalation'
  });

  // Also create AI task for follow-up
  await supabase.from('ai_task_queue').insert({
    task_type: 'feedback_escalation',
    task_title: `Revisar escalación: ${companyName}`,
    task_description: `El feedback de ${companyName} ha sido escalado por: ${reason || 'SLA vencido'}. Score original: ${feedbackLoop.original_score}`,
    target_entity_type: 'feedback_loop',
    target_entity_id: feedbackLoop.id,
    target_gestor_id: managerId,
    priority: 9,
    suggested_action: 'Contactar al cliente inmediatamente y revisar el caso'
  });
}

async function updateRecoveryMetrics(supabase: any, feedbackLoop: any): Promise<void> {
  // This would update the VoC analytics cache with recovery data
  console.log(`[process-closed-loop] Detractor recovered for company ${feedbackLoop.company_id}`);
}

async function checkAndProcessSLABreaches(supabase: any): Promise<number> {
  const now = new Date().toISOString();
  
  // Find feedback loops with breached SLA
  const { data: breached } = await supabase
    .from('feedback_loops')
    .select('id, company_id, assigned_to, sla_deadline, escalation_level')
    .lt('sla_deadline', now)
    .in('status', ['pending', 'assigned', 'in_progress'])
    .lt('escalation_level', 3);

  if (!breached || breached.length === 0) return 0;

  let escalatedCount = 0;

  for (const loop of breached) {
    // Auto-escalate
    const managerId = await findManagerForEscalation(supabase, loop);
    
    await supabase
      .from('feedback_loops')
      .update({
        status: 'escalated',
        escalation_level: (loop.escalation_level || 0) + 1,
        escalated_at: now,
        escalated_to: managerId,
        escalation_reason: 'SLA breach - automatic escalation'
      })
      .eq('id', loop.id);

    if (managerId) {
      await createEscalationNotification(supabase, loop, managerId, 'SLA breach - automatic escalation');
    }

    escalatedCount++;
  }

  console.log(`[process-closed-loop] Auto-escalated ${escalatedCount} feedback loops for SLA breach`);
  return escalatedCount;
}

async function sendRecoverySurveys(supabase: any): Promise<number> {
  const now = new Date().toISOString();
  
  // Find feedback loops with scheduled recovery surveys
  const { data: scheduled } = await supabase
    .from('feedback_loops')
    .select('id, company_id, contact_id')
    .lte('recovery_survey_scheduled', now)
    .is('recovery_survey_sent_at', null)
    .in('status', ['resolved', 'recovered']);

  if (!scheduled || scheduled.length === 0) return 0;

  let sentCount = 0;

  for (const loop of scheduled) {
    // Check throttling
    const { data: canSend } = await supabase
      .rpc('can_send_survey', {
        p_company_id: loop.company_id,
        p_contact_id: loop.contact_id,
        p_survey_type: 'nps'
      });

    if (canSend) {
      // Mark as sent (actual sending would be done via email service)
      await supabase
        .from('feedback_loops')
        .update({ recovery_survey_sent_at: now })
        .eq('id', loop.id);

      sentCount++;
    }
  }

  console.log(`[process-closed-loop] Scheduled ${sentCount} recovery surveys`);
  return sentCount;
}