import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication - only cron jobs, service role, or authenticated users can access
  const authResult = validateCronOrServiceAuth(req);
  if (!authResult.valid) {
    console.error('Authentication failed:', authResult.error);
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  console.log(`Authenticated request from source: ${authResult.source}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { interventionId, action, userId } = await req.json();

    // Handle manual actions (approve, reject, revert)
    if (action && interventionId) {
      const { data: intervention } = await supabase
        .from('ai_interventions')
        .select('*')
        .eq('id', interventionId)
        .single();

      if (!intervention) {
        return new Response(JSON.stringify({ error: 'Intervention not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'approve') {
        // Execute the proposed solution
        await supabase
          .from('ai_interventions')
          .update({
            status: 'executed',
            executed_at: new Date().toISOString(),
            executed_by: userId || 'manual_approval'
          })
          .eq('id', interventionId);

        return new Response(JSON.stringify({ success: true, message: 'Intervention approved and executed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'reject') {
        await supabase
          .from('ai_interventions')
          .update({ status: 'rejected' })
          .eq('id', interventionId);

        return new Response(JSON.stringify({ success: true, message: 'Intervention rejected' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'revert') {
        if (intervention.status !== 'executed') {
          return new Response(JSON.stringify({ error: 'Can only revert executed interventions' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Apply rollback data if available
        if (intervention.rollback_data) {
          console.log('Applying rollback:', intervention.rollback_data);
          // Here you would apply the rollback logic based on the stored data
        }

        await supabase
          .from('ai_interventions')
          .update({
            status: 'reverted',
            reverted_at: new Date().toISOString(),
            reverted_by: userId
          })
          .eq('id', interventionId);

        return new Response(JSON.stringify({ success: true, message: 'Intervention reverted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get pending interventions that need AI analysis
    const { data: pendingInterventions } = await supabase
      .from('ai_interventions')
      .select('*')
      .eq('status', 'pending')
      .eq('ai_analysis', 'Pendiente de análisis');

    if (!pendingInterventions || pendingInterventions.length === 0) {
      // Check for auto-execute interventions past their deadline
      const { data: autoExecuteInterventions } = await supabase
        .from('ai_interventions')
        .select('*')
        .eq('status', 'pending')
        .lt('auto_execute_at', new Date().toISOString());

      if (autoExecuteInterventions && autoExecuteInterventions.length > 0) {
        console.log(`Found ${autoExecuteInterventions.length} interventions ready for auto-execution`);
        
        for (const intervention of autoExecuteInterventions) {
          // Auto-execute the intervention
          await supabase
            .from('ai_interventions')
            .update({
              status: 'executed',
              executed_at: new Date().toISOString(),
              executed_by: 'ai_auto'
            })
            .eq('id', intervention.id);

          console.log(`Auto-executed intervention ${intervention.id}`);
        }

        return new Response(JSON.stringify({
          success: true,
          autoExecuted: autoExecuteInterventions.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ message: 'No pending interventions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use AI to analyze issues and propose solutions
    if (lovableApiKey) {
      for (const intervention of pendingInterventions) {
        const systemPrompt = `Eres un experto en sistemas y diagnóstico de aplicaciones web empresariales. 
Tu tarea es analizar problemas del sistema y proponer soluciones concretas y ejecutables.
Responde SIEMPRE en español.
Las soluciones deben ser:
1. Específicas y accionables
2. Seguras de implementar
3. Con pasos claros
4. Con consideraciones de rollback

Formato de respuesta JSON:
{
  "analysis": "Análisis detallado del problema",
  "rootCause": "Causa raíz identificada",
  "solution": "Descripción de la solución propuesta",
  "steps": ["Paso 1", "Paso 2", ...],
  "riskLevel": "low|medium|high",
  "autoExecutable": true|false,
  "rollbackSteps": ["Paso rollback 1", ...]
}`;

        const userPrompt = `Analiza el siguiente problema del sistema y propón una solución:

Problema: ${intervention.issue_description}

Contexto: Este es un sistema de gestión empresarial bancario con módulos de:
- Autenticación y roles
- Gestión de empresas y contactos
- Visitas y fichas comerciales
- Contabilidad y estados financieros
- Objetivos y metas
- Notificaciones y alertas
- Almacenamiento de archivos
- Base de datos PostgreSQL (Supabase)

Proporciona un análisis completo y una solución práctica.`;

        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content || '';
            
            // Parse AI response
            let analysis = aiResponse;
            let solution = 'Revisar manualmente el problema';
            let rollbackData = null;

            try {
              // Try to extract JSON from response
              const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                analysis = `${parsed.analysis}\n\nCausa raíz: ${parsed.rootCause}\n\nNivel de riesgo: ${parsed.riskLevel}`;
                solution = `${parsed.solution}\n\nPasos:\n${parsed.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'Ver análisis'}`;
                rollbackData = { 
                  steps: parsed.rollbackSteps,
                  autoExecutable: parsed.autoExecutable 
                };
              }
            } catch (parseError) {
              console.log('Could not parse AI response as JSON, using raw text');
            }

            // Update intervention with AI analysis
            await supabase
              .from('ai_interventions')
              .update({
                ai_analysis: analysis,
                proposed_solution: solution,
                rollback_data: rollbackData
              })
              .eq('id', intervention.id);

            console.log(`AI analysis completed for intervention ${intervention.id}`);
          } else {
            console.error('AI API error:', response.status, await response.text());
          }
        } catch (aiError: any) {
          console.error('AI analysis error:', aiError);
          
          // Update with error
          await supabase
            .from('ai_interventions')
            .update({
              ai_analysis: `Error en análisis automático: ${aiError.message}`,
              proposed_solution: 'Requiere revisión manual por el administrador'
            })
            .eq('id', intervention.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      analyzed: pendingInterventions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Analyze system issues error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
