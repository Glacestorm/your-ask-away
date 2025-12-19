import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessEventInput {
  entity_type: string;
  entity_id: string;
  action: string;
  from_state?: string;
  to_state?: string;
  metadata?: Record<string, unknown>;
  actor_type?: 'user' | 'system' | 'automation';
  tenant_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const input: ProcessEventInput = await req.json();
    
    console.log('Emitting process event:', {
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      actor_id: userId
    });

    // Validate required fields
    if (!input.entity_type || !input.entity_id || !input.action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entity_type, entity_id, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate duration from previous event
    const { data: lastEvent } = await supabase
      .from('process_events')
      .select('occurred_at')
      .eq('entity_type', input.entity_type)
      .eq('entity_id', input.entity_id)
      .order('occurred_at', { ascending: false })
      .limit(1)
      .single();

    let durationMs: number | null = null;
    if (lastEvent) {
      const lastTime = new Date(lastEvent.occurred_at).getTime();
      durationMs = Date.now() - lastTime;
    }

    // Insert the event
    const { data: event, error: insertError } = await supabase
      .from('process_events')
      .insert({
        tenant_id: input.tenant_id || null,
        actor_id: userId,
        actor_type: input.actor_type || (userId ? 'user' : 'system'),
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action,
        from_state: input.from_state || null,
        to_state: input.to_state || null,
        metadata: input.metadata || {},
        duration_ms: durationMs,
        occurred_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting event:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Event emitted successfully:', event.id);

    // Trigger BPMN engine asynchronously (fire and forget)
    try {
      await supabase.functions.invoke('bpmn-engine', {
        body: { event_id: event.id, event }
      });
    } catch (engineError) {
      console.warn('BPMN engine trigger failed (non-blocking):', engineError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: event.id,
        duration_ms: durationMs 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in emit-process-event:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
