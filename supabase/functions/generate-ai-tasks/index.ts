import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting AI task generation...");

    const tasks: any[] = [];
    const now = new Date();

    // Get all gestors
    const { data: gestors } = await supabase
      .from('profiles')
      .select('id, full_name, oficina')
      .not('id', 'is', null);

    for (const gestor of gestors || []) {
      // 1. Follow-up tasks for opportunities in negotiation
      const { data: negotiationOpps } = await supabase
        .from('opportunities')
        .select('id, title, estimated_value, estimated_close_date, companies(name)')
        .eq('owner_id', gestor.id)
        .eq('stage', 'negotiation')
        .order('estimated_value', { ascending: false })
        .limit(3);

      for (const opp of negotiationOpps || []) {
        const daysUntilClose = opp.estimated_close_date 
          ? Math.ceil((new Date(opp.estimated_close_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const priority = daysUntilClose !== null && daysUntilClose <= 7 ? 9 : 
                        (opp.estimated_value || 0) > 50000 ? 8 : 6;

        const companyName = (opp.companies as any)?.name || 'Cliente';

        tasks.push({
          task_type: 'follow_up',
          priority,
          target_gestor_id: gestor.id,
          target_entity_type: 'opportunity',
          target_entity_id: opp.id,
          task_title: `Seguimiento: ${opp.title}`,
          task_description: `Oportunidad con ${companyName} en fase de negociación. Valor: ${opp.estimated_value}€`,
          suggested_action: daysUntilClose && daysUntilClose <= 3 
            ? 'Cerrar negociación esta semana - fecha límite próxima'
            : 'Confirmar próximos pasos con el cliente',
          ai_reasoning: `Oportunidad en negociación con ${daysUntilClose ? `${daysUntilClose} días hasta fecha objetivo` : 'sin fecha definida'}. Prioridad basada en valor y urgencia.`,
          estimated_value: opp.estimated_value || 0,
          due_date: opp.estimated_close_date,
        });
      }

      // 2. Visit scheduling for high-value companies without recent visits
      const { data: needVisit } = await supabase
        .from('companies')
        .select('id, name, facturacion_anual, fecha_ultima_visita')
        .eq('gestor_id', gestor.id)
        .gt('facturacion_anual', 100000)
        .or(`fecha_ultima_visita.is.null,fecha_ultima_visita.lt.${new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`)
        .order('facturacion_anual', { ascending: false })
        .limit(5);

      for (const company of needVisit || []) {
        const daysSinceVisit = company.fecha_ultima_visita 
          ? Math.floor((now.getTime() - new Date(company.fecha_ultima_visita).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        tasks.push({
          task_type: 'meeting',
          priority: daysSinceVisit > 30 ? 7 : 5,
          target_gestor_id: gestor.id,
          target_entity_type: 'company',
          target_entity_id: company.id,
          task_title: `Programar visita: ${company.name}`,
          task_description: `Cliente con ${company.facturacion_anual}€ de facturación sin visita en ${daysSinceVisit} días`,
          suggested_action: 'Agendar visita de mantenimiento y detección de necesidades',
          ai_reasoning: `Cliente de alto valor sin contacto reciente. Importante mantener la relación para evitar churn.`,
          estimated_value: company.facturacion_anual * 0.02,
          due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }

      // 3. Cross-sell analysis tasks
      const { data: lowProductCompanies } = await supabase
        .from('companies')
        .select('id, name, facturacion_anual')
        .eq('gestor_id', gestor.id)
        .gt('facturacion_anual', 200000)
        .limit(10);

      for (const company of lowProductCompanies || []) {
        const { count: productCount } = await supabase
          .from('company_products')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('active', true);

        if ((productCount || 0) < 2) {
          tasks.push({
            task_type: 'cross_sell',
            priority: 6,
            target_gestor_id: gestor.id,
            target_entity_type: 'company',
            target_entity_id: company.id,
            task_title: `Oportunidad cross-sell: ${company.name}`,
            task_description: `Cliente con ${company.facturacion_anual}€ facturación pero solo ${productCount || 0} productos. Potencial de venta cruzada.`,
            suggested_action: 'Preparar propuesta de productos complementarios',
            ai_reasoning: `Ratio productos/facturación bajo indica oportunidad de incrementar share-of-wallet con el cliente.`,
            estimated_value: company.facturacion_anual * 0.05,
          });
        }
      }

      // 4. Retention alerts for at-risk companies
      const { data: atRiskCompanies } = await supabase
        .from('customer_segments')
        .select('company_id, churn_probability, companies(name, gestor_id)')
        .gt('churn_probability', 0.5)
        .order('churn_probability', { ascending: false })
        .limit(5);

      for (const segment of atRiskCompanies || []) {
        const segmentCompany = segment.companies as any;
        if (segmentCompany?.gestor_id === gestor.id) {
          tasks.push({
            task_type: 'retention',
            priority: (segment.churn_probability || 0) > 0.75 ? 9 : 7,
            target_gestor_id: gestor.id,
            target_entity_type: 'company',
            target_entity_id: segment.company_id,
            task_title: `Alerta retención: ${segmentCompany?.name || 'Cliente'}`,
            task_description: `Probabilidad de churn del ${((segment.churn_probability || 0) * 100).toFixed(0)}%. Acción inmediata requerida.`,
            suggested_action: 'Contactar al cliente para entender situación y ofrecer soluciones',
            ai_reasoning: `Modelo predictivo indica alto riesgo de pérdida del cliente. Intervención proactiva recomendada.`,
            estimated_value: 10000,
          });
        }
      }
    }

    // Expire old pending tasks
    await supabase
      .from('ai_task_queue')
      .update({ status: 'expired', updated_at: now.toISOString() })
      .eq('status', 'pending')
      .lt('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Insert new tasks (avoiding duplicates by checking existing pending tasks)
    let insertedCount = 0;
    for (const task of tasks) {
      const { data: existing } = await supabase
        .from('ai_task_queue')
        .select('id')
        .eq('target_gestor_id', task.target_gestor_id)
        .eq('target_entity_type', task.target_entity_type)
        .eq('target_entity_id', task.target_entity_id)
        .eq('task_type', task.task_type)
        .eq('status', 'pending')
        .single();

      if (!existing) {
        await supabase.from('ai_task_queue').insert(task);
        insertedCount++;
      }
    }

    console.log(`AI task generation completed. Created ${insertedCount} new tasks.`);

    return new Response(
      JSON.stringify({
        success: true,
        tasksGenerated: insertedCount,
        totalAnalyzed: tasks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error generating AI tasks:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
