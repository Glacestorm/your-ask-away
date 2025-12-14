import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, cleanupAll } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let sessionsToClean: any[] = [];
    let deletedCounts: Record<string, number> = {};

    if (cleanupAll) {
      // Get all demo sessions that haven't been cleaned
      const { data: allSessions } = await supabase
        .from('demo_sessions')
        .select('*')
        .neq('cleanup_status', 'completed');
      
      sessionsToClean = allSessions || [];
      console.log(`Cleaning up ${sessionsToClean.length} demo sessions`);
    } else {
      // Get single session
      const { data: session, error: sessionError } = await supabase
        .from('demo_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Demo session not found');
      }
      sessionsToClean = [session];
    }

    for (const session of sessionsToClean) {
      console.log(`Cleaning up demo data for session: ${session.id}`);
      
      const dataIds = session.data_ids as Record<string, string[]>;
      const demoUserId = session.demo_user_id;

      // Delete in order respecting foreign keys
      
      // 1. Delete action plan steps first (FK to action_plans)
      if (dataIds.actionPlans?.length) {
        const { count } = await supabase
          .from('action_plan_steps')
          .delete()
          .in('plan_id', dataIds.actionPlans);
        deletedCounts.actionPlanSteps = (deletedCounts.actionPlanSteps || 0) + (count || 0);
      }

      // 2. Delete action plans
      if (dataIds.actionPlans?.length) {
        const { count } = await supabase
          .from('action_plans')
          .delete()
          .in('id', dataIds.actionPlans);
        deletedCounts.actionPlans = (deletedCounts.actionPlans || 0) + (count || 0);
      }

      // 3. Delete best practice comments and likes
      if (dataIds.bestPractices?.length) {
        await supabase.from('best_practice_comments').delete().in('practice_id', dataIds.bestPractices);
        await supabase.from('best_practice_likes').delete().in('practice_id', dataIds.bestPractices);
      }

      // 4. Delete best practices
      if (dataIds.bestPractices?.length) {
        const { count } = await supabase
          .from('best_practices')
          .delete()
          .in('id', dataIds.bestPractices);
        deletedCounts.bestPractices = (deletedCounts.bestPractices || 0) + (count || 0);
      }

      // 5. Delete alert history
      if (dataIds.alerts?.length) {
        await supabase.from('alert_history').delete().in('alert_id', dataIds.alerts);
      }

      // 6. Delete alerts
      if (dataIds.alerts?.length) {
        const { count } = await supabase
          .from('alerts')
          .delete()
          .in('id', dataIds.alerts);
        deletedCounts.alerts = (deletedCounts.alerts || 0) + (count || 0);
      }

      // 7. Delete income statements (FK to financial statements)
      if (dataIds.incomeStatements?.length) {
        const { count } = await supabase
          .from('income_statements')
          .delete()
          .in('id', dataIds.incomeStatements);
        deletedCounts.incomeStatements = (deletedCounts.incomeStatements || 0) + (count || 0);
      }

      // 8. Delete balance sheets (FK to financial statements)
      if (dataIds.balanceSheets?.length) {
        const { count } = await supabase
          .from('balance_sheets')
          .delete()
          .in('id', dataIds.balanceSheets);
        deletedCounts.balanceSheets = (deletedCounts.balanceSheets || 0) + (count || 0);
      }

      // 9. Delete cash flow statements if any (FK to financial statements)
      if (dataIds.financialStatements?.length) {
        await supabase.from('cash_flow_statements').delete().in('statement_id', dataIds.financialStatements);
        await supabase.from('equity_changes_statements').delete().in('statement_id', dataIds.financialStatements);
        await supabase.from('financial_notes').delete().in('statement_id', dataIds.financialStatements);
      }

      // 10. Delete financial statements
      if (dataIds.financialStatements?.length) {
        const { count } = await supabase
          .from('company_financial_statements')
          .delete()
          .in('id', dataIds.financialStatements);
        deletedCounts.financialStatements = (deletedCounts.financialStatements || 0) + (count || 0);
      }

      // 11. Delete visit sheet photos and audit
      if (dataIds.visitSheets?.length) {
        await supabase.from('visit_sheet_photos').delete().in('visit_sheet_id', dataIds.visitSheets);
        await supabase.from('visit_sheet_audit').delete().in('visit_sheet_id', dataIds.visitSheets);
      }

      // 12. Delete visit sheets
      if (dataIds.visitSheets?.length) {
        const { count } = await supabase
          .from('visit_sheets')
          .delete()
          .in('id', dataIds.visitSheets);
        deletedCounts.visitSheets = (deletedCounts.visitSheets || 0) + (count || 0);
      }

      // 13. Delete visit participants
      if (dataIds.visits?.length) {
        await supabase.from('visit_participants').delete().in('visit_id', dataIds.visits);
      }

      // 14. Delete visits
      if (dataIds.visits?.length) {
        const { count } = await supabase
          .from('visits')
          .delete()
          .in('id', dataIds.visits);
        deletedCounts.visits = (deletedCounts.visits || 0) + (count || 0);
      }

      // 15. Delete goal assignments first
      if (dataIds.goals?.length) {
        await supabase.from('goal_assignments').delete().in('goal_id', dataIds.goals);
      }

      // 16. Delete goals
      if (dataIds.goals?.length) {
        const { count } = await supabase
          .from('goals')
          .delete()
          .in('id', dataIds.goals);
        deletedCounts.goals = (deletedCounts.goals || 0) + (count || 0);
      }

      // 17. Delete opportunities
      if (dataIds.opportunities?.length) {
        const { count } = await supabase
          .from('opportunities')
          .delete()
          .in('id', dataIds.opportunities);
        deletedCounts.opportunities = (deletedCounts.opportunities || 0) + (count || 0);
      }

      // 18. Delete contacts
      if (dataIds.contacts?.length) {
        const { count } = await supabase
          .from('company_contacts')
          .delete()
          .in('id', dataIds.contacts);
        deletedCounts.contacts = (deletedCounts.contacts || 0) + (count || 0);
      }

      // 19. Delete company products
      if (dataIds.companyProducts?.length) {
        const { count } = await supabase
          .from('company_products')
          .delete()
          .in('id', dataIds.companyProducts);
        deletedCounts.companyProducts = (deletedCounts.companyProducts || 0) + (count || 0);
      }

      // 20. Delete bank affiliations
      if (dataIds.bankAffiliations?.length) {
        const { count } = await supabase
          .from('company_bank_affiliations')
          .delete()
          .in('id', dataIds.bankAffiliations);
        deletedCounts.bankAffiliations = (deletedCounts.bankAffiliations || 0) + (count || 0);
      }

      // 21. Delete company documents, photos, TPV terminals
      if (dataIds.companies?.length) {
        await supabase.from('company_documents').delete().in('company_id', dataIds.companies);
        await supabase.from('company_photos').delete().in('company_id', dataIds.companies);
        await supabase.from('company_tpv_terminals').delete().in('company_id', dataIds.companies);
      }

      // 22. Delete companies
      if (dataIds.companies?.length) {
        const { count } = await supabase
          .from('companies')
          .delete()
          .in('id', dataIds.companies);
        deletedCounts.companies = (deletedCounts.companies || 0) + (count || 0);
      }

      // 23. Delete notifications
      if (dataIds.notifications?.length) {
        const { count } = await supabase
          .from('notifications')
          .delete()
          .in('id', dataIds.notifications);
        deletedCounts.notifications = (deletedCounts.notifications || 0) + (count || 0);
      }

      // 24. Delete user-related data
      if (demoUserId) {
        // Delete internal assistant conversations
        await supabase.from('internal_assistant_messages').delete().eq('user_id', demoUserId);
        await supabase.from('internal_assistant_conversations').delete().eq('user_id', demoUserId);
        await supabase.from('assistant_conversation_audit').delete().eq('user_id', demoUserId);
        
        // Delete user roles
        await supabase.from('user_roles').delete().eq('user_id', demoUserId);
        
        // Delete profile
        await supabase.from('profiles').delete().eq('id', demoUserId);
        
        // Delete auth user
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(demoUserId);
        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError);
        }
      }

      // 25. Update session as cleaned
      await supabase
        .from('demo_sessions')
        .update({
          cleanup_status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);
    }

    // If cleaning all, also delete all demo sessions
    if (cleanupAll) {
      await supabase.from('demo_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      deletedCounts.demoSessions = sessionsToClean.length;
    }

    console.log('Demo cleanup completed:', deletedCounts);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCounts,
        sessionsCleared: sessionsToClean.length,
        message: cleanupAll ? 'All demo data cleaned up successfully' : 'Demo data cleaned up successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cleaning up demo data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
