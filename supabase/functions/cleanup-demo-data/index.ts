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
    const { sessionId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Cleaning up demo data for session: ${sessionId}`);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('demo_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Demo session not found');
    }

    const dataIds = session.data_ids as Record<string, string[]>;
    const demoUserId = session.demo_user_id;

    let deletedCounts: Record<string, number> = {};

    // Delete in order respecting foreign keys
    
    // 1. Delete visit sheets
    if (dataIds.visitSheets?.length) {
      const { count } = await supabase
        .from('visit_sheets')
        .delete()
        .in('id', dataIds.visitSheets);
      deletedCounts.visitSheets = count || 0;
    }

    // 2. Delete visits
    if (dataIds.visits?.length) {
      const { count } = await supabase
        .from('visits')
        .delete()
        .in('id', dataIds.visits);
      deletedCounts.visits = count || 0;
    }

    // 3. Delete goal assignments first
    if (dataIds.goals?.length) {
      await supabase
        .from('goal_assignments')
        .delete()
        .in('goal_id', dataIds.goals);
    }

    // 4. Delete goals
    if (dataIds.goals?.length) {
      const { count } = await supabase
        .from('goals')
        .delete()
        .in('id', dataIds.goals);
      deletedCounts.goals = count || 0;
    }

    // 5. Delete contacts
    if (dataIds.contacts?.length) {
      const { count } = await supabase
        .from('company_contacts')
        .delete()
        .in('id', dataIds.contacts);
      deletedCounts.contacts = count || 0;
    }

    // 6. Delete company products
    if (dataIds.companies?.length) {
      await supabase
        .from('company_products')
        .delete()
        .in('company_id', dataIds.companies);
    }

    // 7. Delete company documents
    if (dataIds.companies?.length) {
      await supabase
        .from('company_documents')
        .delete()
        .in('company_id', dataIds.companies);
    }

    // 8. Delete company photos
    if (dataIds.companies?.length) {
      await supabase
        .from('company_photos')
        .delete()
        .in('company_id', dataIds.companies);
    }

    // 9. Delete company bank affiliations
    if (dataIds.companies?.length) {
      await supabase
        .from('company_bank_affiliations')
        .delete()
        .in('company_id', dataIds.companies);
    }

    // 10. Delete opportunities
    if (dataIds.companies?.length) {
      await supabase
        .from('opportunities')
        .delete()
        .in('company_id', dataIds.companies);
    }

    // 11. Delete companies
    if (dataIds.companies?.length) {
      const { count } = await supabase
        .from('companies')
        .delete()
        .in('id', dataIds.companies);
      deletedCounts.companies = count || 0;
    }

    // 12. Delete notifications
    if (dataIds.notifications?.length) {
      const { count } = await supabase
        .from('notifications')
        .delete()
        .in('id', dataIds.notifications);
      deletedCounts.notifications = count || 0;
    }

    // 13. Delete user roles
    if (demoUserId) {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', demoUserId);
    }

    // 14. Delete profile
    if (demoUserId) {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', demoUserId);
    }

    // 15. Delete auth user
    if (demoUserId) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(demoUserId);
      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
      }
    }

    // 16. Update session as cleaned
    await supabase
      .from('demo_sessions')
      .update({
        cleanup_status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    console.log('Demo cleanup completed:', deletedCounts);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCounts,
        message: 'Demo data cleaned up successfully'
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
